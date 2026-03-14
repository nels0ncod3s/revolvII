// app/(tabs)/home7.jsx  →  rename to home.jsx when deploying
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, Alert, Animated, Modal,
  ScrollView, Dimensions, Pressable,
} from "react-native";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AddSubSheet    from "../../components/addSubscription";
import EditSubSheet   from "../../components/editSubscription";
import AvatarPicker   from "../../components/AvatarPicker";
import { useSubscriptions } from "../../Context/subscriptionContext";
import { useApp }            from "../../Context/appContext";

const ACCENT = "#7c5cff";
const { width: SW } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target)) return null;
  return Math.round((target - today) / 86400000);
}

function getRenewalStatus(d) {
  if (d === null) return { label: "N/A",      color: "#94a3b8", bg: "rgba(148,163,184,0.1)"  };
  if (d < 0)     return { label: "Overdue",   color: "#ef4444", bg: "rgba(239,68,68,0.1)"    };
  if (d === 0)   return { label: "Today",     color: "#ef4444", bg: "rgba(239,68,68,0.1)"    };
  if (d === 1)   return { label: "Tomorrow",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   };
  if (d <= 7)    return { label: `${d} days`, color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   };
  return           { label: `${d} days`, color: "#94a3b8", bg: "rgba(148,163,184,0.08)"  };
}

function fmtDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "2-digit" });
}

function daysSince(isoStr) {
  if (!isoStr) return 0;
  const start = new Date(isoStr); start.setHours(0,0,0,0);
  const today = new Date();       today.setHours(0,0,0,0);
  return Math.max(0, Math.round((today - start) / 86400000));
}

// ─── Time-based greeting ──────────────────────────────────────────────────────
const RANDOM_MESSAGES = [
  "Hope you're doing well",
  "Welcome back",
  "Your subscriptions at a glance",
  "Let's check your subscriptions",
];
function getTimeData() {
  const h = new Date().getHours();
  let greeting;
  if      (h >= 5  && h < 12) greeting = "Good Morning";
  else if (h >= 12 && h < 16) greeting = "Good Afternoon";
  else if (h >= 16 && h < 20) greeting = "Good Evening";
  else if (h >= 20 && h < 24) greeting = "Relax Tonight";
  else                         greeting = "You're Up Late";
  const message = Math.random() < 0.3
    ? RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)]
    : greeting;
  return { message };
}

// ─── Spend card ───────────────────────────────────────────────────────────────
function SpendCard({ children, onPress, theme }) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.982, useNativeDriver: true, damping: 15 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,     useNativeDriver: true, damping: 12 }).start();
  return (
    <Animated.View style={[sc.wrap, { backgroundColor: theme.card, borderColor: theme.border, transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={sc.content}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  wrap: {
    borderRadius: 28, marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#7c5cff", shadowOpacity: 0.07, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  content: { padding: 24 },
});

// ─── Card entrance animation ──────────────────────────────────────────────────
function NewCardEntrance({ children, isNew, index = 0 }) {
  const anim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  useEffect(() => {
    if (!isNew) return;
    Animated.spring(anim, { toValue: 1, delay: index * 55, damping: 18, stiffness: 160, useNativeDriver: true }).start();
  }, []);
  const opacity    = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const scale      = anim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] });
  return <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>{children}</Animated.View>;
}

// ─── Delete animation wrapper ─────────────────────────────────────────────────
function DeletableCard({ children, deleting, onAnimDone }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!deleting) return;
    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onAnimDone());
  }, [deleting]);
  const opacity    = anim;
  const scale      = anim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  return <Animated.View style={{ opacity, transform: [{ scale }, { translateX }] }}>{children}</Animated.View>;
}

// ─── Quick info sheet (tap) ───────────────────────────────────────────────────
function QuickInfoSheet({ item, visible, onClose, onEdit, onCancelSub, currency, formatPrice, theme }) {
  const translateY = useRef(new Animated.Value(700)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 700, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!item) return null;

  const days   = getDaysUntil(item.billingDate);
  const status = getRenewalStatus(days);
  const subDays = daysSince(item.startDate);
  let periods = 1;
  if (item.startDate) {
    const d = subDays;
    if      (item.cycle === "Weekly")  periods = Math.max(1, Math.round(d / 7));
    else if (item.cycle === "Yearly")  periods = Math.max(1, Math.round(d / 365));
    else                               periods = Math.max(1, Math.round(d / 30));
  }
  const totalSpent = (item.amount || 0) * periods;
  const currCode   = item.amountCurrency || currency?.code || "NGN";
  const currSymbol = currency?.symbol || "₦";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[qi.backdrop, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[qi.sheet, { transform: [{ translateY }] }]}>
        <View style={qi.handleWrap}><View style={qi.handle} /></View>

        {/* Dark branded header */}
        <View style={qi.headerBg}>
          <View style={qi.headerRow}>
            <View style={qi.iconWrap}>
              <Text style={{ fontSize: 36 }}>{safeEmoji(item.icon)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={qi.subName}>{item.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                <Text style={qi.subPrice}>{currSymbol}{formatPrice(item.amount)}</Text>
                <Text style={qi.subPricePer}>/{item.cycle === "Monthly" ? "m" : item.cycle === "Yearly" ? "yr" : "wk"}</Text>
              </View>
              <View style={qi.renewalRow}>
                <Text style={[qi.renewalDays, { color: status.color }]}>
                  {days === null ? "—" : days === 0 ? "Renews today" : days < 0 ? "Overdue" : `${days} days`}
                </Text>
                <View style={qi.progressBar}>
                  <View style={[qi.progressFill, {
                    backgroundColor: status.color,
                    width: `${Math.min(100, Math.max(4, days !== null ? 100 - Math.min(days,30)/30*100 : 50))}%`,
                  }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity style={qi.editBtn} onPress={() => { onClose(); setTimeout(() => onEdit(item), 260); }}>
              <Ionicons name="pencil" size={14} color="#a78bfa" />
              <Text style={qi.editTxt}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info sections */}
        <View style={qi.section}>
          <QIRow label="Currency"      value={`${currCode} · ${currSymbol}`} />
          <QIRow label="Payment cycle" value={item.cycle} />
          <QIRow label="Next payment"  value={fmtDate(item.billingDate)} last />
        </View>
        <View style={[qi.section, { marginTop: 10 }]}>
          <QIRow label="Total spent"    value={`${currSymbol}${formatPrice(totalSpent)}`} />
          <QIRow label="Subscribed for" value={`${subDays} day${subDays !== 1 ? "s" : ""}`} />
          <QIRow label="Last payment"   value={fmtDate(item.startDate)} />
          <QIRow label="Category"       value={item.category || "—"} last />
        </View>

        {/* Cancel sub button */}
        <TouchableOpacity
          style={qi.cancelBtn}
          onPress={() => {
            onClose();
            setTimeout(() => Alert.alert(
              "Cancel Subscription",
              `Mark ${item.name} as cancelled? It'll count toward your savings.`,
              [
                { text: "Keep it", style: "cancel" },
                { text: "Cancel it", style: "destructive", onPress: () => onCancelSub(item.id) },
              ]
            ), 260);
          }}
        >
          <Ionicons name="pause-circle-outline" size={16} color="#d97706" />
          <Text style={qi.cancelTxt}>Cancel Subscription</Text>
        </TouchableOpacity>

        <View style={{ height: 34 }} />
      </Animated.View>
    </Modal>
  );
}

function QIRow({ label, value, last }) {
  return (
    <View style={[qi.row, !last && qi.rowBorder]}>
      <Text style={qi.rowLabel}>{label}</Text>
      <Text style={qi.rowValue}>{value}</Text>
    </View>
  );
}

const qi = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 20,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 30,
    shadowOffset: { width: 0, height: -4 }, elevation: 20,
  },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 6 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  headerBg: {
    marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 20,
    backgroundColor: "#1a1035",
    borderTopLeftRadius: 32, borderTopRightRadius: 32, marginBottom: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  subName:     { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 2 },
  subPrice:    { fontSize: 26, fontWeight: "900", color: "#a78bfa" },
  subPricePer: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  renewalRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  renewalDays: { fontSize: 12, fontWeight: "700", minWidth: 60, color: "rgba(255,255,255,0.7)" },
  progressBar: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" },
  progressFill:{ height: "100%", borderRadius: 2 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(167,139,250,0.2)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.3)",
    alignSelf: "flex-start", marginTop: 4,
  },
  editTxt: { fontSize: 13, fontWeight: "700", color: "#a78bfa" },
  section: {
    backgroundColor: "#f8fafc", borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
  },
  row:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.07)" },
  rowLabel:  { fontSize: 15, color: "#64748b" },
  rowValue:  { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 14, padding: 14, borderRadius: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 1, borderColor: "#fde68a",
  },
  cancelTxt: { fontSize: 15, fontWeight: "700", color: "#d97706" },
});

// ─── Subscription card ────────────────────────────────────────────────────────
const SubscriptionCard = React.memo(({ item, onTap, onLongPress, onRequestDelete, currency, formatPrice, theme }) => {
  const scale    = useRef(new Animated.Value(1)).current;
  const swipeRef = useRef(null);
  const days     = getDaysUntil(item.billingDate);
  const status   = getRenewalStatus(days);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, damping: 12, stiffness: 200 }).start();

  const renderRightActions = (progress) => {
    const trans = progress.interpolate({ inputRange: [0, 1], outputRange: [82, 0] });
    return (
      <Animated.View style={[sw.rightWrap, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={sw.deleteBtn}
          onPress={() => { swipeRef.current?.close(); setTimeout(() => onRequestDelete(item), 120); }}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={sw.swipeLabel}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions}
      friction={2} rightThreshold={50} overshootRight={false}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={onPressIn} onPressOut={onPressOut}
          onPress={() => onTap(item)}
          onLongPress={() => onLongPress(item)}
          delayLongPress={400}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.iconBg }]}>
            <Text style={styles.cardEmoji}>{safeEmoji(item.icon)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardPrice, { color: theme.text }]}>{currency?.symbol}{formatPrice(item.amount)}</Text>
            <Text style={[styles.cardCycle, { color: theme.subText }]}>{item.cycle}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
});

// ─── Cancelled card ───────────────────────────────────────────────────────────
const CancelledCard = ({ item, onReactivate, currency, formatPrice, theme }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 12 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={onPressIn} onPressOut={onPressOut}
        onPress={() => onReactivate(item)}
        style={[styles.card, styles.cancelledCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.cardIcon, { backgroundColor: "rgba(148,163,184,0.12)" }]}>
          <Text style={[styles.cardEmoji, { opacity: 0.5 }]}>{safeEmoji(item.icon)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: "#94a3b8", textDecorationLine: "line-through" }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 11, color: "#10b981", fontWeight: "700" }}>Tap to reactivate</Text>
        </View>
        <Text style={[styles.cardPrice, { color: "#94a3b8" }]}>{currency?.symbol}{formatPrice(item.amount)}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Home() {
  const {
    subscriptions, totalSpend, deleteSubscription,
    cancelSubscription, savedTotal, profile, updateProfile,
  } = useSubscriptions();
  const { currency, theme, darkMode } = useApp();

  const [timeData]  = useState(() => getTimeData());
  const addRef      = useRef(null);
  const editRef     = useRef(null);

  const [quickItem, setQuickItem]       = useState(null);
  const [showQuick, setShowQuick]       = useState(false);
  const [showAvatar, setShowAvatar]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Seen-IDs tracking for new-card animation
  const seenIds = useRef(null);
  if (seenIds.current === null) seenIds.current = new Set(subscriptions.map((s) => s.id));

  // Header entrance
  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatPrice = useCallback((amount) => {
    const val = (amount || 0) * (currency?.rate ?? 1);
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [currency]);

  const yearlyTotal = subscriptions
    .filter((s) => !s.cancelled)
    .reduce((sum, sub) => {
      if (sub.cycle === "Yearly") return sum + (sub.amount || 0);
      if (sub.cycle === "Weekly") return sum + (sub.amount || 0) * 52;
      return sum + (sub.amount || 0) * 12;
    }, 0);

  const activeSubs    = subscriptions.filter((s) => !s.cancelled);
  const cancelledSubs = subscriptions.filter((s) =>  s.cancelled);

  const toggleDropdown = () => {
    if (showDropdown) {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.spring(dropdownAnim, { toValue: 1, damping: 18, stiffness: 160, useNativeDriver: true }).start();
    }
  };

  const handleTap         = useCallback((item) => { setQuickItem(item); setShowQuick(true); }, []);
  const handleLongPress   = useCallback((item) => { editRef.current?.open(item); }, []);
  const handleRequestDelete = useCallback((item) => {
    Alert.alert("Delete Subscription", `Permanently delete ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setDeletingId(item.id) },
    ]);
  }, []);
  const handleAnimDone    = useCallback((id) => { setDeletingId(null); deleteSubscription(id); }, [deleteSubscription]);
  const handleReactivate  = useCallback((item) => {
    Alert.alert("Reactivate", `Resume ${item.name}?`, [
      { text: "No",  style: "cancel" },
      { text: "Yes", onPress: () => cancelSubscription(item.id, false) },
    ]);
  }, [cancelSubscription]);

  // ── Resolved display name: only show profile.name if it's been customised ──
  const displayName = profile?.name && profile.name !== "User" ? profile.name : null;

  const bgColors = darkMode
    ? ["#0f0f14", "#141420", "#0f0f14"]
    : ["#f7f6f3", "#f3f2ef", "#f7f6f3"];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <AddSubSheet ref={addRef} />
      <EditSubSheet ref={editRef} />
      <AvatarPicker
        visible={showAvatar}
        current={profile?.avatar}
        onSelect={(av) => updateProfile({ ...profile, avatar: av })}
        onClose={() => setShowAvatar(false)}
      />
      <QuickInfoSheet
        item={quickItem} visible={showQuick}
        onClose={() => setShowQuick(false)}
        onEdit={(item) => editRef.current?.open(item)}
        onCancelSub={(id) => cancelSubscription(id)}
        currency={currency} formatPrice={formatPrice} theme={theme}
      />

      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        <SafeAreaView style={[styles.safe, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
              <TouchableOpacity style={[styles.avatarBtn, { borderColor: theme.border }]} onPress={() => setShowAvatar(true)} activeOpacity={0.8}>
                <Text style={{ fontSize: 24 }}>{profile?.avatar || "🧑🏽"}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greetingText, { color: theme.subText }]}>{timeData.message}{displayName ? "," : ""}</Text>
                {/* Only show name if user has actually set one */}
                {displayName ? (
                  <Text style={[styles.nameText, { color: theme.text }]}>{displayName}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={[styles.addBtn, { borderColor: ACCENT }]} onPress={() => addRef.current?.expand()}>
                <Ionicons name="add" size={26} color={ACCENT} />
              </TouchableOpacity>
            </Animated.View>

            {/* ── Spend card ── */}
            <SpendCard onPress={toggleDropdown} theme={theme}>
              <View style={styles.spendTop}>
                <View style={styles.spendLblRow}>
                  <View style={styles.spendDot} />
                  <Text style={[styles.spendLbl, { color: theme.subText }]}>TOTAL MONTHLY SPEND</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: dropdownAnim.interpolate({ inputRange: [0,1], outputRange: ["0deg","180deg"] }) }] }}>
                  <Ionicons name="chevron-down" size={15} color={theme.subText} />
                </Animated.View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4 }}>
                <Text style={[styles.spendSymbol, { color: ACCENT }]}>{currency?.symbol}</Text>
                <Text style={[styles.spendAmount, { color: theme.text }]}>{formatPrice(totalSpend)}</Text>
              </View>
              <Text style={[styles.spendSub, { color: theme.subText }]}>
                across {activeSubs.length} subscription{activeSubs.length !== 1 ? "s" : ""}
              </Text>
              {showDropdown && (
                <Animated.View style={{ opacity: dropdownAnim }}>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <View style={styles.breakdown}>
                    {[
                      { lbl: "MONTHLY", val: formatPrice(totalSpend), color: theme.text },
                      { lbl: "YEARLY",  val: formatPrice(yearlyTotal), color: theme.text },
                      { lbl: "SAVED",   val: formatPrice(savedTotal),  color: "#10b981" },
                    ].map((b, i, arr) => (
                      <React.Fragment key={b.lbl}>
                        <View style={styles.bItem}>
                          <Text style={[styles.bLbl, { color: theme.subText }]}>{b.lbl}</Text>
                          <Text style={[styles.bVal, { color: b.color }]}>{currency?.symbol}{b.val}</Text>
                        </View>
                        {i < arr.length - 1 && <View style={[styles.bSep, { backgroundColor: theme.border }]} />}
                      </React.Fragment>
                    ))}
                  </View>
                </Animated.View>
              )}
            </SpendCard>

            {/* ── Stat pills ── */}
            <View style={styles.pills}>
              <View style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="flash" size={12} color={ACCENT} />
                <Text style={[styles.pillTxt, { color: theme.text }]}>{activeSubs.length} Active</Text>
              </View>
              {savedTotal > 0 && (
                <View style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="leaf" size={12} color="#10b981" />
                  <Text style={[styles.pillTxt, { color: theme.text }]}>Saving {currency?.symbol}{formatPrice(savedTotal)}/mo</Text>
                </View>
              )}
            </View>

            {/* ── Active subs ── */}
            {activeSubs.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Subscriptions</Text>
                {activeSubs.map((item, index) => (
                  <DeletableCard key={item.id} deleting={deletingId === item.id} onAnimDone={() => handleAnimDone(item.id)}>
                    <NewCardEntrance isNew={!seenIds.current.has(item.id)} index={index}>
                      <SubscriptionCard
                        item={item} onTap={handleTap} onLongPress={handleLongPress}
                        onRequestDelete={handleRequestDelete}
                        currency={currency} formatPrice={formatPrice} theme={theme}
                      />
                    </NewCardEntrance>
                  </DeletableCard>
                ))}
              </>
            ) : (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="wallet-outline" size={36} color={ACCENT} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No subscriptions yet</Text>
                <Text style={[styles.emptySub,   { color: theme.subText }]}>Tap + to track your first one</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => addRef.current?.expand()}>
                  <Text style={styles.emptyBtnTxt}>Add Subscription</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Cancelled ── */}
            {cancelledSubs.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.subText, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 }]}>
                  Cancelled
                </Text>
                {cancelledSubs.map((item, index) => (
                  <NewCardEntrance key={item.id} isNew={!seenIds.current.has(item.id)} index={index}>
                    <CancelledCard item={item} onReactivate={handleReactivate} currency={currency} formatPrice={formatPrice} theme={theme} />
                  </NewCardEntrance>
                ))}
              </>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

// ─── Swipe styles ─────────────────────────────────────────────────────────────
const sw = StyleSheet.create({
  rightWrap:  { justifyContent: "center", marginBottom: 10, marginLeft: 6 },
  deleteBtn:  { width: 76, height: "100%", borderRadius: 18, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", gap: 4 },
  swipeLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },

  header:       { flexDirection: "row", alignItems: "center", marginBottom: 22, gap: 12 },
  avatarBtn:    { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(124,92,255,0.08)", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  greetingText: { fontSize: 13, fontWeight: "600", opacity: 0.85 },
  nameText:     { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  addBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: "transparent", borderWidth: 1.5, alignItems: "center", justifyContent: "center" },

  spendTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  spendLblRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  spendDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  spendLbl:    { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  spendSymbol: { fontSize: 20, fontWeight: "700", marginTop: 10, marginRight: 3 },
  spendAmount: { fontSize: 50, fontWeight: "900", letterSpacing: -2 },
  spendSub:    { fontSize: 12, fontWeight: "500", marginTop: 3 },
  divider:     { height: 1, marginVertical: 16 },
  breakdown:   { flexDirection: "row" },
  bItem:       { flex: 1, alignItems: "center" },
  bSep:        { width: 1 },
  bLbl:        { fontSize: 10, fontWeight: "800", marginBottom: 5, letterSpacing: 0.6 },
  bVal:        { fontSize: 16, fontWeight: "800" },

  pills:   { flexDirection: "row", gap: 8, marginBottom: 22 },
  pill:    { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  pillTxt: { fontSize: 12, fontWeight: "700" },

  sectionTitle: { fontSize: 18, fontWeight: "900", letterSpacing: -0.3, marginBottom: 14 },

  card: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 22, marginBottom: 10, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cancelledCard: { opacity: 0.6 },
  cardIcon:    { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardEmoji:   { fontSize: 22 },
  cardInfo:    { flex: 1, gap: 5 },
  cardName:    { fontSize: 16, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, gap: 4 },
  statusDot:   { width: 5, height: 5, borderRadius: 2.5 },
  statusText:  { fontSize: 10, fontWeight: "800" },
  cardRight:   { alignItems: "flex-end" },
  cardPrice:   { fontSize: 16, fontWeight: "800" },
  cardCycle:   { fontSize: 10, fontWeight: "600", marginTop: 2 },

  empty:       { alignItems: "center", marginTop: 50, gap: 10 },
  emptyIcon:   { width: 76, height: 76, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle:  { fontSize: 20, fontWeight: "800" },
  emptySub:    { fontSize: 14 },
  emptyBtn:    { marginTop: 4, backgroundColor: ACCENT, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  emptyBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
