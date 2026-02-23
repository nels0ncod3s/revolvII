// app/splash.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 100, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🔄</Text>
        </View>
        <Text style={styles.appName}>Revolv</Text>
        <Text style={styles.tagline}>Track what you pay for</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#8e44ad", alignItems: "center", justifyContent: "center" },
  logoWrap: { alignItems: "center" },
  logoCircle: { width: 100, height: 100, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: 42, fontWeight: "900", color: "#ffffff", letterSpacing: -1 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.75)", marginTop: 8, fontWeight: "500" },
});
