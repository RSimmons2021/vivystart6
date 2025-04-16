import React from 'react';
import { Button } from 'react-native';
import { useAuth } from '@/context/AuthProvider';

export const LogoutButton = () => {
  const { logout, loading } = useAuth();
  return <Button title="Logout" onPress={logout} disabled={loading} />;
};
