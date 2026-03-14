// components/AvatarPicker.jsx
// Now uses SwipeableModal so it can be swiped down to close
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import SwipeableModal from "./SwipeableModal";
import { useApp } from "../Context/appContext";

const AVATARS = [
  "🧑🏻","🧑🏼","🧑🏽","🧑🏾","🧑🏿",
  "👦🏻","👦🏼","👦🏽","👦🏾","👦🏿",
  "👧🏻","👧🏼","👧🏽","👧🏾","👧🏿",
  "🧔🏻","🧔🏼","🧔🏽","🧔🏾","🧔🏿",
  "👩🏻","👩🏼","👩🏽","👩🏾","👩🏿",
  "🧓🏻","🧓🏼","🧓🏽","🧓🏾","🧓🏿",
  "👨🏻‍💻","👩🏽‍💻","🧑🏾‍💻","👨🏿‍💼","👩🏻‍💼",
];

export default function AvatarPicker({ visible, current, onSelect, onClose }) {
  const { theme } = useApp();

  return (
    <SwipeableModal visible={visible} onClose={onClose} snapHeight={0.55}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>Choose Avatar</Text>
        <View style={styles.grid}>
          {AVATARS.map((av) => (
            <TouchableOpacity
              key={av}
              onPress={() => { onSelect(av); onClose(); }}
              style={[
                styles.avatarBtn,
                { backgroundColor: theme.input },
                current === av && { borderColor: "#8e44ad", backgroundColor: "#fdf4ff" },
              ]}
            >
              <Text style={styles.avatarEmoji}>{av}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.input }]} onPress={onClose}>
          <Text style={[styles.cancelText, { color: theme.subtext }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SwipeableModal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 20, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 20 },
  avatarBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  avatarEmoji: { fontSize: 30 },
  cancelBtn: { padding: 16, borderRadius: 14, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "700" },
});
