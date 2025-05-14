import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2020-08-27', // Use a consistent API version
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return new Response('Missing priceId in request body', { status: 400 });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Or 'payment' depending on your use case
      success_url: `${req.headers.get('origin')}/?success=true`, // Redirect URL after successful payment
      cancel_url: `${req.headers.get('origin')}/?canceled=true`, // Redirect URL after canceled payment
      // Add customer email to prefill checkout page
      // customer_email: 'customer@example.com', // You might get this from the user's session
    });

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
