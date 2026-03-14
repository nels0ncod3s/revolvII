// app/(tabs)/calendar.jsx
import React, { useState, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, ScrollView, Animated, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscriptions } from "../../Context/subscriptionContext";
import { useApp } from "../../Context/appContext";

// ─── Font constant — SF Pro Rounded on real device, System elsewhere ──────────
const FONT = Platform.OS === "ios" ? "SF Pro Rounded" : "sans-serif-rounded";

const ACCENT  = "#7c5cff";
const { width: SW } = Dimensions.get("window");
const DAY_W   = Math.floor((SW - 40) / 7); // 7 columns, 20px side padding each

const DAYS    = ["M","T","W","T","F","S","S"];
const MONTHS  = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

// Given a subscription, return all billing dates (as YYYY-MM-DD strings)
// that fall within a given month
function getBillingDatesInMonth(sub, year, month) {
  if (sub.cancelled || !sub.billingDate) return [];
  const base = new Date(sub.billingDate + "T00:00:00");
  if (isNaN(base)) return [];

  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (sub.cycle === "Monthly") {
    const d = base.getDate();
    const clamped = Math.min(d, daysInMonth);
    dates.push(new Date(year, month, clamped));
  } else if (sub.cycle === "Yearly") {
    if (base.getMonth() === month) {
      const d = base.getDate();
      const clamped = Math.min(d, daysInMonth);
      dates.push(new Date(year, month, clamped));
    }
  } else if (sub.cycle === "Weekly") {
    // Find first occurrence in month on the same weekday
    const targetDay = base.getDay(); // 0=Sun
    let d = new Date(year, month, 1);
    while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1);
    while (d.getMonth() === month) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
  }

  return dates.map((d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
}

// Build a map: "YYYY-MM-DD" → [subscription, ...]
function buildPaymentMap(subscriptions, year, month) {
  const map = {};
  for (const sub of subscriptions) {
    const dates = getBillingDatesInMonth(sub, year, month);
    for (const d of dates) {
      if (!map[d]) map[d] = [];
      map[d].push(sub);
    }
  }
  return map;
}

// Days in grid: starts Monday. Returns array of {date: Date|null, key: string}
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-start: Sun=6, Mon=0, ...
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Subscription icon stack (max 2 visible + "+N") ──────────────────────────
function SubIconStack({ subs, isToday, isSelected }) {
  if (!subs || subs.length === 0) return null;
  const visible = subs.slice(0, 2);
  const extra   = subs.length - 2;

  return (
    <View style={stack.wrap}>
      {visible.map((sub, i) => (
        <View key={sub.id} style={[stack.bubble, { zIndex: visible.length - i, marginLeft: i === 0 ? 0 : -6 }]}>
          <Text style={stack.emoji}>{safeEmoji(sub.icon)}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[stack.badge, { marginLeft: -4 }]}>
          <Text style={stack.badgeTxt}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}
const stack = StyleSheet.create({
  wrap:     { flexDirection: "row", alignItems: "center", marginTop: 3 },
  bubble:   { width: 18, height: 18, borderRadius: 5, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  emoji:    { fontSize: 10 },
  badge:    { width: 18, height: 18, borderRadius: 5, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 8, fontWeight: "800", color: "#fff" },
});

// ─── Day cell ─────────────────────────────────────────────────────────────────
function DayCell({ date, subs, isToday, isSelected, onPress }) {
  const hasSubs = subs && subs.length > 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[cell.wrap, { width: DAY_W, height: DAY_W + 16 }]}
    >
      <View style={[
        cell.inner,
        isSelected && cell.selected,
        isToday && !isSelected && cell.today,
        hasSubs && !isSelected && !isToday && cell.hasSubs,
      ]}>
        <Text style={[
          cell.num,
          isSelected && cell.numSelected,
          isToday && !isSelected && cell.numToday,
          !isToday && !isSelected && { color: "#1e293b" },
        ]}>
          {date.getDate()}
        </Text>
        {hasSubs && <SubIconStack subs={subs} isToday={isToday} isSelected={isSelected} />}
      </View>
    </TouchableOpacity>
  );
}
const cell = StyleSheet.create({
  wrap:        { alignItems: "center", paddingVertical: 3 },
  inner: {
    width: DAY_W - 6, minHeight: DAY_W - 6,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    paddingVertical: 5, paddingHorizontal: 2,
  },
  selected:    { backgroundColor: ACCENT },
  today:       { backgroundColor: "#1e293b" },
  hasSubs:     { backgroundColor: "rgba(124,92,255,0.07)", borderWidth: 1, borderColor: "rgba(124,92,255,0.15)" },
  num:         { fontSize: 14, fontWeight: "600" },
  numSelected: { color: "#fff", fontWeight: "800" },
  numToday:    { color: "#fff", fontWeight: "800" },
});

// ─── Payment list for selected day ───────────────────────────────────────────
function DayDetailCard({ dateStr, subs, currency, formatPrice }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(fadeAnim, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }).start();
  }, [dateStr]);

  if (!subs || subs.length === 0) return null;

  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const total = subs.reduce((s, sub) => s + (sub.amount || 0), 0);

  return (
    <Animated.View style={[detail.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [12, 0] }) }] }]}>
      <View style={detail.cardHeader}>
        <Text style={detail.dateLabel}>{label}</Text>
        <Text style={detail.totalLabel}>{currency?.symbol}{formatPrice(total)}</Text>
      </View>
      {subs.map((sub, i) => (
        <View key={sub.id} style={[detail.row, i < subs.length - 1 && detail.rowBorder]}>
          <View style={detail.iconWrap}>
            <Text style={detail.iconEmoji}>{safeEmoji(sub.icon)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={detail.subName}>{sub.name}</Text>
            <Text style={detail.subCycle}>{sub.cycle}</Text>
          </View>
          <Text style={detail.subPrice}>{currency?.symbol}{formatPrice(sub.amount)}</Text>
        </View>
      ))}
    </Animated.View>
  );
}
const detail = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 22, marginTop: 16,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#f8f7ff",
  },
  dateLabel:  { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  totalLabel: { fontSize: 14, fontWeight: "800", color: ACCENT },
  row:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  rowBorder:  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.07)" },
  iconWrap:   { width: 42, height: 42, borderRadius: 13, backgroundColor: "#f4f3ff", alignItems: "center", justifyContent: "center" },
  iconEmoji:  { fontSize: 22 },
  subName:    { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  subCycle:   { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  subPrice:   { fontSize: 15, fontWeight: "800", color: "#1e293b" },
});

// ─── Main calendar screen ─────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { subscriptions, totalSpend } = useSubscriptions();
  const { currency } = useApp();

  const now   = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`
  );

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  const activeSubs = useMemo(() => subscriptions.filter((s) => !s.cancelled), [subscriptions]);

  const paymentMap = useMemo(() => buildPaymentMap(activeSubs, year, month), [activeSubs, year, month]);
  const grid       = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const formatPrice = (amount) => {
    const val = (amount || 0) * (currency?.rate ?? 1);
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Monthly spend for current viewed month
  const monthlyTotal = useMemo(() => {
    return Object.values(paymentMap).flat().reduce((s, sub) => s + (sub.amount || 0), 0);
  }, [paymentMap]);

  // Count unique paid subs this month (any with a billing date in month)
  const paidSubs = useMemo(() => {
    const seen = new Set();
    Object.values(paymentMap).flat().forEach((s) => seen.add(s.id));
    return seen.size;
  }, [paymentMap]);

  // End-of-month: sum of all payments this month
  const eomTotal = monthlyTotal;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedSubs = selectedDay ? (paymentMap[selectedDay] || []) : [];

  // Stacked emoji summary of active subs
  const subIcons = activeSubs.slice(0, 4).map(s => safeEmoji(s.icon));

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={["#f7f6f3", "#f3f2ef", "#f7f6f3"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.screenTitle}>Calendar</Text>
            </View>

            {/* ── Summary card ── */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryMonthLabel}>
                Spending in {MONTHS[month]}
              </Text>
              <Text style={styles.summaryAmount}>
                {currency?.symbol}{formatPrice(monthlyTotal)}
              </Text>

              {/* "You have N [icons] subscriptions and paid N/N ($X)" */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>You have </Text>
                <Text style={[styles.summaryText, styles.summaryBold]}>{activeSubs.length}</Text>
                {/* Icon stack inline */}
                {subIcons.map((em, i) => (
                  <View key={i} style={[styles.inlineIcon, { zIndex: 10 - i, marginLeft: i === 0 ? 4 : -6 }]}>
                    <Text style={{ fontSize: 11 }}>{em}</Text>
                  </View>
                ))}
                {activeSubs.length > 4 && (
                  <View style={[styles.inlineIcon, { backgroundColor: ACCENT, marginLeft: -6 }]}>
                    <Text style={{ fontSize: 8, color: "#fff", fontWeight: "800" }}>+{activeSubs.length - 4}</Text>
                  </View>
                )}
                <Text style={styles.summaryText}> subscriptions</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>and paid </Text>
                <Text style={[styles.summaryText, styles.summaryBold]}>
                  {paidSubs}/{activeSubs.length} ({currency?.symbol}{formatPrice(monthlyTotal)})
                </Text>
                <Text style={styles.summaryText}>.</Text>
              </View>

              {/* End of month */}
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text style={[styles.summaryText, { color: "#94a3b8" }]}>End of the month: </Text>
                <Text style={[styles.summaryText, styles.summaryBold, { color: "#ef4444" }]}>
                  -{currency?.symbol}{formatPrice(eomTotal)}
                </Text>
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.dottedDivider} />

            {/* ── Calendar ── */}
            <View style={styles.calWrap}>
              {/* Month nav */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name="chevron-back" size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name="chevron-forward" size={20} color="#1e293b" />
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaders}>
                {DAYS.map((d, i) => (
                  <View key={i} style={{ width: DAY_W, alignItems: "center" }}>
                    <Text style={styles.dayHeader}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {grid.map((date, i) => {
                  if (!date) return <View key={`empty-${i}`} style={{ width: DAY_W, height: DAY_W + 16 }} />;
                  const dStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
                  return (
                    <DayCell
                      key={dStr}
                      date={date}
                      subs={paymentMap[dStr]}
                      isToday={dStr === todayStr}
                      isSelected={dStr === selectedDay}
                      onPress={() => setSelectedDay(dStr === selectedDay ? null : dStr)}
                    />
                  );
                })}
              </View>
            </View>

            {/* ── Selected day detail ── */}
            {selectedDay && selectedSubs.length > 0 && (
              <DayDetailCard
                dateStr={selectedDay}
                subs={selectedSubs}
                currency={currency}
                formatPrice={formatPrice}
              />
            )}

            {selectedDay && selectedSubs.length === 0 && (
              <View style={styles.nothingDue}>
                <Text style={styles.nothingDueTxt}>No payments due on this day</Text>
              </View>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 10 },

  header:      { marginBottom: 6, marginTop: 8 },
  screenTitle: { fontSize: 32, fontWeight: "900", color: "#1e293b", letterSpacing: -1 },

  // Summary card
  summaryCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 0,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  summaryMonthLabel: { fontSize: 16, fontWeight: "600", color: "#94a3b8", marginBottom: 4 },
  summaryAmount:     { fontSize: 52, fontWeight: "900", color: "#1e293b", letterSpacing: -2, marginBottom: 10 },
  summaryRow:        { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 2 },
  summaryText:       { fontSize: 16, color: "#94a3b8", fontWeight: "500" },
  summaryBold:       { color: "#1e293b", fontWeight: "800" },
  inlineIcon: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: "#f4f3ff", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },

  // Divider
  dottedDivider: {
    marginVertical: 20, height: 1,
    borderStyle: "dashed", borderWidth: 1, borderColor: "#d1d5db",
  },

  // Calendar
  calWrap: {
    backgroundColor: "#fff", borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  monthNav:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: "#f4f3ff", alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  dayHeaders: { flexDirection: "row", marginBottom: 4 },
  dayHeader:  { fontSize: 12, fontWeight: "700", color: "#94a3b8", textAlign: "center" },
  grid:       { flexDirection: "row", flexWrap: "wrap" },

  // No payments
  nothingDue:    { alignItems: "center", paddingVertical: 24 },
  nothingDueTxt: { fontSize: 14, color: "#94a3b8", fontWeight: "500" },
});
