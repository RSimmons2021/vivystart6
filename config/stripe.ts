import { Platform } from 'react-native';

// Get the publishable key from environment variables
const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

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

// Subscription plans - Updated with your actual price ID
export const subscriptionPlans = {
  weekly: {
    id: process.env.EXPO_PUBLIC_STRIPE_PRICE_ID || 'price_1RMJq5H2vZEETphMrfjQ4RdG', // Using env var or fallback
    name: 'Weekly Plan',
    price: 2.99,
    interval: 'week',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  monthly: {
    id: 'YOUR_MONTHLY_PRICE_ID', // TODO: Replace with your actual Monthly Price ID
    name: 'Monthly Plan',
    price: 9.99,
    interval: 'month',
    features: ['All Weekly Features', 'Premium Feature 1', 'Premium Feature 2'],
  },
}; 