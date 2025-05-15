import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import SubscriptionScreen from "./subscription"; // Import the SubscriptionScreen

export default function ModalScreen() {
  return (
    <>
      <SubscriptionScreen />
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </>
  );
}
