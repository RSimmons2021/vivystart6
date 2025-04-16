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
      await login(email, password);
      // Get the logged in user
      const { data: { user } } = await supabase.auth.getUser();
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

      // If row doesn't exist, create it and treat as new user
      if (error && (error.code === 'PGRST116' || error.message.includes('0 rows'))) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email, onboarded: false });
        if (insertError) {
          alert('Could not create user profile');
          return;
        }
        router.replace('/onboarding');
        return;
      }
      if (error) {
        alert('Failed to fetch user profile');
        return;
      }
      if (data?.onboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } else {
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
