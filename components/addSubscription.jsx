// components/addSubscription.jsx
import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, Switch, ScrollView, Modal, Platform,
  Animated, PanResponder, Dimensions, ActionSheetIOS,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import SwipeableModal from "./SwipeableModal";
import { useSubscriptions } from "../Context/subscriptionContext";
import { useApp } from "../Context/appContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJI_ICONS = [
  "⭐","🎬","🎵","📺","🎮","📰","☁️","💼","🏋️","📚",
  "🛒","🍔","🚗","💊","🔒","📱","🎧","🏠","✈️","💡",
  "🎨","📷","🧘","🤖","🔔","🎯","🏦","🎁","🧩","🌐",
];

const CYCLES    = ["Weekly", "Monthly", "Yearly"];
const CATEGORIES = [
  "Entertainment","Music","Gaming","Productivity","Cloud Storage",
  "News & Media","Health & Fitness","Food & Drink","Education",
  "Finance","Shopping","Other",
];
const REMINDERS = ["None", "1 day before", "3 days before", "1 week before"];

const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)"      },
  { code: "GBP", symbol: "£", label: "British Pound (£)"  },
  { code: "EUR", symbol: "€", label: "Euro (€)"           },
];

const SERVICE_ICONS = {
  netflix:"🎬", spotify:"🎵", youtube:"📺", "apple tv":"📺", disney:"🎬",
  hulu:"📺", "amazon prime":"🛒", prime:"🛒", xbox:"🎮", playstation:"🎮",
  "ps plus":"🎮", "game pass":"🎮", nintendo:"🎮", icloud:"☁️", dropbox:"☁️",
  "google one":"☁️", onedrive:"☁️", chatgpt:"🤖", openai:"🤖", gemini:"🤖",
  claude:"🤖", slack:"💼", notion:"💼", zoom:"💼", microsoft:"💼", figma:"🎨",
  gym:"🏋️", peloton:"🏋️", duolingo:"📚", coursera:"📚", udemy:"📚",
  audible:"📚", kindle:"📚", nyt:"📰", medium:"📰", uber:"🚗", lyft:"🚗",
  shopify:"🛒", canva:"🎨", adobe:"📷",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeEmoji(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

function autoIcon(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const key of Object.keys(SERVICE_ICONS)) {
    if (lower.includes(key)) return SERVICE_ICONS[key];
  }
  return null;
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

// ─── Native action sheet / alert picker (iOS = ActionSheet, Android = Alert) ──
// This renders OUTSIDE any Modal so it always appears on top
function useNativePicker() {
  const showPicker = (title, options, current, onSelect) => {
    if (Platform.OS === "ios") {
      const currentIndex = options.indexOf(current);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...options, "Cancel"],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: -1,
          userInterfaceStyle: "automatic",
          // Mark selected item (best effort — iOS doesn't natively highlight)
          message: current ? `Currently: ${current}` : undefined,
        },
        (idx) => {
          if (idx < options.length) onSelect(options[idx]);
        }
      );
    } else {
      // Android: Alert with buttons (works for short lists)
      Alert.alert(
        title,
        current ? `Currently: ${current}` : undefined,
        [
          ...options.map((opt) => ({
            text: opt === current ? `✓  ${opt}` : opt,
            onPress: () => onSelect(opt),
          })),
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };
  return showPicker;
}

// ─── Emoji picker (swipeable bottom sheet — standalone, no nested Modal) ──────
function EmojiPickerSheet({ visible, current, onSelect, onClose, theme }) {
  const SH = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true, damping: 24, stiffness: 240,
    }).start();
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
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        activeOpacity={1} onPress={onClose}
      />
      <Animated.View style={[ep.sheet, { backgroundColor: theme.card, transform: [{ translateY }] }]}>
        <View {...pan.panHandlers} style={ep.handleArea}>
          <View style={[ep.handle, { backgroundColor: theme.border }]} />
        </View>
        <Text style={[ep.title, { color: theme.text }]}>Choose Icon</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ep.grid}>
          {EMOJI_ICONS.map((ic) => (
            <TouchableOpacity
              key={ic}
              onPress={() => { onSelect(ic); onClose(); }}
              style={[ep.item, { backgroundColor: theme.input }, current === ic && ep.selected]}
            >
              <Text style={ep.emoji}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
const ep = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 44, maxHeight: "58%",
  },
  handleArea: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 10 },
  item: {
    width: 54, height: 54, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  selected: { borderColor: "#8e44ad", backgroundColor: "#fdf4ff" },
  emoji: { fontSize: 26 },
});

// ─── Date picker ──────────────────────────────────────────────────────────────
// iOS: inline spinner in a bottom sheet Modal
// Android: native calendar dialog (shown directly, no extra Modal needed)
function DatePickerSheet({ visible, value, onConfirm, onCancel, theme }) {
  const [temp, setTemp] = useState(value || new Date());

  useEffect(() => {
    if (visible) setTemp(value || new Date());
  }, [visible]);

  if (!visible) return null;

  // Android — render the picker directly (it shows as a system dialog)
  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={temp}
        mode="date"
        display="default"
        onChange={(e, d) => {
          if (e.type === "dismissed") { onCancel(); return; }
          if (d) onConfirm(d);
        }}
      />
    );
  }

  // iOS — spinner inside a bottom sheet
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={ds.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={[ds.sheet, { backgroundColor: theme.card }]}>
          <View style={[ds.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={[ds.cancel, { color: theme.subText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[ds.headerTitle, { color: theme.text }]}>First Billed</Text>
            <TouchableOpacity onPress={() => onConfirm(temp)}>
              <Text style={ds.done}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={temp}
            mode="date"
            display="spinner"
            textColor={theme.text}
            onChange={(_, d) => { if (d) setTemp(d); }}
            style={{ width: "100%" }}
          />
        </View>
      </View>
    </Modal>
  );
}
const ds = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  cancel: { fontSize: 16 },
  done: { fontSize: 16, fontWeight: "700", color: "#8e44ad" },
});

// ─── Card + Row layout helpers ────────────────────────────────────────────────
function Card({ children, theme }) {
  return (
    <View style={[cd.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {children}
    </View>
  );
}
const cd = StyleSheet.create({
  wrap: {
    borderRadius: 16, marginHorizontal: 16, marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth, overflow: "hidden",
  },
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
  wrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
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

// ─── Main component ───────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  "e.g. Netflix","e.g. Spotify","e.g. ChatGPT Pro",
  "e.g. iCloud+","e.g. Xbox Game Pass",
];

const AddSubSheet = forwardRef((props, ref) => {
  const { addSubscription, updateSubscription } = useSubscriptions();
  const { theme } = useApp();
  const showPicker = useNativePicker();

  const [visible, setVisible]             = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [icon, setIcon]                   = useState("⭐");
  const [name, setName]                   = useState("");
  const [amount, setAmount]               = useState("");
  const [amountCurrency, setAmountCurrency] = useState("NGN");
  const [billingDate, setBillingDate]     = useState(new Date());
  const [cycle, setCycle]                 = useState("Monthly");
  const [isTrial, setIsTrial]             = useState(false);
  const [category, setCategory]           = useState("Entertainment");
  const [reminder, setReminder]           = useState("None");
  const [note, setNote]                   = useState("");

  const [showIcons, setShowIcons] = useState(false);
  const [showDate,  setShowDate]  = useState(false);

  const ph = useRef(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]).current;

  useImperativeHandle(ref, () => ({
    expand: () => { resetForm(); setVisible(true); },
    openEdit: (sub) => {
      setEditingId(sub.id);
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
    close: () => setVisible(false),
  }));

  const resetForm = () => {
    setEditingId(null); setIcon("⭐"); setName(""); setAmount("");
    setAmountCurrency("NGN"); setBillingDate(new Date()); setCycle("Monthly");
    setIsTrial(false); setCategory("Entertainment"); setReminder("None"); setNote("");
  };

  const handleNameChange = (val) => {
    setName(val);
    const auto = autoIcon(val);
    if (auto) setIcon(auto);
  };

  // ── Native pickers ──
  const openCyclePicker = () =>
    showPicker("Billing Cycle", CYCLES, cycle, setCycle);

  const openCategoryPicker = () =>
    showPicker("Category", CATEGORIES, category, setCategory);

  const openReminderPicker = () =>
    showPicker("Reminder", REMINDERS, reminder, setReminder);

  const openCurrencyPicker = () =>
    showPicker(
      "Billed Currency",
      CURRENCIES.map((c) => c.label),
      CURRENCIES.find((c) => c.code === amountCurrency)?.label,
      (label) => {
        const found = CURRENCIES.find((c) => c.label === label);
        if (found) setAmountCurrency(found.code);
      }
    );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a subscription name."); return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Missing amount", "Please enter a valid amount."); return;
    }
    const renewal = calcRenewal(billingDate, cycle);
    const sub = {
      name:           name.trim(),
      amount:         parseFloat(amount),
      amountCurrency,
      cycle,
      icon:           safeEmoji(icon),
      isTrial,
      startDate:      billingDate.toISOString(),
      billingDate:    renewal ? renewal.toISOString().split("T")[0] : null,
      category,
      reminder,
      note:           note.trim(),
    };
    const ok = editingId
      ? await updateSubscription({ ...sub, id: editingId })
      : await addSubscription(sub);
    if (ok) { resetForm(); setVisible(false); }
  };

  const renewal      = calcRenewal(billingDate, cycle);
  const displayIcon  = safeEmoji(icon);
  const currSymbol   = CURRENCIES.find((c) => c.code === amountCurrency)?.symbol ?? "₦";

  return (
    <>
      <SwipeableModal visible={visible} onClose={() => setVisible(false)} snapHeight={0.9}>

        {/* Header */}
        <View style={[hdr.wrap, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[hdr.circleBtn, { backgroundColor: theme.input }]}
            onPress={() => setVisible(false)}
          >
            <Text style={[hdr.x, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[hdr.title, { color: theme.text }]}>
            {editingId ? "Edit Subscription" : "New Subscription"}
          </Text>
          <TouchableOpacity style={hdr.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[frm.scroll, { backgroundColor: theme.background }]}
        >
          {/* ── Card 1: Icon + Name + Amount ── */}
          <Card theme={theme}>
            {/* Icon + Name */}
            <View style={[frm.iconNameRow, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                style={[frm.iconBtn, { backgroundColor: theme.input }]}
                onPress={() => setShowIcons(true)}
              >
                <Text style={frm.iconEmoji}>{displayIcon}</Text>
              </TouchableOpacity>
              <TextInput
                style={[frm.nameInput, { color: theme.text }]}
                placeholder={ph}
                placeholderTextColor={theme.subText}
                value={name}
                onChangeText={handleNameChange}
              />
            </View>

            {/* Amount + currency toggle */}
            <View style={frm.amountRow}>
              <Text style={[frm.amountLabel, { color: theme.subText }]}>Amount</Text>
              <View style={frm.amountRight}>
                {/* Currency badge — tap to change */}
                <TouchableOpacity
                  style={[frm.currBadge, { backgroundColor: theme.input }]}
                  onPress={openCurrencyPicker}
                >
                  <Text style={[frm.currBadgeText, { color: theme.text }]}>{currSymbol}</Text>
                  <Ionicons name="chevron-down" size={11} color={theme.subText} />
                </TouchableOpacity>
                <TextInput
                  style={[frm.amountInput, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>
          </Card>

          {/* ── Card 2: Billing ── */}
          <Card theme={theme}>
            {/* First billed */}
            <Row label="First billed" theme={theme}>
              <TouchableOpacity
                style={[frm.dateChip, { backgroundColor: theme.input }]}
                onPress={() => setShowDate(true)}
              >
                <Text style={[frm.dateChipText, { color: theme.text }]}>
                  {prettyDate(billingDate)}
                </Text>
                <Ionicons name="calendar-outline" size={13} color={theme.subText} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </Row>

            {/* Renewal preview */}
            {renewal && (
              <View style={[frm.renewalRow, { borderBottomColor: theme.border }]}>
                <Ionicons name="refresh" size={11} color="#16a34a" />
                <Text style={frm.renewalText}>Renews {prettyDate(renewal)}</Text>
              </View>
            )}

            {/* Billing cycle */}
            <Row label="Billing cycle" theme={theme}>
              <DropButton value={cycle} onPress={openCyclePicker} theme={theme} />
            </Row>

            {/* Free trial */}
            <Row label="Free trial" theme={theme} last>
              <Switch
                value={isTrial} onValueChange={setIsTrial}
                trackColor={{ false: theme.border, true: "#c084fc" }}
                thumbColor={isTrial ? "#8e44ad" : "#f1f5f9"}
              />
            </Row>
          </Card>

          {/* ── Card 3: Category + Reminder ── */}
          <Card theme={theme}>
            <Row label="Category" theme={theme}>
              <DropButton value={category} onPress={openCategoryPicker} theme={theme} />
            </Row>
            <Row label="Reminder" theme={theme} last>
              <DropButton value={reminder} onPress={openReminderPicker} theme={theme} />
            </Row>
          </Card>

          {/* ── Card 4: Note ── */}
          <Card theme={theme}>
            <View style={frm.noteRow}>
              <Text style={[frm.noteLabel, { color: theme.text }]}>Note</Text>
              <TextInput
                style={[frm.noteInput, { color: theme.subText }]}
                placeholder="Optional"
                placeholderTextColor={theme.subText}
                value={note}
                onChangeText={setNote}
                textAlign="right"
              />
            </View>
          </Card>
        </ScrollView>
      </SwipeableModal>

      {/* Emoji picker — own Modal, always on top */}
      <EmojiPickerSheet
        visible={showIcons} current={displayIcon}
        onSelect={setIcon} onClose={() => setShowIcons(false)} theme={theme}
      />

      {/* Date picker — own Modal / system dialog, always on top */}
      <DatePickerSheet
        visible={showDate} value={billingDate}
        onConfirm={(d) => { setBillingDate(d); setShowDate(false); }}
        onCancel={() => setShowDate(false)} theme={theme}
      />
    </>
  );
});

export default AddSubSheet;

// ─── Styles ───────────────────────────────────────────────────────────────────
const hdr = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  circleBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  x: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700" },
  saveBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#8e44ad",
    alignItems: "center", justifyContent: "center",
  },
});

const frm = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 60 },

  iconNameRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  iconEmoji: { fontSize: 26 },
  nameInput: { flex: 1, fontSize: 16 },

  amountRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  amountLabel: { fontSize: 16 },
  amountRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  currBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8,
  },
  currBadgeText: { fontSize: 15, fontWeight: "700" },
  amountInput: { fontSize: 16, fontWeight: "600", minWidth: 80, textAlign: "right" },

  dateChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  dateChipText: { fontSize: 15, fontWeight: "600" },

  renewalRow: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  renewalText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },

  noteRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  noteLabel: { fontSize: 16 },
  noteInput: { flex: 1, fontSize: 16 },
});
