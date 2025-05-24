// Web StripeProvider
import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { StripeProvider as AppStripeProvider } from './StripeContext';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.log('[StripeProvider.web] Initializing with key:', publishableKey ? `${publishableKey.substring(0, 12)}...` : 'NOT SET');
    
    if (publishableKey) {
      loadStripe(publishableKey)
        .then((stripeInstance) => {
          console.log('[StripeProvider.web] Stripe loaded successfully:', !!stripeInstance);
          setStripe(stripeInstance);
        })
        .catch((err) => {
          console.error('[StripeProvider.web] Failed to load Stripe:', err);
          setError(err.message);
        });
    } else {
      console.error('[StripeProvider.web] No Stripe publishable key provided');
      setError('No Stripe publishable key provided');
    }
  }, []);

  if (error) {
    console.error('[StripeProvider.web] Stripe provider error:', error);
    // Still render children but without Stripe (stripe will be null)
    return (
      <AppStripeProvider stripe={null}>
        {children}
      </AppStripeProvider>
    );
  }

  return (
    <AppStripeProvider stripe={stripe}>
      {children}
    </AppStripeProvider>
  );
};

export default StripeProvider;
