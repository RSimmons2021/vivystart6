import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStripe } from '@/lib';

export default function StripeTest() {
  console.log('[StripeTest] Component rendering...');
  
  let stripe;
  let error = null;
  
  try {
    console.log('[StripeTest] About to call useStripe...');
    stripe = useStripe();
    console.log('[StripeTest] useStripe returned:', { hasStripe: !!stripe, stripeType: typeof stripe });
  } catch (err: any) {
    console.error('[StripeTest] Error calling useStripe:', err);
    error = err.message;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stripe Hook Test</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✅ Success</Text>
          <Text style={styles.successText}>
            useStripe hook called successfully
          </Text>
          <Text style={styles.successText}>
            Stripe instance: {stripe ? 'Available' : 'Not available'}
          </Text>
          <Text style={styles.successText}>
            Stripe type: {typeof stripe}
          </Text>
        </View>
      )}

      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
        <Text style={styles.debugText}>Platform: {process.env.NODE_ENV}</Text>
        <Text style={styles.debugText}>Stripe Key: {process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not set'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1a1a1a',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderColor: '#fcc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d00',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d00',
  },
  successContainer: {
    backgroundColor: '#efe',
    borderColor: '#cfc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#080',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#080',
    marginBottom: 4,
  },
  debugContainer: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 2,
  },
}); 