import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Alert
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
      // Update user profile with name and onboarded
      const { error: updateError } = await supabase.from('users').update({
        name,
        onboarded: true
      }).eq('id', user.id);
      if (updateError) {
        Alert.alert('Failed to update profile', updateError.message);
        return;
      }
      // Update zustand store
      setUser({ ...user, name, onboarded: true });
      setOnboarded(true);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Onboarding error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
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
          onPress={() => {
            console.log('Button pressed directly');
            handleComplete();
          }}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});