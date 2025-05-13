import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the publishable key from environment variables
const publishableKey = Constants.expoConfig?.extra?.stripePublishableKey;

// Stripe configuration
export const stripeConfig = {
  publishableKey,
  merchantIdentifier: 'merchant.com.vivystart6', // For Apple Pay
  androidPayMode: 'test', // For Google Pay
};

// Stripe API endpoints
export const stripeEndpoints = {
  createPaymentIntent: '/api/create-payment-intent',
  createSubscription: '/api/create-subscription',
  cancelSubscription: '/api/cancel-subscription',
};

// Subscription plans
export const subscriptionPlans = {
  basic: {
    id: 'price_basic',
    name: 'Basic Plan',
    price: 9.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  premium: {
    id: 'price_premium',
    name: 'Premium Plan',
    price: 19.99,
    features: ['All Basic Features', 'Premium Feature 1', 'Premium Feature 2'],
  },
}; 