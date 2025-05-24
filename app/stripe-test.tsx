import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStripe } from '@/lib';

export default function StripeTestScreen() {
  console.log('[StripeTestScreen] Component rendering...');
  
  let stripe;
  let error = null;
  
  try {
    console.log('[StripeTestScreen] About to call useStripe...');
    stripe = useStripe();
    console.log('[StripeTestScreen] useStripe called successfully, stripe instance:', !!stripe);
    console.log('[StripeTestScreen] Stripe object type:', typeof stripe);
    console.log('[StripeTestScreen] Stripe methods available:', stripe ? Object.keys(stripe) : 'none');
  } catch (err: any) {
    console.error('[StripeTestScreen] Error calling useStripe:', err);
    error = err.message;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stripe Hook Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Hook Status:</Text>
        <Text style={styles.value}>{error ? '❌ Error' : '✅ Success'}</Text>
      </View>
      
      {error && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Error:</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Stripe Instance:</Text>
        <Text style={styles.value}>{stripe ? '✅ Available' : '❌ Not Available'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Stripe Type:</Text>
        <Text style={styles.value}>{stripe ? typeof stripe : 'undefined'}</Text>
      </View>
      
      {stripe && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Available Methods:</Text>
          <Text style={styles.value}>{Object.keys(stripe).slice(0, 5).join(', ')}...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  error: {
    fontSize: 14,
    color: '#ff0000',
  },
}); 