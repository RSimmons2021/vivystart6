import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2020-08-27', // Use a consistent API version
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { priceId } = await req.json();

    console.log('Request received:', { priceId, method: req.method });
    console.log('Stripe secret key available:', !!Deno.env.get('STRIPE_SECRET_KEY'));
    
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (secretKey) {
      console.log('Secret key type:', secretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST');
    }

    if (!priceId) {
      console.error('Missing priceId in request');
      return new Response(JSON.stringify({ error: 'Missing priceId in request body' }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    console.log('Creating checkout session for price:', priceId);

    try {
      // First, validate that the price exists
      const price = await stripe.prices.retrieve(priceId);
      console.log('Price retrieved successfully:', { id: price.id, currency: price.currency, unit_amount: price.unit_amount });
    } catch (priceError) {
      console.error('Price validation failed:', priceError);
      return new Response(JSON.stringify({ 
        error: `Invalid price ID: ${priceId}`,
        type: 'invalid_price',
        code: 'price_not_found'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 400,
      });
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
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    console.log('Checkout session created successfully:', { id: session.id, mode: session.mode });

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: error.type || 'unknown_error',
      code: error.code || 'unknown_code'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 500,
    });
  }
});
