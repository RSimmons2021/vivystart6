import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const { login, register, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

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
        console.log('[LoginScreen] ⚠️ NOTE: If subscription modal should show, layout will override this navigation');
        router.replace('/(tabs)');
      } else {
        console.log('[LoginScreen] User is NOT onboarded. Navigating to onboarding');
        console.log('[LoginScreen] ⚠️ NOTE: If subscription modal should show, layout will override this navigation');
        router.replace('/onboarding');
      }
    } else {
      console.log('[LoginScreen] Register mode for:', email);
      await register(email, password);
      // Do NOT navigate; let the layout handle onboarding
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>  
          <Text style={styles.title}>{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to continue your journey.' : 'Register to get started.'}</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor={Colors.textTertiary}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            onPress={handleAuth}
            style={styles.button}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  card: {
    width: '90%',
    padding: 32,
    borderRadius: 28,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
    color: Colors.text,
    fontSize: 17,
    marginBottom: 18,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  buttonText: {
    color: Colors.buttonText || '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: Colors.primary,
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  error: {
    color: Colors.error || '#e74c3c',
    marginBottom: 10,
    fontSize: 15,
    textAlign: 'center',
  },
};
