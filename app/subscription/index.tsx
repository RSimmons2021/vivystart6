import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useStripe } from '@/lib/StripeProvider';
import { supabase } from '@/lib/supabase';

// Example subscription options (replace with your actual Stripe Price IDs and details)
const subscriptionOptions = [
  { id: 'price_123', name: 'Monthly Plan', price: '$10/month' },
  { id: 'price_456', name: 'Yearly Plan', price: '$100/year' },
];

const SubscriptionScreen = () => {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!stripe) {
      Alert.alert('Error', 'Stripe is not initialized.');
      return;
    }

    if (!selectedPriceId) {
      Alert.alert('Please select a subscription plan.');
      return;
    }

    setLoading(true);

    try {
      // Call your Supabase function to create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: selectedPriceId },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      const { id: sessionId } = data;

      // Redirect to Stripe checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (redirectError) {
        console.error('Error redirecting to checkout:', redirectError);
        Alert.alert('Error', redirectError.message);
      }
    } catch (error: any) {
      console.error('An unexpected error occurred:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Subscription Plan</Text>

      {subscriptionOptions.map((option) => (
        <View key={option.id} style={styles.optionContainer}>
          <Text style={styles.optionName}>{option.name}</Text>
          <Text style={styles.optionPrice}>{option.price}</Text>
          <Button
            title={selectedPriceId === option.id ? 'Selected' : 'Select'}
            onPress={() => setSelectedPriceId(option.id)}
            disabled={loading}
          />
        </View>
      ))}

      <Button
        title={loading ? 'Processing...' : 'Subscribe'}
        onPress={handleCheckout}
        disabled={loading || !selectedPriceId}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionName: {
    fontSize: 18,
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionScreen;
