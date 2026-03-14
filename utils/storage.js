// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUBS_KEY    = "@revolv_subscriptions";
const PROFILE_KEY = "@revolv_profile";

// ─── Subscription storage ─────────────────────────────────────────────────────

// Ensures icons are always stored/returned as plain emoji strings
function sanitiseIcon(raw) {
  if (!raw) return "⭐";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.value === "string") return raw.value;
  return "⭐";
}

export const subscriptionStorage = {

  getAll: async () => {
    try {
      const data = await AsyncStorage.getItem(SUBS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Migrate any old {type, value} icon objects to plain strings
      return parsed.map((sub) => ({
        ...sub,
        icon: sanitiseIcon(sub.icon),
      }));
    } catch (e) {
      console.error("getAll error:", e);
      return [];
    }
  },

  save: async (newSub) => {
    try {
      const existing = await subscriptionStorage.getAll();
      const subWithId = {
        ...newSub,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...existing, subWithId];
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("save error:", e);
      return null;
    }
  },

  update: async (updatedSub) => {
    try {
      const existing = await subscriptionStorage.getAll();
      const updated = existing.map((s) =>
        s.id === updatedSub.id ? { ...s, ...updatedSub } : s
      );
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("update error:", e);
      return null;
    }
  },

  delete: async (id) => {
    try {
      const existing = await subscriptionStorage.getAll();
      const updated = existing.filter((s) => s.id !== id);
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("delete error:", e);
      return null;
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.removeItem(SUBS_KEY);
      return true;
    } catch (e) {
      console.error("clear error:", e);
      return false;
    }
  },
};

// ─── User / profile storage ───────────────────────────────────────────────────
export const userStorage = {

  getProfile: async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("getProfile error:", e);
      return null;
    }
  },

  saveProfile: async (profile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error("saveProfile error:", e);
      return false;
    }
  },
};
