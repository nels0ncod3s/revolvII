// app/(tabs)/index.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, FlatList, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddSubSheet from "../../components/addSubscription";
import { useSubscriptions } from '../../Context/subscriptionContext';

export default function Home() {
  const { subscriptions, totalSpend, deleteSubscription } = useSubscriptions();
  const [greeting, setGreeting] = useState("Good Morning");
  const sheetRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Subscription",
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSubscription(item.id) },
      ]
    );
  };

  const handleEdit = (item) => {
    sheetRef.current?.openEdit(item);
  };

  const renderSubscription = ({ item }) => (
    <View style={styles.card}>
      {/* Icon */}
      <View style={styles.cardIcon}>
        <Text style={styles.cardEmoji}>{item.icon || "⭐"}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.isTrial && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>Trial</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardCycle}>{item.cycle}{item.billingDate ? ` · Next: ${item.billingDate}` : ""}</Text>
      </View>

      {/* Amount + Actions */}
      <View style={styles.cardRight}>
        <Text style={styles.cardPrice}>₦{item.amount.toLocaleString()}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={15} color="#8e44ad" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <AddSubSheet ref={sheetRef} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.profileContainer}>
                <Text style={styles.profileEmoji}>👤</Text>
              </View>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.helloText}>User</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => sheetRef.current?.expand()}
            >
              <Ionicons name="add" size={28} color="#8e44ad" />
            </TouchableOpacity>
          </View>

          {/* Total Spend */}
          <View style={styles.totalContainer}>
            <View style={styles.nairaContainer}>
              <Text style={styles.nairaSymbol}>₦</Text>
              <Text style={styles.totalAmount}>{totalSpend.toLocaleString()}</Text>
            </View>
            <Text style={styles.totalLabel}>Total Monthly Spend</Text>
          </View>

          {/* List or Empty State */}
          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No subscriptions yet</Text>
              <Text style={styles.emptyDescription}>Tap the plus button above to add your first subscription.</Text>
            </View>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id}
              renderItem={renderSubscription}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc", paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight },
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  profileEmoji: { fontSize: 24 },
  helloText: { fontSize: 18, fontWeight: "800", color: "#111111" },
  greetingText: { fontSize: 14, color: "#64748b" },
  addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fdf4ff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#f0abfc" },

  totalContainer: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  nairaContainer: { flexDirection: "row", alignItems: "center" },
  nairaSymbol: { fontSize: 24, fontWeight: "700", color: "#a855f7", marginRight: 4, marginTop: 8 },
  totalAmount: { fontSize: 42, fontWeight: "900", color: "#1e293b" },
  totalLabel: { fontSize: 14, color: "#64748b" },

  emptyState: { alignItems: "center", marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 15 },
  emptyDescription: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 8 },

  // Card
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardCycle: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  trialBadge: { backgroundColor: "#fef3c7", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  trialText: { fontSize: 11, fontWeight: "700", color: "#d97706" },

  cardRight: { alignItems: "flex-end", gap: 6 },
  cardPrice: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardActions: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
});
