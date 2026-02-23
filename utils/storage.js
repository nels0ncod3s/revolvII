// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUBS_KEY = "@revolv_subscriptions";
const PROFILE_KEY = "@revolv_profile";

export const subscriptionStorage = {
  getAll: async () => {
    try {
      const data = await AsyncStorage.getItem(SUBS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error loading subscriptions", e);
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
      console.error("Error saving subscription", e);
      return null;
    }
  },

  update: async (updatedSub) => {
    try {
      const existing = await subscriptionStorage.getAll();
      const updated = existing.map((s) => s.id === updatedSub.id ? updatedSub : s);
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error updating subscription", e);
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
      console.error("Error deleting subscription", e);
      return null;
    }
  },
};

export const userStorage = {
  saveProfile: async (profile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error("Error saving profile", e);
      return false;
    }
  },

  getProfile: async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error loading profile", e);
      return null;
    }
  },
};
