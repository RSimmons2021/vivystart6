import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { useUserStore } from "@/store/user-store";
import { useThemeStore } from "@/store/theme-store";
import { useGamificationStore } from "@/store/gamification-store";
import { AuthProvider } from '@/context/AuthProvider';
import { useAuth } from '@/context/AuthProvider';
import StripeProvider from '@/lib/StripeProvider';
import { AuthState } from '@/store/auth-store';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('[RootLayout] Rendering root layout');
  return (
    <AuthProvider>
      <StripeProvider>
        <RootLayoutContent />
      </StripeProvider>
    </AuthProvider>
  );
}

function RootLayoutContent() {
  console.log('[RootLayoutContent] Starting to render content');
  const { isOnboarded } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { updateLoginStreak } = useGamificationStore();
  const colorScheme = useColorScheme();
  const { user } = useAuth() as AuthState;
  
  console.log('[RootLayoutContent] Auth state:', { user, isOnboarded });
  
  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  console.log('[RootLayoutContent] Font loading state:', { loaded, error });

  useEffect(() => {
    if (error) {
      console.error('[RootLayoutContent] Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[RootLayoutContent] Fonts loaded, hiding splash screen');
      // Only hide the splash screen after the fonts have loaded and the UI is ready
      SplashScreen.hideAsync().catch(console.error);
      
      // Update login streak when app loads
      updateLoginStreak();
    }
  }, [loaded]);

  if (!loaded) {
    console.log('[RootLayoutContent] Fonts not loaded yet');
    return null; // This will keep the splash screen visible
  }

  // Auth-based routing
  if (!user) {
    console.log('[RootLayoutContent] No user, showing login screen');
    // Not logged in: show login and register screens
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        {/* If you have a register screen, add it here: <Stack.Screen name="register" /> */}
      </Stack>
    );
  }

  // Logged in: show onboarding if not onboarded, otherwise main app
  if (!isOnboarded) {
    console.log('[RootLayoutContent] User not onboarded, showing onboarding screen');
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    );
  }

  // Logged in and onboarded: show main app
  console.log('[RootLayoutContent] User authenticated and onboarded, showing main app');
  return (
    <ErrorBoundary>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: "Settings",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="meal/[id]" 
          options={{ 
            title: "Meal Details",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="journey/[id]" 
          options={{ 
            title: "Journey Stage",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="achievements" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="challenges" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="subscription/index" 
          options={{ 
            title: "Subscription",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}
