import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2020-08-27', // Use a consistent API version
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing Stripe-Signature header or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer as string;
        const subscriptionStatus = subscription.status;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = subscription.current_period_end;

        // Find the user in Supabase by stripe_customer_id and update their subscription status
        const { error: updateSubscriptionError } = await supabaseAdmin
          .from('users') // Use the 'users' table
          .update({
            subscription_status: subscriptionStatus,
            subscription_id: subscriptionId,
            subscription_end_date: new Date(currentPeriodEnd * 1000).toISOString(), // Convert timestamp to ISO string
          })
          .eq('stripe_customer_id', stripeCustomerId);

        if (updateSubscriptionError) {
          console.error('Error updating user subscription status:', updateSubscriptionError);
        } else {
          console.log(`Subscription event [${event.type}] processed for customer ${stripeCustomerId}`);
        }
        break;
      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        const customerId = checkoutSession.customer as string;
        const subscriptionIdFromCheckout = checkoutSession.subscription as string;

        // Find the user in Supabase by stripe_customer_id
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userError || !userData) {
          console.error('Error finding user for completed checkout session:', userError?.message);
          break; // Exit the case
        }

        const userId = userData.id;

        // Fetch the full subscription object from Stripe
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionIdFromCheckout);

          // Update the user's record with more subscription details
          const { error: updateCheckoutError } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscription.status, // Use status from the fetched subscription
              subscription_id: subscription.id, // Use ID from the fetched subscription
              subscription_tier: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id, // Get tier (using lookup_key or price ID)
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(), // Get accurate end date
            })
            .eq('id', userId);

          if (updateCheckoutError) {
            console.error('Error updating user subscription details after checkout:', updateCheckoutError);
          } else {
            console.log(`Checkout session completed and user ${userId} updated with full subscription details.`);
          }

        } catch (fetchError) {
          console.error('Error fetching subscription details from Stripe:', fetchError);
          // Handle error fetching subscription details
        }

        // TODO: Implement any additional post-checkout logic here, e.g., sending a welcome email, granting access to features

        break;
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new Response('Received', { status: 200 });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
