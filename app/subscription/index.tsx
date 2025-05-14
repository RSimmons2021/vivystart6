import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useStripe } from '@/lib/StripeProvider';
import { supabase } from '@/lib/supabase';

const SubscriptionScreen = () => {
  const stripe = useStripe();

  const handleCheckout = async () => {
    if (!stripe) {
      console.error('Stripe is not initialized');
      return;
    }

    // TODO: Replace with actual price ID from your Stripe setup
    const priceId = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID;

    if (!priceId) {
      console.error('Stripe price ID is not set.');
      return;
    }

    try {
      // Call your Supabase function to create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return;
      }

      const { id: sessionId } = data;

      // Redirect to Stripe checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (redirectError) {
        console.error('Error redirecting to checkout:', redirectError);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      <Button title="Subscribe" onPress={handleCheckout} />
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
});

export default SubscriptionScreen;
