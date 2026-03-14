import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../Context/appContext";

export default function About() {
  const { theme } = useApp(); // Get dynamic colors

  const handleEmail = () => {
    Linking.openURL("mailto:support@yourapp.com?subject=Feedback");
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "About Us", headerBackTitle: "Settings" }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.logoContainer}>
            <Ionicons name="cube" size={60} color="#6366f1" />
            <Text style={[styles.appName, { color: theme.text }]}>
              Your App Name
            </Text>
            <Text style={[styles.version, { color: theme.subText }]}>
              Version 1.0.2
            </Text>
          </View>

          <Text style={[styles.description, { color: theme.text }]}>
            We are dedicated to building the best financial tools for you.
            Designed with simplicity and power in mind.
          </Text>

          <View style={styles.socialRow}>
            {/* Dummy Social Links */}
            <TouchableOpacity
              style={[styles.socialIcon, { backgroundColor: theme.iconBg }]}
            >
              <Ionicons name="logo-twitter" size={24} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialIcon, { backgroundColor: theme.iconBg }]}
            >
              <Ionicons name="logo-instagram" size={24} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialIcon, { backgroundColor: theme.iconBg }]}
            >
              <Ionicons name="globe-outline" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Thanks for rating!")}
        >
          <Text style={styles.buttonText}>Rate on App Store</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleEmail}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            Send Feedback
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  appName: { fontSize: 22, fontWeight: "bold", marginTop: 10 },
  version: { marginTop: 4 },
  description: { textAlign: "center", lineHeight: 22, marginBottom: 24 },
  socialRow: { flexDirection: "row", gap: 20 },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
