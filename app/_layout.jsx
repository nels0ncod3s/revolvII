import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SubscriptionProvider } from "../Context/subscriptionContext";
import { AppProvider } from "../Context/appContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SubscriptionProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="splash" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AppProvider>
      </SubscriptionProvider>
    </GestureHandlerRootView>
  );
}
