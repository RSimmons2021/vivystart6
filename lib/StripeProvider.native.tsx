// Native StripeProvider
import React from 'react';
import { StripeProvider as RNStripeProvider, useStripe as useRNStripe } from '@stripe/stripe-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { StripeProvider as AppStripeProvider } from './StripeContext';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

// Bridge component to connect RN Stripe with our context
const StripeBridge: React.FC<{ children: React.ReactElement | React.ReactElement[] }> = ({ children }) => {
  // Use the React Native Stripe hook to get the stripe instance
  const rnStripe = useRNStripe();
  
  // Pass it to our context (note: RN Stripe object is different from web Stripe object)
  // For now, we'll pass the RN stripe object directly
  return (
    <AppStripeProvider stripe={rnStripe as any}>
      {children}
    </AppStripeProvider>
  );
};

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Get publishable key from environment
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Stripe publishable key is not set. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.');
    
    // Show a warning overlay in development
    if (__DEV__) {
      return (
        <AppStripeProvider stripe={null}>
          <View style={styles.container}>
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Stripe Configuration Missing</Text>
              <Text style={styles.warningText}>
                Please set your EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.
              </Text>
              <Text style={styles.warningText}>
                You can get your keys from: https://dashboard.stripe.com/test/apikeys
              </Text>
              <Text style={styles.warningText}>
                ⚠️ Use TEST keys (pk_test_...) for development!
              </Text>
            </View>
            {children}
          </View>
        </AppStripeProvider>
      );
    }
    
    // In production, just render children without Stripe
    return (
      <AppStripeProvider stripe={null}>
        {children}
      </AppStripeProvider>
    );
  }

  // Check if using live keys in development (warning)
  if (__DEV__ && publishableKey.startsWith('pk_live_')) {
    console.warn('⚠️ WARNING: You are using LIVE Stripe keys in development! Use TEST keys instead.');
  }

  return (
    <RNStripeProvider publishableKey={publishableKey}>
      <StripeBridge>
      {children}
      </StripeBridge>
    </RNStripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
});

export default StripeProvider;
