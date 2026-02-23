// components/addSubscription.jsx
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Switch } from "react-native";
import SwipeableModal from "./SwipeableModal";
import { useSubscriptions } from '../Context/subscriptionContext';

const ICONS = [
  { label: "🎬" }, { label: "🎵" }, { label: "📺" }, { label: "🎮" },
  { label: "📰" }, { label: "☁️" }, { label: "💼" }, { label: "🏋️" },
  { label: "📚" }, { label: "🛒" }, { label: "🍔" }, { label: "🚗" },
  { label: "💊" }, { label: "🔒" }, { label: "📱" }, { label: "⭐" },
];

const CYCLES = ["Weekly", "Monthly", "Yearly"];

const AddSubSheet = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("Monthly");
  const [icon, setIcon] = useState("⭐");
  const [isTrial, setIsTrial] = useState(false);
  const [billingDate, setBillingDate] = useState("");

  const { addSubscription, updateSubscription } = useSubscriptions();

  useImperativeHandle(ref, () => ({
    expand: () => { resetForm(); setVisible(true); },
    openEdit: (sub) => {
      setEditingId(sub.id);
      setName(sub.name || "");
      setAmount(sub.amount?.toString() || "");
      setCycle(sub.cycle || "Monthly");
      setIcon(sub.icon || "⭐");
      setIsTrial(sub.isTrial || false);
      setBillingDate(sub.billingDate || "");
      setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const resetForm = () => {
    setEditingId(null); setName(""); setAmount("");
    setCycle("Monthly"); setIcon("⭐"); setIsTrial(false); setBillingDate("");
  };

  const handleSave = async () => {
    if (!name || !amount) { Alert.alert("Missing Info", "Please enter a name and amount."); return; }
    const sub = { name, amount: parseFloat(amount), cycle, icon, isTrial, billingDate };
    const success = editingId
      ? await updateSubscription({ ...sub, id: editingId })
      : await addSubscription(sub);
    if (success) { resetForm(); setVisible(false); }
  };

  return (
    <SwipeableModal visible={visible} onClose={() => setVisible(false)} snapHeight={0.85}>
      <Text style={styles.title}>{editingId ? "Edit Subscription" : "Add Subscription"}</Text>

      {/* Icon Picker */}
      <Text style={styles.label}>Icon</Text>
      <View style={styles.iconGrid}>
        {ICONS.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => setIcon(item.label)}
            style={[styles.iconOption, icon === item.label && styles.iconSelected]}
          >
            <Text style={styles.iconEmoji}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Subscription Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Netflix" value={name} onChangeText={setName} />

      <Text style={styles.label}>Amount (₦)</Text>
      <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

      <Text style={styles.label}>Billing Cycle</Text>
      <View style={styles.cycleRow}>
        {CYCLES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCycle(c)} style={[styles.cycleOption, cycle === c && styles.cycleSelected]}>
            <Text style={[styles.cycleText, cycle === c && styles.cycleTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Next Billing Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="e.g. 2025-03-25" value={billingDate} onChangeText={setBillingDate} />

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Free Trial</Text>
          <Text style={styles.toggleSub}>Mark this as a free trial</Text>
        </View>
        <Switch value={isTrial} onValueChange={setIsTrial} trackColor={{ false: "#e2e8f0", true: "#d8b4fe" }} thumbColor={isTrial ? "#8e44ad" : "#f4f4f5"} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{editingId ? "Save Changes" : "Add Subscription"}</Text>
      </TouchableOpacity>
    </SwipeableModal>
  );
});

export default AddSubSheet;

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#111111", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#f1f5f9", padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  iconOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  iconSelected: { borderColor: "#8e44ad", backgroundColor: "#fdf4ff" },
  iconEmoji: { fontSize: 22 },
  cycleRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  cycleOption: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  cycleSelected: { borderColor: "#8e44ad", backgroundColor: "#fdf4ff" },
  cycleText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  cycleTextSelected: { color: "#8e44ad" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20 },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  toggleSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  saveButton: { backgroundColor: "#8e44ad", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 4 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
