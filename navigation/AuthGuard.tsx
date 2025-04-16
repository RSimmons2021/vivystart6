import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '@/screens/LoginScreen';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
};
