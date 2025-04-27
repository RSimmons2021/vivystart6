import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/user-store';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase'; // Assuming supabase is initialized in this file

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUser, setOnboarded } = useUserStore();
  
  const [name, setName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleComplete = async () => {
    console.log('Button pressed - starting handleComplete');
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    try {
      // First check if we have an active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Session expired', 'Please log in again');
        return router.replace('/login');
      }
      // Then get the user
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        Alert.alert('Authentication required', 'Please log in again');
        return router.replace('/login');
      }
      // Check if user row exists
      let { data: userRow, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message.includes('0 rows'))) {
        // Create user row with required fields
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: name.trim(),
          onboarded: true
        });
        if (insertError) {
          Alert.alert('Failed to create user profile', insertError.message);
          return;
        }
      } else if (fetchError) {
        Alert.alert('Failed to fetch user profile', fetchError.message);
        return;
      } else {
        // Update name if row exists
        const { error: updateError } = await supabase.from('users').update({
          name: name.trim(),
          onboarded: true
        }).eq('id', user.id);
        if (updateError) {
          Alert.alert('Failed to update profile', updateError.message);
          return;
        }
      }
      setUser({ ...user, name: name.trim(), onboarded: true });
      setOnboarded(true);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Onboarding error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>  
        <Text style={styles.title}>Welcome to GLP-1 Tracker</Text>
        <Text style={styles.description}>
          Let's get started by setting up your profile. What's your name?
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textTertiary}
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={handleComplete}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 28,
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
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: Colors.buttonText || '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});