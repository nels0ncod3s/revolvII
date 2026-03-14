// components/editSubscription.jsx
// Separate edit modal with Cancel Subscription option
import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, Switch, ScrollView, Modal, Platform, ActionSheetIOS,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import SwipeableModal from "./SwipeableModal";
import { useSubscriptions } from "../Context/subscriptionContext";
import { useApp } from "../Context/appContext";

const ACCENT = "#7c5cff";

const CYCLES     = ["Weekly", "Monthly", "Yearly"];
const CATEGORIES = [
  "Entertainment","Music","Gaming","Productivity","Cloud Storage",
  "News & Media","Health & Fitness","Food & Drink","Education",
  "Finance","Shopping","Other",
];
const REMINDERS  = ["None", "1 day before", "3 days before", "1 week before"];
const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)"      },
  { code: "GBP", symbol: "£", label: "British Pound (£)"  },
  { code: "EUR", symbol: "€", label: "Euro (€)"           },
];
const EMOJI_ICONS = [
  "⭐","🎬","🎵","📺","🎮","📰","☁️","💼","🏋️","📚",
  "🛒","🍔","🚗","💊","🔒","📱","🎧","🏠","✈️","💡",
  "🎨","📷","🧘","🤖","🔔","🎯","🏦","🎁","🧩","🌐",
];

function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

function calcRenewal(dateObj, cycle) {
  if (!dateObj) return null;
  const origD = dateObj.getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let next = new Date(dateObj); next.setHours(0, 0, 0, 0);
  if (next > today) return next;
  if (cycle === "Weekly") {
    while (next <= today) next.setDate(next.getDate() + 7);
  } else if (cycle === "Monthly") {
    while (next <= today) {
      let nm = next.getMonth() + 2, ny = next.getFullYear();
      if (nm > 12) { nm = 1; ny++; }
      next = new Date(ny, nm - 1, Math.min(origD, new Date(ny, nm, 0).getDate()));
    }
  } else if (cycle === "Yearly") {
    while (next <= today)
      next = new Date(next.getFullYear() + 1, dateObj.getMonth(), origD);
  }
  return next;
}

function prettyDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Native picker ──
function useNativePicker() {
  return (title, options, current, onSelect) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { title, options: [...options, "Cancel"], cancelButtonIndex: options.length, message: current ? `Currently: ${current}` : undefined },
        (idx) => { if (idx < options.length) onSelect(options[idx]); }
      );
    } else {
      Alert.alert(title, current ? `Currently: ${current}` : undefined, [
        ...options.map((opt) => ({ text: opt === current ? `✓  ${opt}` : opt, onPress: () => onSelect(opt) })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };
}

// ── Emoji picker ──
import { Animated, PanResponder, Dimensions } from "react-native";
function EmojiPickerSheet({ visible, current, onSelect, onClose, theme }) {
  const SH = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(SH)).current;
  useEffect(() => {
    Animated.spring(translateY, { toValue: visible ? 0 : SH, useNativeDriver: true, damping: 24, stiffness: 240 }).start();
  }, [visible]);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
    onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 80 || gs.vy > 0.5) {
        Animated.timing(translateY, { toValue: SH, duration: 220, useNativeDriver: true }).start(onClose);
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 240 }).start();
      }
    },
  })).current;
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[ep.sheet, { backgroundColor: theme.card, transform: [{ translateY }] }]}>
        <View {...pan.panHandlers} style={ep.handleArea}>
          <View style={[ep.handle, { backgroundColor: theme.border }]} />
        </View>
        <Text style={[ep.title, { color: theme.text }]}>Choose Icon</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ep.grid}>
          {EMOJI_ICONS.map((ic) => (
            <TouchableOpacity key={ic} onPress={() => { onSelect(ic); onClose(); }}
              style={[ep.item, { backgroundColor: theme.input }, current === ic && ep.selected]}>
              <Text style={ep.emoji}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
const ep = StyleSheet.create({
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 44, maxHeight: "58%" },
  handleArea: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 10 },
  item: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  selected: { borderColor: ACCENT, backgroundColor: "#ede9fe" },
  emoji: { fontSize: 26 },
});

// ── Date picker ──
function DatePickerSheet({ visible, value, onConfirm, onCancel, theme }) {
  const [temp, setTemp] = useState(value || new Date());
  useEffect(() => { if (visible) setTemp(value || new Date()); }, [visible]);
  if (!visible) return null;
  if (Platform.OS === "android") {
    return <DateTimePicker value={temp} mode="date" display="default"
      onChange={(e, d) => { if (e.type === "dismissed") { onCancel(); return; } if (d) onConfirm(d); }} />;
  }
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={ds.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={[ds.sheet, { backgroundColor: theme.card }]}>
          <View style={[ds.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onCancel}><Text style={[ds.cancel, { color: theme.subText }]}>Cancel</Text></TouchableOpacity>
            <Text style={[ds.headerTitle, { color: theme.text }]}>First Billed</Text>
            <TouchableOpacity onPress={() => onConfirm(temp)}><Text style={ds.done}>Done</Text></TouchableOpacity>
          </View>
          <DateTimePicker value={temp} mode="date" display="spinner" textColor={theme.text}
            onChange={(_, d) => { if (d) setTemp(d); }} style={{ width: "100%" }} />
        </View>
      </View>
    </Modal>
  );
}
const ds = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  cancel: { fontSize: 16 },
  done: { fontSize: 16, fontWeight: "700", color: ACCENT },
});

// ── Card / Row ──
function Card({ children, theme }) {
  return <View style={[cd.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}
const cd = StyleSheet.create({
  wrap: { borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
});
function Row({ label, children, theme, last }) {
  return (
    <View style={[rw.wrap, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      <Text style={[rw.label, { color: theme.text }]}>{label}</Text>
      <View style={rw.right}>{children}</View>
    </View>
  );
}
const rw = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 16 },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
});
function DropButton({ value, onPress, theme }) {
  return (
    <TouchableOpacity style={rw.right} onPress={onPress}>
      <Text style={{ fontSize: 15, color: theme.subText }}>{value}</Text>
      <Ionicons name="chevron-expand" size={15} color={theme.subText} />
    </TouchableOpacity>
  );
}

// ── Main EditSubSheet ──
const EditSubSheet = forwardRef((props, ref) => {
  const { updateSubscription, cancelSubscription, deleteSubscription } = useSubscriptions();
  const { theme } = useApp();
  const showPicker = useNativePicker();

  const [visible, setVisible]           = useState(false);
  const [subId, setSubId]               = useState(null);
  const [icon, setIcon]                 = useState("⭐");
  const [name, setName]                 = useState("");
  const [amount, setAmount]             = useState("");
  const [amountCurrency, setAmountCurrency] = useState("NGN");
  const [billingDate, setBillingDate]   = useState(new Date());
  const [cycle, setCycle]               = useState("Monthly");
  const [isTrial, setIsTrial]           = useState(false);
  const [category, setCategory]         = useState("Entertainment");
  const [reminder, setReminder]         = useState("None");
  const [note, setNote]                 = useState("");
  const [showIcons, setShowIcons]       = useState(false);
  const [showDate, setShowDate]         = useState(false);

  useImperativeHandle(ref, () => ({
    open: (sub) => {
      setSubId(sub.id);
      setIcon(safeEmoji(sub.icon));
      setName(sub.name || "");
      setAmount(sub.amount?.toString() || "");
      setAmountCurrency(sub.amountCurrency || "NGN");
      setBillingDate(sub.startDate ? new Date(sub.startDate) : new Date());
      setCycle(sub.cycle || "Monthly");
      setIsTrial(!!sub.isTrial);
      setCategory(sub.category || "Entertainment");
      setReminder(sub.reminder || "None");
      setNote(sub.note || "");
      setVisible(true);
    },
  }));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Missing name", "Please enter a name."); return; }
    if (!amount || isNaN(parseFloat(amount))) { Alert.alert("Missing amount", "Please enter a valid amount."); return; }
    const renewal = calcRenewal(billingDate, cycle);
    const ok = await updateSubscription({
      id: subId, name: name.trim(), amount: parseFloat(amount), amountCurrency,
      cycle, icon: safeEmoji(icon), isTrial,
      startDate: billingDate.toISOString(),
      billingDate: renewal ? renewal.toISOString().split("T")[0] : null,
      category, reminder, note: note.trim(),
    });
    if (ok) setVisible(false);
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      `Mark ${name} as cancelled? The ${CURRENCIES.find(c=>c.code===amountCurrency)?.symbol}${amount}/mo will count as savings.`,
      [
        { text: "Keep it", style: "cancel" },
        { text: "Cancel it", style: "destructive", onPress: () => { cancelSubscription(subId); setVisible(false); } },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert("Delete", `Permanently delete ${name}?`, [
      { text: "No", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteSubscription(subId); setVisible(false); } },
    ]);
  };

  const renewal    = calcRenewal(billingDate, cycle);
  const currSymbol = CURRENCIES.find((c) => c.code === amountCurrency)?.symbol ?? "₦";

  return (
    <>
      <SwipeableModal visible={visible} onClose={() => setVisible(false)} snapHeight={0.92}>
        {/* Header */}
        <View style={[hdr.wrap, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[hdr.circleBtn, { backgroundColor: theme.input }]} onPress={() => setVisible(false)}>
            <Text style={[hdr.x, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[hdr.title, { color: theme.text }]}>Edit Subscription</Text>
          <TouchableOpacity style={hdr.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" contentContainerStyle={[frm.scroll, { backgroundColor: theme.background }]}>

          {/* Card 1: Icon + Name + Amount */}
          <Card theme={theme}>
            <View style={[frm.iconNameRow, { borderBottomColor: theme.border }]}>
              <TouchableOpacity style={[frm.iconBtn, { backgroundColor: theme.input }]} onPress={() => setShowIcons(true)}>
                <Text style={frm.iconEmoji}>{safeEmoji(icon)}</Text>
              </TouchableOpacity>
              <TextInput style={[frm.nameInput, { color: theme.text }]} placeholder="Name"
                placeholderTextColor={theme.subText} value={name} onChangeText={setName} />
            </View>
            <View style={frm.amountRow}>
              <Text style={[frm.amountLabel, { color: theme.subText }]}>Amount</Text>
              <View style={frm.amountRight}>
                <TouchableOpacity style={[frm.currBadge, { backgroundColor: theme.input }]}
                  onPress={() => showPicker("Billed Currency", CURRENCIES.map(c=>c.label),
                    CURRENCIES.find(c=>c.code===amountCurrency)?.label,
                    (lbl) => { const f = CURRENCIES.find(c=>c.label===lbl); if(f) setAmountCurrency(f.code); })}>
                  <Text style={[frm.currBadgeText, { color: theme.text }]}>{currSymbol}</Text>
                  <Ionicons name="chevron-down" size={11} color={theme.subText} />
                </TouchableOpacity>
                <TextInput style={[frm.amountInput, { color: theme.text }]} placeholder="0.00"
                  placeholderTextColor={theme.subText} keyboardType="numeric" value={amount} onChangeText={setAmount} />
              </View>
            </View>
          </Card>

          {/* Card 2: Billing */}
          <Card theme={theme}>
            <Row label="First billed" theme={theme}>
              <TouchableOpacity style={[frm.dateChip, { backgroundColor: theme.input }]} onPress={() => setShowDate(true)}>
                <Text style={[frm.dateChipText, { color: theme.text }]}>{prettyDate(billingDate)}</Text>
                <Ionicons name="calendar-outline" size={13} color={theme.subText} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </Row>
            {renewal && (
              <View style={[frm.renewalRow, { borderBottomColor: theme.border }]}>
                <Ionicons name="refresh" size={11} color="#16a34a" />
                <Text style={frm.renewalText}>Renews {prettyDate(renewal)}</Text>
              </View>
            )}
            <Row label="Billing cycle" theme={theme}>
              <DropButton value={cycle} onPress={() => showPicker("Billing Cycle", CYCLES, cycle, setCycle)} theme={theme} />
            </Row>
            <Row label="Free trial" theme={theme} last>
              <Switch value={isTrial} onValueChange={setIsTrial}
                trackColor={{ false: theme.border, true: "#c084fc" }} thumbColor={isTrial ? ACCENT : "#f1f5f9"} />
            </Row>
          </Card>

          {/* Card 3: Category + Reminder */}
          <Card theme={theme}>
            <Row label="Category" theme={theme}>
              <DropButton value={category} onPress={() => showPicker("Category", CATEGORIES, category, setCategory)} theme={theme} />
            </Row>
            <Row label="Reminder" theme={theme} last>
              <DropButton value={reminder} onPress={() => showPicker("Reminder", REMINDERS, reminder, setReminder)} theme={theme} />
            </Row>
          </Card>

          {/* Card 4: Note */}
          <Card theme={theme}>
            <View style={frm.noteRow}>
              <Text style={[frm.noteLabel, { color: theme.text }]}>Note</Text>
              <TextInput style={[frm.noteInput, { color: theme.subText }]} placeholder="Optional"
                placeholderTextColor={theme.subText} value={note} onChangeText={setNote} textAlign="right" />
            </View>
          </Card>

          {/* Cancel subscription button */}
          <TouchableOpacity style={[frm.cancelSubBtn, { borderColor: "#f59e0b" }]} onPress={handleCancel}>
            <Ionicons name="pause-circle-outline" size={20} color="#d97706" />
            <View>
              <Text style={frm.cancelSubText}>Cancel Subscription</Text>
              <Text style={frm.cancelSubSub}>Moves amount to your savings</Text>
            </View>
          </TouchableOpacity>

          {/* Delete button */}
          <TouchableOpacity style={[frm.deleteBtn, { borderColor: "#fecaca" }]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={frm.deleteText}>Delete Permanently</Text>
          </TouchableOpacity>

        </ScrollView>
      </SwipeableModal>

      <EmojiPickerSheet visible={showIcons} current={safeEmoji(icon)}
        onSelect={setIcon} onClose={() => setShowIcons(false)} theme={theme} />
      <DatePickerSheet visible={showDate} value={billingDate}
        onConfirm={(d) => { setBillingDate(d); setShowDate(false); }}
        onCancel={() => setShowDate(false)} theme={theme} />
    </>
  );
});

export default EditSubSheet;

const hdr = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  circleBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  x: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700" },
  saveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
});
const frm = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 60 },
  iconNameRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconEmoji: { fontSize: 26 },
  nameInput: { flex: 1, fontSize: 16 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  amountLabel: { fontSize: 16 },
  amountRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  currBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  currBadgeText: { fontSize: 15, fontWeight: "700" },
  amountInput: { fontSize: 16, fontWeight: "600", minWidth: 80, textAlign: "right" },
  dateChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  dateChipText: { fontSize: 15, fontWeight: "600" },
  renewalRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  renewalText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },
  noteRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  noteLabel: { fontSize: 16 },
  noteInput: { flex: 1, fontSize: 16 },
  cancelSubBtn: { marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 12 },
  cancelSubText: { fontSize: 15, fontWeight: "700", color: "#d97706" },
  cancelSubSub: { fontSize: 12, color: "#92400e", marginTop: 1 },
  deleteBtn: { marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deleteText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
