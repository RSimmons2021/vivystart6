import 'react-native-gesture-handler';
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
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Import supabase client
import { useState } from 'react'; // Import useState
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import the modal component directly
import SubscriptionModalScreen from './modal';

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
  const router = useRouter();

  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null); // State to track subscription status

  console.log('[RootLayoutContent] Auth state:', { user, isOnboarded });

  // Fetch user's subscription status after authentication and onboarding
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      // Modified: Check subscription even if not onboarded (for testing)
      if (user) {
        console.log('[RootLayoutContent] Checking subscription status for user:', user.id);
        
        // TEMPORARY: Force show subscription modal for testing
        console.log('[RootLayoutContent] 🧪 FORCING SUBSCRIPTION MODAL FOR TESTING');
        setIsSubscribed(false);
        return;
        
        // Fetching subscription status from the 'users' table
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        console.log('[RootLayoutContent] Subscription query result:', { data, error });

        if (error) {
          console.error('[RootLayoutContent] Error fetching subscription status:', error);
          console.log('[RootLayoutContent] Setting isSubscribed to FALSE due to error');
          setIsSubscribed(false); // Assume not subscribed on error
        } else {
          const subscriptionStatus = data?.subscription_status;
          const isActive = subscriptionStatus === 'active';
          console.log('[RootLayoutContent] Subscription status:', subscriptionStatus);
          console.log('[RootLayoutContent] Is active subscription?', isActive);
          setIsSubscribed(isActive);
          
          // If no subscription status is set, default to inactive (requires subscription)
          if (!subscriptionStatus) {
            console.log('[RootLayoutContent] No subscription status found, defaulting to inactive');
            setIsSubscribed(false);
          }
        }
      } else {
        console.log('[RootLayoutContent] User not ready for subscription check:', { user: !!user });
        setIsSubscribed(null); // Reset status if not authenticated
      }
    };

    fetchSubscriptionStatus();
  }, [user]); // Removed isOnboarded dependency

  // Determine if the subscription modal should be shown
  // Modified: Show subscription modal even if not onboarded (for testing)
  const needsSubscription = user && isSubscribed === false;

  console.log('[RootLayoutContent] Subscription state:', { 
    user: !!user, 
    isOnboarded, 
    isSubscribed, 
    needsSubscription 
  });

  console.log('[RootLayoutContent] 🔍 DETAILED DEBUG:', {
    userExists: !!user,
    userEmail: user?.email,
    isSubscribedValue: isSubscribed,
    isSubscribedType: typeof isSubscribed,
    needsSubscriptionCalc: user && isSubscribed === false,
    needsSubscription: needsSubscription
  });

  // Force update stores to prevent navigation conflicts
  useEffect(() => {
    if (user && needsSubscription) {
      // Ensure all stores know we're in subscription mode
      console.log('[RootLayoutContent] 🛡️ Enforcing subscription mode - preventing navigation overrides');
    }
  }, [user, needsSubscription]);

  useEffect(() => {
    if (needsSubscription) {
      console.log('[RootLayoutContent] 🚀 USER NEEDS SUBSCRIPTION - WILL SHOW MODAL!');
    } else {
      console.log('[RootLayoutContent] Not showing subscription modal:', { needsSubscription });
    }
  }, [needsSubscription, router]);

  // Auth-based routing
  if (!user) {
    console.log('[RootLayoutContent] No user, showing login screen');
    // Not logged in: show login and register screens
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
          {/* If you have a register screen, add it here: <Stack.Screen name="register" /> */}
        </Stack>
      </GestureHandlerRootView>
    );
  }

  // Check subscription BEFORE onboarding (for testing)
  // If user needs subscription, show modal regardless of onboarding status
  if (needsSubscription) {
    console.log('[RootLayoutContent] 🔒 User needs subscription - showing subscription modal before onboarding');
    console.log('[RootLayoutContent] About to render direct modal component...');
    console.log('[RootLayoutContent] ⚠️ BLOCKING ALL OTHER NAVIGATION - SUBSCRIPTION REQUIRED');
    console.log('[RootLayoutContent] 🎯 Full SubscriptionScreen will now be rendered!');
    
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <SubscriptionModalScreen />
        </ErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  // Logged in and subscribed: show onboarding if not onboarded, otherwise main app
  if (!isOnboarded) {
    console.log('[RootLayoutContent] User not onboarded, showing onboarding screen');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </GestureHandlerRootView>
    );
  }

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

  // Logged in and onboarded: show main app
  console.log('[RootLayoutContent] User authenticated and onboarded, showing main app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          {/* Add standalone subscription route for direct navigation */}
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
          {/* Test subscription route for debugging */}
          <Stack.Screen
            name="test-subscription"
            options={{
              title: "Test Subscription",
              headerStyle: {
                backgroundColor: themeColors.background,
              },
              headerTintColor: themeColors.text,
              headerShadowVisible: false,
            }}
          />
          {/* Basic Stripe hook test */}
          <Stack.Screen
            name="stripe-test"
            options={{
              title: "Stripe Test",
              headerStyle: {
                backgroundColor: themeColors.background,
              },
              headerTintColor: themeColors.text,
              headerShadowVisible: false,
            }}
          />
          {/* Test modal route */}
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
        </Stack>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
