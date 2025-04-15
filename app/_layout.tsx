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

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isOnboarded } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { updateLoginStreak } = useGamificationStore();
  const colorScheme = useColorScheme();
  
  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Only hide the splash screen after the fonts have loaded and the UI is ready
      SplashScreen.hideAsync();
      
      // Update login streak when app loads
      updateLoginStreak();
    }
  }, [loaded]);

  if (!loaded) {
    return null; // This will keep the splash screen visible
  }

  return (
    <ErrorBoundary>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack initialRouteName={isOnboarded ? "(tabs)" : "onboarding"}>
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
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
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
      </Stack>
    </ErrorBoundary>
  );
}