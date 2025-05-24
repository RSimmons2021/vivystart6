import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SubscriptionScreen from './subscription';

export default function TestSubscription() {
  const router = useRouter();

  const testModalNavigation = () => {
    console.log('[TestSubscription] Testing modal navigation...');
    router.push('modal' as any);
  };

  const testDirectSubscription = () => {
    console.log('[TestSubscription] Testing direct subscription navigation...');
    router.push('subscription' as any);
  };

  const testStripeHook = () => {
    console.log('[TestSubscription] Testing Stripe hook...');
    router.push('stripe-test' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Test Subscription</Text>
      </View>
      
      <View style={styles.testButtons}>
        <TouchableOpacity onPress={testStripeHook} style={[styles.testButton, styles.successButton]}>
          <Text style={styles.testButtonText}>✅ Test Stripe Hook (Working)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={testModalNavigation} style={styles.testButton}>
          <Text style={styles.testButtonText}>Test Modal Route</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={testDirectSubscription} style={styles.testButton}>
          <Text style={styles.testButtonText}>Test Direct Subscription Route</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Direct Subscription Component:</Text>
      <SubscriptionScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  testButtons: {
    padding: 16,
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
}); 