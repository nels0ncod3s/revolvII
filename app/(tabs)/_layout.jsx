// app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet, Platform, View } from "react-native";
import { useApp } from "../../Context/appContext";

export default function TabsLayout() {
  const { theme, darkMode } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7c5cff",
        tabBarInactiveTintColor: darkMode ? "#555570" : "#b0b0c0",
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: Platform.OS === "ios" ? "transparent" : theme.tabBar,
          height: 80,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={80} tint={darkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : null,
        // Key fix: use tabBarItemStyle to prevent icon distortion
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home7"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[tab.wrap, focused && tab.active]}>
              <Ionicons
                name={focused ? "house" : "house"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[tab.wrap, focused && tab.active]}>
              <Ionicons
                name={focused ? "calendar-clear" : "calendar-clear-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[tab.wrap, focused && tab.active]}>
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tab = StyleSheet.create({
  wrap: {
    // Fixed size so highlight never distorts
    width: 46, height: 36,
    alignItems: "center", justifyContent: "center",
    borderRadius: 12,
  },
  active: {
    backgroundColor: "rgba(124,92,255,0.12)",
  },
});
