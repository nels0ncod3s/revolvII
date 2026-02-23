// components/addSubscription.jsx
import React, { forwardRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import BottomSheet, { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSubscriptions } from '../Context/subscriptionContext';

const AddSubSheet = forwardRef((props, ref) => {
  const snapPoints = useMemo(() => ["60%"], []);
  const { addSubscription } = useSubscriptions(); // <--- USE CONTEXT
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSave = async () => {
    if (!name || !amount) {
      Alert.alert("Missing Info", "Please enter a name and amount.");
      return;
    }

    const newSub = { name, amount: parseFloat(amount), cycle: "Monthly" };
    
    // Call Context function instead of direct storage
    const success = await addSubscription(newSub);

    if (success) {
      setName("");
      setAmount("");
      ref.current?.close();
      // No need for onSaveSuccess() callback anymore, Context handles it!
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Add Subscription</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Subscription Name</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="e.g. Netflix"
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Monthly Amount (₦)</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add Subscription</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

export default AddSubSheet;

// ... keep your existing styles ...
const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: "#ffffff" },
  handle: { backgroundColor: "#e5e7eb", width: 40 },
  content: { padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: "#111111", marginBottom: 20 },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#f1f5f9", padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  saveButton: { backgroundColor: "#8e44ad", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});