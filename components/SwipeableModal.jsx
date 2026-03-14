// components/SwipeableModal.jsx
// Fixed height (no keyboard bleed) + swipe-to-close + background blur
import React, { useEffect, useRef } from "react";
import {
  Modal, View, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions, Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { useApp } from "../Context/appContext";

const { height: SCREEN_H } = Dimensions.get("window");

export default function SwipeableModal({
  visible, onClose, children, snapHeight = 0.78,
}) {
  const { theme, darkMode } = useApp();
  const SHEET_H   = SCREEN_H * snapHeight;
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_H, duration: 260, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Pan responder lives ONLY on the handle area — scroll inside still works
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) => gs.dy > 4,
      onPanResponderMove:   (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease:(_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SHEET_H, duration: 230, useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  const sheetBg = theme.card;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Blurred backdrop */}
      <BlurView
        intensity={darkMode ? 30 : 20}
        tint={darkMode ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {/* Dim overlay on top of blur */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Fixed-height sheet anchored to bottom */}
      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_H, backgroundColor: sheetBg, transform: [{ translateY }] },
        ]}
      >
        {/* ── Handle — pan responder here only so ScrollView inside isn't blocked ── */}
        <View {...pan.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>

        {/* Content fills remaining height */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
  },
  handleArea: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 38, height: 4, borderRadius: 2 },
  content: { flex: 1 },
});
