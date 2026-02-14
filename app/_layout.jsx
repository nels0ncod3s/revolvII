import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SubscriptionProvider } from "../Context/subscriptionContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    // 1. GestureHandlerRootView is required for BottomSheet to work
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SubscriptionProvider>
          <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionProvider>
    </GestureHandlerRootView>
  );
}



export default function RootLayout() {
  return (
    // This wrapper is what allows the Bottom Sheet to "feel" your taps
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SubscriptionProvider>
    </GestureHandlerRootView>
  );
}