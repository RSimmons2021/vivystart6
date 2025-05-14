import React, { createContext, useContext } from 'react';
import { Stripe } from '@stripe/stripe-js';

interface StripeContextType {
  stripe: Stripe | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context.stripe;
};

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
  stripe: Stripe | null;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children, stripe }) => {
  return (
    <StripeContext.Provider value={{ stripe }}>
      {children}
    </StripeContext.Provider>
  );
};
