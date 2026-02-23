// Context/subscriptionContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { subscriptionStorage, userStorage } from "../utils/storage";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [profile, setProfile] = useState({ name: "User", avatar: "🧑🏽" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [subs, prof] = await Promise.all([
      subscriptionStorage.getAll(),
      userStorage.getProfile(),
    ]);
    setSubscriptions(subs);
    if (prof) setProfile(prof);
    setLoading(false);
  };

  const addSubscription = async (newSub) => {
    const updatedList = await subscriptionStorage.save(newSub);
    if (updatedList) {
      setSubscriptions(updatedList);
      return true;
    }
    return false;
  };

  const updateSubscription = async (updatedSub) => {
    const updatedList = await subscriptionStorage.update(updatedSub);
    if (updatedList) {
      setSubscriptions(updatedList);
      return true;
    }
    return false;
  };

  const deleteSubscription = async (id) => {
    const updatedList = await subscriptionStorage.delete(id);
    if (updatedList) {
      setSubscriptions(updatedList);
      return true;
    }
    return false;
  };

  const updateProfile = async (newProfile) => {
    await userStorage.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const totalSpend = subscriptions.reduce(
    (sum, sub) => sum + (sub.amount || 0),
    0,
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        totalSpend,
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
