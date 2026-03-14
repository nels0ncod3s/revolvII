// app/(tabs)/calendar.jsx
import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, ScrollView, Animated, Dimensions,
  Modal, PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscriptions } from "../../Context/subscriptionContext";
import { useApp }            from "../../Context/appContext";

const ACCENT  = "#7c5cff";
const { width: SW } = Dimensions.get("window");
const DAY_W   = Math.floor((SW - 40) / 7);

const DAYS   = ["M","T","W","T","F","S","S"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

// Only show a subscription on dates ON or AFTER its startDate
function isOnOrAfterStart(dateObj, startDateStr) {
  if (!startDateStr) return true; // no start date saved → always show
  const start = new Date(startDateStr + "T00:00:00");
  if (isNaN(start)) return true;
  start.setHours(0,0,0,0);
  const d = new Date(dateObj); d.setHours(0,0,0,0);
  return d >= start;
}

// Return all billing dates for a sub in a given year/month, filtered by startDate
function getBillingDatesInMonth(sub, year, month) {
  if (sub.cancelled || !sub.billingDate) return [];
  const base = new Date(sub.billingDate + "T00:00:00");
  if (isNaN(base)) return [];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const candidates = [];

  if (sub.cycle === "Monthly") {
    const d = Math.min(base.getDate(), daysInMonth);
    candidates.push(new Date(year, month, d));
  } else if (sub.cycle === "Yearly") {
    if (base.getMonth() === month) {
      const d = Math.min(base.getDate(), daysInMonth);
      candidates.push(new Date(year, month, d));
    }
  } else if (sub.cycle === "Weekly") {
    const targetDay = base.getDay();
    let d = new Date(year, month, 1);
    while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1);
    while (d.getMonth() === month) {
      candidates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
  }

  return candidates
    .filter((c) => isOnOrAfterStart(c, sub.startDate))
    .map((c) =>
      `${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`
    );
}

function buildPaymentMap(subscriptions, year, month) {
  const map = {};
  for (const sub of subscriptions) {
    for (const d of getBillingDatesInMonth(sub, year, month)) {
      if (!map[d]) map[d] = [];
      map[d].push(sub);
    }
  }
  return map;
}

// Mon-first grid: returns array of Date|null
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset   = firstDay === 0 ? 6 : firstDay - 1;
  const total    = new Date(year, month + 1, 0).getDate();
  const cells    = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

// ─── Day-tap popup ────────────────────────────────────────────────────────────
function DayPopup({ visible, dateStr, subs, onClose, currency, formatPrice, theme }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 18, stiffness: 260, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 160, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 0,    duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!dateStr) return null;

  const d     = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const total = subs.reduce((s, sub) => s + (sub.amount || 0), 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[popup.backdrop, { opacity: opacAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <View style={popup.centreWrap} pointerEvents="box-none">
        <Animated.View style={[popup.card, { backgroundColor: theme.card, transform: [{ scale: scaleAnim }], opacity: opacAnim }]}>
          {/* Header */}
          <View style={popup.header}>
            <View>
              <Text style={[popup.dateLabel, { color: theme.text }]}>{label}</Text>
              <Text style={[popup.totalLabel, { color: ACCENT }]}>{currency?.symbol}{formatPrice(total)} due</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={popup.closeBtn}>
              <Ionicons name="close" size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>
          {/* Sub rows */}
          {subs.map((sub, i) => (
            <View key={sub.id} style={[popup.row, i < subs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
              <View style={[popup.iconWrap, { backgroundColor: theme.iconBg }]}>
                <Text style={{ fontSize: 20 }}>{safeEmoji(sub.icon)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[popup.subName, { color: theme.text }]}>{sub.name}</Text>
                <Text style={[popup.subCycle, { color: theme.subText }]}>{sub.cycle}</Text>
              </View>
              <Text style={[popup.subPrice, { color: theme.text }]}>{currency?.symbol}{formatPrice(sub.amount)}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const popup = StyleSheet.create({
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  centreWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  card: {
    width: "100%", borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 18, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.07)",
  },
  dateLabel:  { fontSize: 16, fontWeight: "800" },
  totalLabel: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" },
  row:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  iconWrap:   { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  subName:    { fontSize: 15, fontWeight: "700" },
  subCycle:   { fontSize: 12, marginTop: 1 },
  subPrice:   { fontSize: 15, fontWeight: "800" },
});

// ─── Calendar main screen ─────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { subscriptions } = useSubscriptions();
  const { currency, theme, darkMode } = useApp();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [popupDay, setPopupDay] = useState(null);

  const todayStr   = toKey(now);
  const activeSubs = useMemo(() => subscriptions.filter((s) => !s.cancelled), [subscriptions]);

  const paymentMap = useMemo(() => buildPaymentMap(activeSubs, year, month), [activeSubs, year, month]);
  const grid       = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const formatPrice = useCallback((amount) => {
    const val = (amount || 0) * (currency?.rate ?? 1);
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [currency]);

  // Subs that appear at least once this month
  const monthSubs = useMemo(() => {
    const seen = new Set(); const list = [];
    Object.values(paymentMap).flat().forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); list.push(s); } });
    return list;
  }, [paymentMap]);

  const eomTotal = useMemo(
    () => Object.values(paymentMap).flat().reduce((s, sub) => s + (sub.amount||0), 0),
    [paymentMap]
  );

  // Month slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const changeMonth = useCallback((dir) => {
    // dir: +1 = next, -1 = prev
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -dir * 30, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * 30,  duration: 0,   useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();

    setYear(y => {
      setMonth(m => {
        const nm = m + dir;
        if (nm > 11) { setTimeout(() => setYear(y + 1), 0); return 0; }
        if (nm < 0)  { setTimeout(() => setYear(y - 1), 0); return 11; }
        return nm;
      });
      return y;
    });
    setPopupDay(null);
  }, []);

  // Swipe gesture on the calendar
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 12 && Math.abs(gs.dy) < 40,
    onPanResponderRelease: (_, gs) => {
      if (gs.dx < -40) changeMonth(+1);
      else if (gs.dx > 40) changeMonth(-1);
    },
  })).current;

  const bgColors = darkMode
    ? ["#0f0f14", "#141420", "#0f0f14"]
    : ["#f7f6f3", "#f3f2ef", "#f7f6f3"];

  const popupSubs = popupDay ? (paymentMap[popupDay] || []) : [];

  return (
    <>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <DayPopup
        visible={!!popupDay && popupSubs.length > 0}
        dateStr={popupDay}
        subs={popupSubs}
        onClose={() => setPopupDay(null)}
        currency={currency}
        formatPrice={formatPrice}
        theme={theme}
      />

      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Title ── */}
            <Text style={[styles.screenTitle, { color: theme.text }]}>Calendar</Text>

            {/* ── Summary card (centred) ── */}
            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.summaryMonthLbl, { color: theme.subText }]}>
                {MONTHS[month]} {year}
              </Text>

              {/* Icon stack inline */}
              <View style={styles.iconRow}>
                {monthSubs.slice(0,5).map((sub, i) => (
                  <View key={sub.id} style={[styles.inlineIcon, { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={{ fontSize: 14 }}>{safeEmoji(sub.icon)}</Text>
                  </View>
                ))}
                {monthSubs.length > 5 && (
                  <View style={[styles.inlineIcon, { marginLeft: -8, backgroundColor: ACCENT, borderColor: ACCENT }]}>
                    <Text style={{ fontSize: 9, color: "#fff", fontWeight: "800" }}>+{monthSubs.length - 5}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.summaryLine, { color: theme.subText }]}>
                You have{" "}
                <Text style={[styles.summaryBold, { color: theme.text }]}>{activeSubs.length}</Text>
                {" "}active subscription{activeSubs.length !== 1 ? "s" : ""}
              </Text>

              {/* End of month */}
              <View style={[styles.eomRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.eomLabel, { color: theme.subText }]}>End of month</Text>
                <Text style={styles.eomValue}>-{currency?.symbol}{formatPrice(eomTotal)}</Text>
              </View>
            </View>

            {/* ── Calendar card with swipe ── */}
            <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]} {...panResponder.panHandlers}>
              {/* Month navigation */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.navBtn, { backgroundColor: theme.iconBg }]} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name="chevron-back" size={18} color={theme.text} />
                </TouchableOpacity>
                <Animated.Text style={[styles.monthTitle, { color: theme.text, transform: [{ translateX: slideAnim }] }]}>
                  {MONTHS[month]} {year}
                </Animated.Text>
                <TouchableOpacity onPress={() => changeMonth(+1)} style={[styles.navBtn, { backgroundColor: theme.iconBg }]} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name="chevron-forward" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaders}>
                {DAYS.map((d, i) => (
                  <View key={i} style={{ width: DAY_W, alignItems: "center" }}>
                    <Text style={[styles.dayHeader, { color: theme.subText }]}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Grid */}
              <Animated.View style={[styles.grid, { transform: [{ translateX: slideAnim }] }]}>
                {grid.map((date, i) => {
                  if (!date) return <View key={`e-${i}`} style={{ width: DAY_W, height: DAY_W + 18 }} />;
                  const dStr   = toKey(date);
                  const subs   = paymentMap[dStr] || [];
                  const isToday   = dStr === todayStr;
                  const hasSubs   = subs.length > 0;
                  const isSelected = dStr === popupDay;

                  return (
                    <TouchableOpacity
                      key={dStr}
                      onPress={() => hasSubs ? setPopupDay(dStr === popupDay ? null : dStr) : null}
                      activeOpacity={hasSubs ? 0.7 : 1}
                      style={{ width: DAY_W, height: DAY_W + 18, alignItems: "center", paddingVertical: 2 }}
                    >
                      <View style={[
                        styles.dayCell,
                        isToday    && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                        hasSubs && !isToday && !isSelected && { backgroundColor: "rgba(124,92,255,0.08)", borderWidth: 1, borderColor: "rgba(124,92,255,0.18)" },
                      ]}>
                        <Text style={[
                          styles.dayNum,
                          { color: isToday || isSelected ? "#fff" : theme.text },
                        ]}>
                          {date.getDate()}
                        </Text>

                        {/* Rounded emoji stack */}
                        {hasSubs && (
                          <View style={styles.emojiStack}>
                            {subs.slice(0, 2).map((sub, si) => (
                              <View key={sub.id} style={[styles.emojiBubble, { marginLeft: si === 0 ? 0 : -4 }]}>
                                <Text style={{ fontSize: 8 }}>{safeEmoji(sub.icon)}</Text>
                              </View>
                            ))}
                            {subs.length > 2 && (
                              <View style={[styles.emojiBubble, { backgroundColor: ACCENT, marginLeft: -4 }]}>
                                <Text style={{ fontSize: 7, color: "#fff", fontWeight: "800" }}>+{subs.length-2}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </View>

            {/* Swipe hint */}
            <Text style={[styles.swipeHint, { color: theme.subText }]}>← swipe to change month →</Text>

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

  screenTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -1, marginBottom: 18, marginTop: 8 },

  summaryCard: {
    borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  summaryMonthLbl: { fontSize: 14, fontWeight: "600", marginBottom: 14 },
  iconRow:   { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  inlineIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  summaryLine: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  summaryBold: { fontWeight: "800", fontSize: 16 },
  eomRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, width: "100%",
  },
  eomLabel: { fontSize: 15 },
  eomValue: { fontSize: 16, fontWeight: "800", color: "#ef4444" },

  // Calendar card
  calCard: {
    borderRadius: 24, padding: 16,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
    overflow: "hidden",
  },
  monthNav:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn:     { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 16, fontWeight: "800" },
  dayHeaders: { flexDirection: "row", marginBottom: 4 },
  dayHeader:  { fontSize: 11, fontWeight: "700", textAlign: "center" },
  grid:       { flexDirection: "row", flexWrap: "wrap" },

  dayCell: {
    width: DAY_W - 4, minHeight: DAY_W - 4,
    borderRadius: 999, // full circle
    alignItems: "center", justifyContent: "center",
    paddingVertical: 4,
  },
  dayCellToday:    { backgroundColor: "#1e293b" },
  dayCellSelected: { backgroundColor: ACCENT },
  dayNum:          { fontSize: 13, fontWeight: "600" },

  emojiStack:  { flexDirection: "row", alignItems: "center", marginTop: 2 },
  emojiBubble: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)",
  },

  swipeHint: { textAlign: "center", fontSize: 12, marginTop: 10, opacity: 0.5 },
});
