// app/setup/name.jsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { userStorage } from "../../utils/storage";

const AVATARS = [
  "🧑🏻", "🧑🏼", "🧑🏽", "🧑🏾", "🧑🏿",
  "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿",
  "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿",
  "🧔🏻", "🧔🏼", "🧔🏽", "🧔🏾", "🧔🏿",
  "👩🏻", "👩🏼", "👩🏽", "👩🏾", "👩🏿",
  "🧓🏻", "🧓🏼", "🧓🏽", "🧓🏾", "🧓🏿",
  "👨🏻‍💻", "👩🏽‍💻", "🧑🏾‍💻", "👨🏿‍💼", "👩🏻‍💼",
];

export default function NameSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🧑🏽");

  const handleContinue = async () => {
    if (!name.trim()) return;
    await userStorage.saveProfile({ name: name.trim(), avatar: selectedAvatar });
    router.replace("/setup/notifications");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>Step 1 of 2</Text>
        <Text style={styles.title}>What should we{"\n"}call you?</Text>
        <Text style={styles.subtitle}>Pick an avatar and enter your name</Text>

        {/* Selected avatar preview */}
        <View style={styles.previewWrap}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarPreviewEmoji}>{selectedAvatar}</Text>
          </View>
        </View>

        {/* Avatar grid */}
        <View style={styles.avatarGrid}>
          {AVATARS.map((av) => (
            <TouchableOpacity
              key={av}
              onPress={() => setSelectedAvatar(av)}
              style={[styles.avatarOption, selectedAvatar === av && styles.avatarSelected]}
            >
              <Text style={styles.avatarEmoji}>{av}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name input */}
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 28, paddingTop: 60 },
  step: { fontSize: 13, fontWeight: "700", color: "#a855f7", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 34, fontWeight: "900", color: "#1e293b", lineHeight: 42, marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94a3b8", marginBottom: 32 },

  previewWrap: { alignItems: "center", marginBottom: 24 },
  avatarPreview: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#faf5ff", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#8e44ad" },
  avatarPreviewEmoji: { fontSize: 50 },

  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28, justifyContent: "center" },
  avatarOption: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  avatarSelected: { borderColor: "#8e44ad", backgroundColor: "#fdf4ff" },
  avatarEmoji: { fontSize: 28 },

  input: { backgroundColor: "#f1f5f9", padding: 18, borderRadius: 16, fontSize: 18, fontWeight: "600", color: "#1e293b", marginBottom: 24 },
  button: { backgroundColor: "#8e44ad", paddingVertical: 18, borderRadius: 18, alignItems: "center" },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
