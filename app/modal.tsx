import { StatusBar } from "expo-status-bar";
import { Platform, BackHandler } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import SubscriptionScreen from "./subscription";

export default function SubscriptionModalScreen() {
  console.log('[SubscriptionModal] Component rendering...');
  console.log('[SubscriptionModal] SubscriptionScreen imported:', !!SubscriptionScreen);
  
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  console.log('[SubscriptionModal] About to render SubscriptionScreen...');

  const handleSubscriptionSuccess = async () => {
    console.log('[SubscriptionModal] 🎉 Subscription successful! Handling success...');
    
    try {
      // Update user's subscription status in the database
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('id', user?.id);

      if (error) {
        console.error('[SubscriptionModal] Error updating subscription status:', error);
      } else {
        console.log('[SubscriptionModal] ✅ Subscription status updated successfully');
      }

      // Navigate to onboarding or main app
      console.log('[SubscriptionModal] Navigating to onboarding...');
      router.replace('/onboarding');
    } catch (error) {
      console.error('[SubscriptionModal] Error in handleSubscriptionSuccess:', error);
    }
  };

  // Prevent back button on Android from dismissing the modal
  useEffect(() => {
    const backAction = () => {
      // Prevent default back behavior - user must subscribe to continue
      console.log('[SubscriptionModal] Back button pressed - blocking navigation');
      return true; // This prevents the default behavior
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, []);

  return (
    <>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <SubscriptionScreen 
        isModal={true}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </>
  );
}
