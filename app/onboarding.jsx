// app/onboarding.jsx
import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Illustration placeholder */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>💸</Text>
          <View style={styles.floatingCard1}><Text style={styles.floatingText}>Netflix  ₦4,500</Text></View>
          <View style={styles.floatingCard2}><Text style={styles.floatingText}>Spotify  ₦900</Text></View>
          <View style={styles.floatingCard3}><Text style={styles.floatingText}>iCloud   ₦450</Text></View>
        </View>
      </View>

      {/* Text content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>Know where your{"\n"}money goes</Text>
        <Text style={styles.subtitle}>
          Revolv helps you track every subscription in one place — so nothing sneaks up on you.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.replace("/setup/name")}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  illustrationWrap: { flex: 1, backgroundColor: "#faf5ff", alignItems: "center", justifyContent: "center" },
  illustration: { alignItems: "center", justifyContent: "center", position: "relative", width: width * 0.8, height: 280 },
  illustrationEmoji: { fontSize: 80 },
  floatingCard1: { position: "absolute", top: 20, right: 0, backgroundColor: "#fff", padding: 10, borderRadius: 14, shadowColor: "#8e44ad", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  floatingCard2: { position: "absolute", bottom: 60, left: 0, backgroundColor: "#fff", padding: 10, borderRadius: 14, shadowColor: "#8e44ad", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  floatingCard3: { position: "absolute", bottom: 10, right: 10, backgroundColor: "#fff", padding: 10, borderRadius: 14, shadowColor: "#8e44ad", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  floatingText: { fontSize: 13, fontWeight: "700", color: "#1e293b" },

  content: { padding: 32, paddingBottom: 48 },
  title: { fontSize: 34, fontWeight: "900", color: "#1e293b", lineHeight: 42, marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#64748b", lineHeight: 26, marginBottom: 40 },
  button: { backgroundColor: "#8e44ad", paddingVertical: 18, borderRadius: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
