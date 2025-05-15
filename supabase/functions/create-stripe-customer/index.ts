import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2020-08-27', // Use a consistent API version
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { record } = await req.json(); // 'record' contains the new user data from Supabase auth webhook

    if (!record || !record.id) {
      return new Response('Missing user data in request body', { status: 400 });
    }

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      metadata: {
        supabase_user_id: record.id,
      },
    });

    // Update the user's record in Supabase with the Stripe customer ID
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabaseAdmin
      .from('users') // Use the 'users' table as per the provided schema
      .update({ stripe_customer_id: customer.id })
      .eq('id', record.id);

    if (updateError) {
      console.error('Error updating user profile with Stripe customer ID:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ customerId: customer.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
