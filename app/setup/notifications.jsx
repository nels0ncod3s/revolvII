// app/setup/notifications.jsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsSetup() {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle | granted | denied

  const handleEnable = async () => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      finalStatus = asked;
    }

    setStatus(finalStatus === "granted" ? "granted" : "denied");
    setTimeout(() => router.replace("/(tabs)"), 1200);
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔔</Text>
        </View>
        <Text style={styles.step}>Step 2 of 2</Text>
        <Text style={styles.title}>Never miss a{"\n"}billing date</Text>
        <Text style={styles.subtitle}>
          Revolv can remind you before a subscription renews — so you're always in control.
        </Text>

        <View style={styles.exampleWrap}>
          {["Netflix renews in 3 days", "Spotify billed tomorrow", "iCloud renewed today"].map((ex) => (
            <View key={ex} style={styles.exampleRow}>
              <Text style={styles.exampleDot}>🔔</Text>
              <Text style={styles.exampleText}>{ex}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        {status === "granted" && (
          <View style={styles.successBadge}>
            <Text style={styles.successText}>✅ Notifications enabled!</Text>
          </View>
        )}
        {status === "denied" && (
          <View style={styles.deniedBadge}>
            <Text style={styles.deniedText}>Notifications blocked — you can enable them in Settings</Text>
          </View>
        )}

        {status === "idle" && (
          <>
            <TouchableOpacity style={styles.button} onPress={handleEnable}>
              <Text style={styles.buttonText}>Enable Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Maybe later</Text>
            </TouchableOpacity>
          </>
        )}
        {status !== "idle" && (
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.buttonText}>Go to App</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "space-between", padding: 28, paddingTop: 60 },
  top: { flex: 1 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: "#faf5ff", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  icon: { fontSize: 40 },
  step: { fontSize: 13, fontWeight: "700", color: "#a855f7", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 34, fontWeight: "900", color: "#1e293b", lineHeight: 42, marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#64748b", lineHeight: 26, marginBottom: 32 },

  exampleWrap: { backgroundColor: "#f8fafc", borderRadius: 20, padding: 20, gap: 14 },
  exampleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exampleDot: { fontSize: 18 },
  exampleText: { fontSize: 15, color: "#475569", fontWeight: "500" },

  bottom: { paddingBottom: 20 },
  button: { backgroundColor: "#8e44ad", paddingVertical: 18, borderRadius: 18, alignItems: "center", marginBottom: 12 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },

  successBadge: { backgroundColor: "#f0fdf4", padding: 14, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  successText: { color: "#16a34a", fontWeight: "700", fontSize: 15 },
  deniedBadge: { backgroundColor: "#fff7ed", padding: 14, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  deniedText: { color: "#ea580c", fontWeight: "600", fontSize: 14, textAlign: "center" },
});
