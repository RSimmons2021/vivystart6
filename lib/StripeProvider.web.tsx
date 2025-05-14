// Web StripeProvider
import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { StripeProvider as AppStripeProvider } from './StripeContext';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      loadStripe(publishableKey).then(setStripe);
    }
  }, []);

  return (
    <AppStripeProvider stripe={stripe}>
      {children}
    </AppStripeProvider>
  );
};

export default StripeProvider;
