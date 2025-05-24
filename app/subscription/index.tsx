import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useStripe } from '@/lib';
import { supabase } from '@/lib/supabase';
import { subscriptionPlans } from '@/config/stripe';

// Convert subscription plans to options array
const subscriptionOptions = [
  { 
    id: subscriptionPlans.weekly.id, 
    name: subscriptionPlans.weekly.name, 
    price: `$${subscriptionPlans.weekly.price}/${subscriptionPlans.weekly.interval}`,
    interval: subscriptionPlans.weekly.interval,
  },
  { 
    id: subscriptionPlans.monthly.id, 
    name: subscriptionPlans.monthly.name, 
    price: `$${subscriptionPlans.monthly.price}/${subscriptionPlans.monthly.interval}`,
    interval: subscriptionPlans.monthly.interval,
  },
];

interface SubscriptionScreenProps {
  isModal?: boolean;
  onSubscriptionSuccess?: () => void;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ 
  isModal = false, 
  onSubscriptionSuccess 
}) => {
  console.log('[SubscriptionScreen] Component rendering...');
  
  let stripe;
  try {
    stripe = useStripe();
    console.log('[SubscriptionScreen] useStripe called successfully, stripe instance:', !!stripe);
  } catch (error) {
    console.error('[SubscriptionScreen] Error calling useStripe:', error);
    throw error;
  }
  
  const [loading, setLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Debug effect to show configuration status
  useEffect(() => {
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    let debug = `🔍 Debug Info:\n`;
    debug += `Stripe instance: ${stripe ? '✅ Available' : '❌ Not available'}\n`;
    debug += `Publishable key: ${publishableKey ? '✅ Set' : '❌ Not set'}\n`;
    debug += `Environment: ${__DEV__ ? 'Development' : 'Production'}\n`;
    debug += `Selected plan: ${selectedPriceId || 'None'}\n`;
    
    if (publishableKey) {
      debug += `Key preview: ${publishableKey.substring(0, 12)}...\n`;
      debug += `Key type: ${publishableKey.startsWith('pk_live_') ? '🔴 LIVE' : '🟢 TEST'}\n`;
    }
    
    setDebugInfo(debug);
    console.log('[Subscription] Debug info:', debug);
  }, [stripe, selectedPriceId]);

  const handleCheckout = async () => {
    console.log('[Subscription] Starting checkout process...');
    
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Please check your configuration.';
      console.error('[Subscription]', errorMsg);
      Alert.alert('Error', errorMsg);
      return;
    }

    if (!selectedPriceId) {
      Alert.alert('Please select a subscription plan.');
      return;
    }

    // Check if this is a temp/invalid price ID
    if (selectedPriceId.includes('temp') || selectedPriceId.includes('invalid')) {
      Alert.alert(
        'Plan Not Available', 
        'This subscription plan is not yet configured. Please select the Weekly Plan or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    console.log('[Subscription] Creating checkout session for price:', selectedPriceId);

    try {
      // Call your Supabase function to create a checkout session
      console.log('[Subscription] Calling create-checkout-session function...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: selectedPriceId },
      });

      console.log('[Subscription] Supabase function response:', { data, error });

      if (error) {
        console.error('[Subscription] Error creating checkout session:', error);
        // Check for specific error types
        let errorMessage = error.message;
        if (error.message.includes('No such price')) {
          errorMessage = 'This subscription plan is not available. Please select the Weekly Plan.';
        }
        Alert.alert('Error', `Checkout session creation failed: ${errorMessage}`);
        setLoading(false);
        return;
      }

      if (!data || !data.id) {
        console.error('[Subscription] No session ID returned:', data);
        // Show more detailed error if available
        let errorMsg = 'No checkout session ID received from server';
        if (data && data.error) {
          errorMsg += `: ${data.error}`;
          if (data.type) {
            errorMsg += ` (${data.type})`;
          }
          if (data.code) {
            errorMsg += ` [${data.code}]`;
          }
        }
        Alert.alert('Error', errorMsg);
        setLoading(false);
        return;
      }

      const { id: sessionId } = data;
      console.log('[Subscription] Got session ID:', sessionId);
      console.log('[Subscription] Redirecting to Stripe checkout...');

      // Redirect to Stripe checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (redirectError) {
        console.error('[Subscription] Error redirecting to checkout:', redirectError);
        Alert.alert('Error', `Checkout redirect failed: ${redirectError.message}`);
      } else {
        console.log('[Subscription] Successfully redirected to Stripe checkout');
        // If we're in modal mode and have a success callback, we can call it here
        // Note: In a real app, you'd want to handle this via webhooks or return URLs
        if (isModal && onSubscriptionSuccess) {
          // For demo purposes, we'll call success after a delay
          // In production, this should be handled via Stripe webhooks
          setTimeout(() => {
            console.log('[Subscription] Simulating successful subscription for modal');
            onSubscriptionSuccess();
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('[Subscription] An unexpected error occurred:', error);
      let errorMessage = error.message || 'An unexpected error occurred';
      
      // Handle specific Stripe integration errors
      if (errorMessage.includes('live mode') && errorMessage.includes('test mode')) {
        errorMessage = 'There is a configuration mismatch between test and live modes. Please contact support.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {isModal && (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🚀 Unlock VivyStart6</Text>
          <Text style={styles.modalSubtitle}>
            Subscribe to access all features and start your health journey!
          </Text>
        </View>
      )}
      
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Start your journey to better health</Text>

      {/* Debug Information (only in development) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔧 Debug Information</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
          {isModal && (
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: '#28a745', marginTop: 10 }]}
              onPress={() => {
                console.log('[Subscription] Debug: Marking subscription as active');
                if (onSubscriptionSuccess) {
                  onSubscriptionSuccess();
                }
              }}
            >
              <Text style={styles.subscribeButtonText}>
                🧪 Test: Mark as Subscribed
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.plansContainer}>
        {subscriptionOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.planCard,
              selectedPriceId === option.id && styles.selectedPlan
            ]}
            onPress={() => setSelectedPriceId(option.id)}
            disabled={loading}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{option.name}</Text>
              <Text style={styles.planPrice}>{option.price}</Text>
            </View>
            <Text style={styles.planId}>ID: {option.id}</Text>
            <View style={styles.selectionIndicator}>
              {selectedPriceId === option.id && (
                <View style={styles.selectedDot} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          (!selectedPriceId || loading) && styles.disabledButton
        ]}
        onPress={handleCheckout}
        disabled={loading || !selectedPriceId}
      >
        <Text style={styles.subscribeButtonText}>
          {loading ? 'Processing...' : 'Continue to Payment'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Setting up your subscription...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  debugContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1565c0',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1976d2',
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  selectionIndicator: {
    alignItems: 'flex-end',
  },
  selectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalHeader: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0056b3',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
  },
});

export default SubscriptionScreen;
