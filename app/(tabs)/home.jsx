import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function home() {
  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Good Morning");
  const [profileImage, setProfileImage] = useState("👤");

  useEffect(() => {
    // Pick greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  // For MVP — no subscriptions yet
  const totalMonthlySpend = 150000;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {/* Left: profile + greeting */}
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.profileContainer}>
                <Text style={styles.profileEmoji}>{profileImage}</Text>
              </TouchableOpacity>
              <View style={styles.greetingContainer}>
                <Text style={styles.helloText}>Hello, {userName}</Text>
                <Text style={styles.greetingText}>{greeting}</Text>
              </View>
            </View>

            {/* Right: Add button */}
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={28} color="#8e44ad" />
            </TouchableOpacity>
          </View>

          {/* Center: Total Monthly Spend */}
          <View style={styles.mainContent}>
            <View style={styles.totalContainer}>
              <View style={styles.nairaContainer}>
                <Text style={styles.nairaSymbol}>₦</Text>
                <Text style={styles.totalAmount}>
                  {totalMonthlySpend.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.totalLabel}>Total Monthly Spend</Text>
            </View>

            {/* Empty State */}
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No subscriptions yet</Text>
              <Text style={styles.emptyDescription}>
                Tap the plus button above to add your first subscription.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 1.5,
  },
  profileEmoji: {
    fontSize: 26,
  },
  greetingContainer: {
    justifyContent: "center",
  },
  helloText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  greetingText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8e44ad",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#363636",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  totalContainer: {
    alignItems: "center",
    marginBottom: 100,
  },
  nairaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nairaSymbol: {
    fontSize: 30,
    fontWeight: "700",
    color: "#cd79f1",
    marginRight: 3,
  },
  totalAmount: {
    fontSize: 50,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#525252",
    marginTop: 15,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#b1b1b1",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
