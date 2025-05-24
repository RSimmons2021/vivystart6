// Native StripeProvider
import React from 'react';
import { StripeProvider as RNStripeProvider } from '@stripe/stripe-react-native';
import { View, Text, StyleSheet } from 'react-native';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Get publishable key from environment
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Stripe publishable key is not set. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.');
    
    // Show a warning overlay in development
    if (__DEV__) {
      return (
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
      );
    }
    
    // In production, just render children without Stripe
    return <>{children}</>;
  }

  // Check if using live keys in development (warning)
  if (__DEV__ && publishableKey.startsWith('pk_live_')) {
    console.warn('⚠️ WARNING: You are using LIVE Stripe keys in development! Use TEST keys instead.');
  }

  return (
    <RNStripeProvider publishableKey={publishableKey}>
      {children}
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
