// Native StripeProvider
import React from 'react';
import { StripeProvider as RNStripeProvider } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // TODO: Initialize Stripe with publishable key
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Stripe publishable key is not set.');
    return <>{children}</>;
  }

  return (
    <RNStripeProvider publishableKey={publishableKey}>
      {children}
    </RNStripeProvider>
  );
};

export default StripeProvider;
