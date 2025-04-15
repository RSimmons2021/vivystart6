import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { useUserStore } from '@/store/user-store';
import Colors from '@/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUser, setOnboarded } = useUserStore();
  
  const [name, setName] = useState('');
  
  const handleComplete = () => {
    // Complete onboarding with minimal data
    const userData = {
      id: Date.now().toString(),
      name: name || 'User',
      startWeight: 200,
      currentWeight: 200,
      goalWeight: 180,
      height: 70,
      startDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      email: 'user@example.com',
    };
    
    setUser(userData);
    setOnboarded(true);
    router.replace('/(tabs)');
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
        
        <Button
          title="Get Started"
          onPress={handleComplete}
          style={styles.button}
        />
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
    width: '100%',
  },
});