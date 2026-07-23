// Context/subscriptionContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { subscriptionStorage, userStorage } from "../utils/storage";
import { toBaseAmount } from "./appContext";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [profile, setProfile]             = useState({ name: "User", avatar: "🧑🏽" });
  const [loading, setLoading]             = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [subs, prof] = await Promise.all([
        subscriptionStorage.getAll(),
        userStorage.getProfile(),
      ]);
      setSubscriptions(subs || []);
      if (prof) setProfile(prof);
    } catch (e) {
      console.error("loadAll error:", e);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async (newSub) => {
    const updated = await subscriptionStorage.save(newSub);
    if (updated) { setSubscriptions(updated); return true; }
    return false;
  };

  const updateSubscription = async (updatedSub) => {
    const updated = await subscriptionStorage.update(updatedSub);
    if (updated) { setSubscriptions(updated); return true; }
    return false;
  };

  const deleteSubscription = async (id) => {
    const updated = await subscriptionStorage.delete(id);
    if (updated) { setSubscriptions(updated); return true; }
    return false;
  };

  // Toggle cancelled state. cancelled=true means user stopped paying.
  const cancelSubscription = async (id, cancel = true) => {
    const updated = await subscriptionStorage.update({ id, cancelled: cancel });
    if (updated) { setSubscriptions(updated); return true; }
    return false;
  };

  const updateProfile = async (newProfile) => {
    setProfile(newProfile);
    await userStorage.saveProfile(newProfile);
  };

  // Monthly equivalent of active subs only.
  // BUG FIX: normalise each sub's amount into the base currency using its own
  // amountCurrency first — previously this summed raw amounts regardless of
  // what currency they were billed in, so a $10 sub was counted as ₦10.
  const totalSpend = subscriptions
    .filter((s) => !s.cancelled)
    .reduce((sum, sub) => {
      const amt = toBaseAmount(sub.amount || 0, sub.amountCurrency || "NGN");
      if (sub.cycle === "Weekly")  return sum + (amt * 52) / 12;
      if (sub.cycle === "Yearly")  return sum + amt / 12;
      return sum + amt;
    }, 0);

  // Monthly equivalent of cancelled subs = money saved (same fix applied)
  const savedTotal = subscriptions
    .filter((s) => s.cancelled)
    .reduce((sum, sub) => {
      const amt = toBaseAmount(sub.amount || 0, sub.amountCurrency || "NGN");
      if (sub.cycle === "Weekly")  return sum + (amt * 52) / 12;
      if (sub.cycle === "Yearly")  return sum + amt / 12;
      return sum + amt;
    }, 0);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        cancelSubscription,
        totalSpend,
        savedTotal,
        loading,
        profile,
        updateProfile,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => useContext(SubscriptionContext);