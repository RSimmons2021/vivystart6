import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { 
  Home, 
  LineChart, 
  Target, 
  MessageSquare, 
  Syringe
} from 'lucide-react-native';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

export default function TabLayout() {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shots"
        options={{
          title: 'Shots',
          tabBarIcon: ({ color }) => <Syringe size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <LineChart size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}