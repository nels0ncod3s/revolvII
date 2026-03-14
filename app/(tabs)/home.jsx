// app/(tabs)/home.jsx  (or index.jsx — whichever your file is named)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddSubSheet from "../../components/addSubscription";
import AvatarPicker from "../../components/AvatarPicker";
import { useSubscriptions } from "../../Context/subscriptionContext";
import { useApp } from "../../Context/appContext";

// Converts any icon format to a safe plain string — fixes "object as React child" crash
function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}


function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target)) return null;
  return Math.round((target - today) / 86400000);
}
function getRenewalLabel(d) {
  if (d === null) return null;
  if (d < 0) return "Overdue";
  if (d === 0) return "Renews today";
  if (d === 1) return "Renews tomorrow";
  return `Renews in ${d} days`;
}
function getRenewalColor(d) {
  if (d === null) return "#94a3b8";
  if (d <= 3) return "#ef4444";
  if (d <= 7) return "#f59e0b";
  return "#94a3b8";
}

const ALL = "All";

export default function Home() {
  const {
    subscriptions,
    totalSpend,
    deleteSubscription,
    profile,
    updateProfile,
  } = useSubscriptions();
  const { currency, theme, darkMode } = useApp();

  const [greeting, setGreeting] = useState("Good Morning");
  const sheetRef = useRef(null);
  const [actionItem, setActionItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good Morning");
    else if (h < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const toggleDropdown = () => {
    if (showDropdown) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatPrice = (amount) => {
    const val = (amount || 0) * (currency?.rate ?? 1);
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const yearlyTotal = subscriptions.reduce((s, sub) => {
    if (sub.cycle === "Yearly") return s + (sub.amount || 0);
    if (sub.cycle === "Weekly") return s + (sub.amount || 0) * 52;
    return s + (sub.amount || 0) * 12;
  }, 0);

  // Build category list from existing subs
  const categories = [
    ALL,
    ...Array.from(
      new Set(subscriptions.map((s) => s.category).filter(Boolean)),
    ),
  ];
  const filtered =
    activeCategory === ALL
      ? subscriptions
      : subscriptions.filter((s) => s.category === activeCategory);

  const handleTap = (item) => setActionItem(item);
  const handleEdit = () => {
    sheetRef.current?.openEdit(actionItem);
    setActionItem(null);
  };
  const handleDelete = () => {
    Alert.alert("Delete Subscription", `Delete ${actionItem.name}?`, [
      { text: "Cancel", style: "cancel", onPress: () => setActionItem(null) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteSubscription(actionItem.id);
          setActionItem(null);
        },
      },
    ]);
  };

  const renderSubscription = ({ item }) => {
    const days = getDaysUntil(item.billingDate);
    const label = getRenewalLabel(days);
    const color = getRenewalColor(days);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={() => handleTap(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardIcon, { backgroundColor: theme.iconBg }]}>
          <Text style={styles.cardEmoji}>{safeEmoji(item.icon)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={[styles.cardName, { color: theme.text }]}>
              {item.name}
            </Text>
            {item.isTrial && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialText}>Trial</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardRenewal, { color }]}>
            {label || item.cycle}
          </Text>
        </View>
        <Text style={[styles.cardPrice, { color: theme.text }]}>
          {currency?.symbol}
          {formatPrice(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <AddSubSheet ref={sheetRef} />

      <AvatarPicker
        visible={showAvatar}
        current={profile?.avatar}
        onSelect={(av) => updateProfile({ ...profile, avatar: av })}
        onClose={() => setShowAvatar(false)}
      />

      {/* Tap action modal */}
      <Modal
        visible={!!actionItem}
        transparent
        animationType="fade"
        onRequestClose={() => setActionItem(null)}
      >
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={() => setActionItem(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: theme.card }]}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionEmoji}>{safeEmoji(actionItem?.icon)}</Text>
              <View>
                <Text style={[styles.actionName, { color: theme.text }]}>
                  {actionItem?.name}
                </Text>
                {actionItem?.note ? (
                  <Text style={[styles.actionNote, { color: theme.subText }]}>
                    {actionItem.note}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={styles.actionRow} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={20} color="#8e44ad" />
              <Text style={[styles.actionRowText, { color: theme.text }]}>
                Edit Subscription
              </Text>
            </TouchableOpacity>
            <View
              style={[styles.actionDivider, { backgroundColor: theme.border }]}
            />
            <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionRowText, { color: "#ef4444" }]}>
                Delete Subscription
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Tapping avatar opens picker */}
              <TouchableOpacity
                style={[
                  styles.profileContainer,
                  { backgroundColor: theme.iconBg },
                ]}
                onPress={() => setShowAvatar(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.profileEmoji}>
                  {profile?.avatar || "🧑🏽"}
                </Text>
              </TouchableOpacity>
              <View>
                <Text style={[styles.greetingText, { color: theme.subText }]}>
                  {greeting}
                </Text>
                <Text style={[styles.helloText, { color: theme.text }]}>
                  {profile?.name || "User"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.card, borderColor: "#f0abfc" },
              ]}
              onPress={() => sheetRef.current?.expand()}
            >
              <Ionicons name="add" size={28} color="#8e44ad" />
            </TouchableOpacity>
          </View>

          {/* Total spend */}
          <TouchableOpacity
            style={styles.totalContainer}
            onPress={toggleDropdown}
            activeOpacity={0.8}
          >
            <View style={styles.currencyContainer}>
              <Text style={styles.currencySymbol}>{currency?.symbol}</Text>
              <Text style={[styles.totalAmount, { color: theme.text }]}>
                {formatPrice(totalSpend)}
              </Text>
              <Ionicons
                name={showDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#a855f7"
                style={{ marginTop: 14, marginLeft: 6 }}
              />
            </View>
            <Text style={[styles.totalLabel, { color: theme.subText }]}>
              Total Monthly Spend
            </Text>
            {showDropdown && (
              <Animated.View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: dropdownAnim,
                    transform: [
                      {
                        translateY: dropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.dropdownRow}>
                  <Text
                    style={[styles.dropdownLabel, { color: theme.subText }]}
                  >
                    📅 Monthly
                  </Text>
                  <Text style={[styles.dropdownValue, { color: theme.text }]}>
                    {currency?.symbol}
                    {formatPrice(totalSpend)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dropdownDivider,
                    { backgroundColor: theme.border },
                  ]}
                />
                <View style={styles.dropdownRow}>
                  <Text
                    style={[styles.dropdownLabel, { color: theme.subText }]}
                  >
                    📆 Yearly
                  </Text>
                  <Text style={[styles.dropdownValue, { color: theme.text }]}>
                    {currency?.symbol}
                    {formatPrice(yearlyTotal)}
                  </Text>
                </View>
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* ── Subscriptions header + category filter ── */}
          {subscriptions.length > 0 && (
            <View style={styles.listHeaderRow}>
              <View style={styles.listHeaderLeft}>
                <Text style={[styles.listTitle, { color: theme.text }]}>
                  Subscriptions
                </Text>
                {/* Category filter chips — only show if more than 1 unique category */}
                {categories.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={[
                          styles.chip,
                          activeCategory === cat && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            activeCategory === cat && styles.chipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              <TouchableOpacity onPress={() => setActiveCategory(ALL)}>
                <Text style={[styles.seeAll, { color: "#8e44ad" }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List or empty */}
          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No subscriptions yet
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.subText }]}>
                Tap + to add your first subscription.
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No {activeCategory} subscriptions
              </Text>
              <TouchableOpacity onPress={() => setActiveCategory(ALL)}>
                <Text
                  style={{ color: "#8e44ad", fontWeight: "600", marginTop: 8 }}
                >
                  Show all
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderSubscription}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
  },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileEmoji: { fontSize: 28 },
  helloText: { fontSize: 18, fontWeight: "800" },
  greetingText: { fontSize: 14 },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  totalContainer: { alignItems: "center", marginBottom: 24, marginTop: 4 },
  currencyContainer: { flexDirection: "row", alignItems: "center" },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#a855f7",
    marginRight: 4,
    marginTop: 8,
  },
  totalAmount: { fontSize: 42, fontWeight: "900" },
  totalLabel: { fontSize: 14, marginTop: 2 },
  dropdown: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  dropdownLabel: { fontSize: 15, fontWeight: "600" },
  dropdownValue: { fontSize: 15, fontWeight: "800" },
  dropdownDivider: { height: 1, marginVertical: 6 },

  // Subscriptions header
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  listHeaderLeft: { flex: 1, marginRight: 8 },
  listTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  filterScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#fdf4ff", borderColor: "#8e44ad" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#8e44ad" },
  seeAll: { fontSize: 13, fontWeight: "700", paddingTop: 2 },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 15 },
  emptyDescription: { fontSize: 14, textAlign: "center", marginTop: 8 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 16, fontWeight: "700" },
  cardRenewal: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  trialBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trialText: { fontSize: 11, fontWeight: "700", color: "#d97706" },
  cardPrice: { fontSize: 16, fontWeight: "700" },

  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  actionEmoji: { fontSize: 28 },
  actionName: { fontSize: 20, fontWeight: "800" },
  actionNote: { fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  actionRowText: { fontSize: 17, fontWeight: "600" },
  actionDivider: { height: 1 },
});
