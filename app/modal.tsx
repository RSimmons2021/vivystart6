import { StatusBar } from "expo-status-bar";
import { Platform, BackHandler } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import SubscriptionScreen from "./subscription";

export default function SubscriptionModalScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

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

  // Disable swipe-to-dismiss gesture by not providing a way to close the modal
  // The modal can only be closed by successful subscription

  const handleSubscriptionSuccess = async () => {
    console.log('[SubscriptionModal] Subscription successful, updating user status');
    
    if (user) {
      try {
        // Update the user's subscription status in the database
        // Note: In production, this should be handled by Stripe webhooks
        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('id', user.id);

        if (error) {
          console.error('[SubscriptionModal] Error updating subscription status:', error);
        } else {
          console.log('[SubscriptionModal] Successfully updated subscription status');
        }
      } catch (error) {
        console.error('[SubscriptionModal] Exception updating subscription status:', error);
      }
    }

    // Navigate back to main app after successful subscription
    console.log('[SubscriptionModal] Navigating back to main app');
    router.dismissAll(); // Dismiss all modals
    router.replace('/(tabs)' as any); // Navigate to main app
  };

  return (
    <>
      <SubscriptionScreen 
        isModal={true} 
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </>
  );
}
