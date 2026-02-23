// src/utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUBS_KEY = "@revolv_subscriptions";

export const subscriptionStorage = {
  // Get all subscriptions
  getAll: async () => {
    try {
      const data = await AsyncStorage.getItem(SUBS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error loading subscriptions", e);
      return [];
    }
  },

  // Add a new subscription
  save: async (newSub) => {
    try {
      const existing = await subscriptionStorage.getAll();
      const subWithId = {
        ...newSub,
        id: Date.now().toString(), // Stable ID for future sync
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
};
