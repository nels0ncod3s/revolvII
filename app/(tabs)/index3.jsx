// app/(tabs)/index.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, FlatList, Alert, Animated, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddSubSheet from "../../components/addSubscription";
import { useSubscriptions } from '../../Context/subscriptionContext';

// Calculate days until billing date
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (isNaN(target)) return null;
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getRenewalLabel(daysUntil) {
  if (daysUntil === null) return null;
  if (daysUntil < 0) return "Overdue";
  if (daysUntil === 0) return "Renews today";
  if (daysUntil === 1) return "Renews tomorrow";
  return `Renews in ${daysUntil} days`;
}

function getRenewalColor(daysUntil) {
  if (daysUntil === null) return "#94a3b8";
  if (daysUntil <= 3) return "#ef4444";
  if (daysUntil <= 7) return "#f59e0b";
  return "#94a3b8";
}

export default function Home() {
  const { subscriptions, totalSpend, deleteSubscription, profile } = useSubscriptions();
  const [greeting, setGreeting] = useState("Good Morning");
  const sheetRef = useRef(null);

  // Long-press action menu
  const [actionItem, setActionItem] = useState(null);

  // Total spend dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const toggleDropdown = () => {
    if (showDropdown) {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.timing(dropdownAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  const yearlyTotal = subscriptions.reduce((sum, sub) => {
    if (sub.cycle === "Yearly") return sum + (sub.amount || 0);
    if (sub.cycle === "Weekly") return sum + (sub.amount || 0) * 52;
    return sum + (sub.amount || 0) * 12;
  }, 0);

  const handleLongPress = (item) => setActionItem(item);

  const handleEdit = () => {
    sheetRef.current?.openEdit(actionItem);
    setActionItem(null);
  };

  const handleDelete = () => {
    Alert.alert("Delete Subscription", `Delete ${actionItem.name}?`, [
      { text: "Cancel", style: "cancel", onPress: () => setActionItem(null) },
      { text: "Delete", style: "destructive", onPress: () => { deleteSubscription(actionItem.id); setActionItem(null); } },
    ]);
  };

  const renderSubscription = ({ item }) => {
    const daysUntil = getDaysUntil(item.billingDate);
    const renewalLabel = getRenewalLabel(daysUntil);
    const renewalColor = getRenewalColor(daysUntil);

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.8}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>{item.icon || "⭐"}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            {item.isTrial && (
              <View style={styles.trialBadge}><Text style={styles.trialText}>Trial</Text></View>
            )}
          </View>
          <Text style={[styles.cardRenewal, { color: renewalColor }]}>
            {renewalLabel || item.cycle}
          </Text>
        </View>
        <Text style={styles.cardPrice}>₦{item.amount.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <AddSubSheet ref={sheetRef} />

      {/* Long-press action modal */}
      <Modal visible={!!actionItem} transparent animationType="fade" onRequestClose={() => setActionItem(null)}>
        <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={() => setActionItem(null)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionEmoji}>{actionItem?.icon || "⭐"}</Text>
              <Text style={styles.actionName}>{actionItem?.name}</Text>
            </View>
            <TouchableOpacity style={styles.actionRow} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={20} color="#8e44ad" />
              <Text style={styles.actionRowText}>Edit Subscription</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionRowText, { color: "#ef4444" }]}>Delete Subscription</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.profileContainer}>
                <Text style={styles.profileEmoji}>{profile?.avatar || "🧑🏽"}</Text>
              </View>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.helloText}>{profile?.name || "User"}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => sheetRef.current?.expand()}>
              <Ionicons name="add" size={28} color="#8e44ad" />
            </TouchableOpacity>
          </View>

          {/* Total Spend — tappable with dropdown */}
          <TouchableOpacity style={styles.totalContainer} onPress={toggleDropdown} activeOpacity={0.8}>
            <View style={styles.nairaContainer}>
              <Text style={styles.nairaSymbol}>₦</Text>
              <Text style={styles.totalAmount}>{totalSpend.toLocaleString()}</Text>
              <Ionicons
                name={showDropdown ? "chevron-up" : "chevron-down"}
                size={20} color="#a855f7"
                style={{ marginTop: 14, marginLeft: 6 }}
              />
            </View>
            <Text style={styles.totalLabel}>Total Monthly Spend</Text>

            {showDropdown && (
              <Animated.View style={[styles.dropdown, { opacity: dropdownAnim, transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
                <View style={styles.dropdownRow}>
                  <Text style={styles.dropdownLabel}>📅 Monthly</Text>
                  <Text style={styles.dropdownValue}>₦{totalSpend.toLocaleString()}</Text>
                </View>
                <View style={styles.dropdownDivider} />
                <View style={styles.dropdownRow}>
                  <Text style={styles.dropdownLabel}>📆 Yearly</Text>
                  <Text style={styles.dropdownValue}>₦{yearlyTotal.toLocaleString()}</Text>
                </View>
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* List or Empty */}
          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No subscriptions yet</Text>
              <Text style={styles.emptyDescription}>Tap the + button to add your first subscription.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Hold a card to edit or delete</Text>
              <FlatList
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={renderSubscription}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff", paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight },
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#faf5ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  profileEmoji: { fontSize: 28 },
  helloText: { fontSize: 18, fontWeight: "800", color: "#111111" },
  greetingText: { fontSize: 14, color: "#64748b" },
  addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fdf4ff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#f0abfc" },

  totalContainer: { alignItems: "center", marginBottom: 24, marginTop: 4 },
  nairaContainer: { flexDirection: "row", alignItems: "center" },
  nairaSymbol: { fontSize: 24, fontWeight: "700", color: "#a855f7", marginRight: 4, marginTop: 8 },
  totalAmount: { fontSize: 42, fontWeight: "900", color: "#1e293b" },
  totalLabel: { fontSize: 14, color: "#64748b", marginTop: 2 },

  dropdown: { marginTop: 14, backgroundColor: "#fff", borderRadius: 18, padding: 16, width: "90%", shadowColor: "#8e44ad", shadowOpacity: 0.12, shadowRadius: 16, elevation: 6, borderWidth: 1, borderColor: "#f3e8ff" },
  dropdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  dropdownLabel: { fontSize: 15, color: "#64748b", fontWeight: "600" },
  dropdownValue: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  dropdownDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 6 },

  sectionLabel: { fontSize: 12, color: "#cbd5e1", fontWeight: "600", marginBottom: 12, textAlign: "center" },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 15 },
  emptyDescription: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 8 },

  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardRenewal: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  trialBadge: { backgroundColor: "#fef3c7", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  trialText: { fontSize: 11, fontWeight: "700", color: "#d97706" },
  cardPrice: { fontSize: 16, fontWeight: "700", color: "#0f172a" },

  // Long-press action modal
  actionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  actionEmoji: { fontSize: 28 },
  actionName: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 },
  actionRowText: { fontSize: 17, fontWeight: "600", color: "#1e293b" },
  actionDivider: { height: 1, backgroundColor: "#f1f5f9" },
});
