// app/_layout.jsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SubscriptionProvider } from '../Context/subscriptionContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SubscriptionProvider>
    </GestureHandlerRootView>
  );
}
