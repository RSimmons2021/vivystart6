import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const { login, register, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please fill all fields');
      return;
    }
    if (mode === 'login') {
      console.log('[LoginScreen] Attempting login for:', email);
      await login(email, password);
      // Get the logged in user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[LoginScreen] supabase.auth.getUser() result:', user);
      if (!user) {
        alert('Could not get user');
        return;
      }
      // Try to fetch user row
      let { data, error } = await supabase
        .from('users')
        .select('onboarded')
        .eq('id', user.id)
        .single();
      console.log('[LoginScreen] Fetched user row:', data, 'Error:', error);
      // --- Edit: Remove insert logic for new user, just route to onboarding if user row missing ---
      // If row doesn't exist, immediately go to onboarding (creation will be handled there)
      if (error && (error.code === 'PGRST116' || error.message.includes('0 rows'))) {
        router.replace('/onboarding');
        return;
      }
      if (error) {
        alert('Failed to fetch user profile');
        console.log('[LoginScreen] Failed to fetch user profile. Error:', error);
        return;
      }
      if (data?.onboarded) {
        console.log('[LoginScreen] User is onboarded. Navigating to (tabs)');
        router.replace('/(tabs)');
      } else {
        console.log('[LoginScreen] User is NOT onboarded. Navigating to onboarding');
        router.replace('/onboarding');
      }
    } else {
      console.log('[LoginScreen] Register mode for:', email);
      await register(email, password);
      // After registration, always go to onboarding
      router.replace('/onboarding');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderRadius: 5, marginBottom: 10, padding: 10 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderRadius: 5, marginBottom: 10, padding: 10 }}
        />
        {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
        <TouchableOpacity
          onPress={handleAuth}
          style={{ backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 }}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={{ color: '#007bff', textAlign: 'center' }}>
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
