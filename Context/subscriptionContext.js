// context/SubscriptionContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { subscriptionStorage } from '../utils/storage';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on startup
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const data = await subscriptionStorage.getAll();
    setSubscriptions(data);
    setLoading(false);
  };

  const addSubscription = async (newSub) => {
    const updatedList = await subscriptionStorage.save(newSub);
    if (updatedList) {
      setSubscriptions(updatedList); // Update state immediately
      return true;
    }
    return false;
  };

  // Calculate total monthly spend dynamically
  const totalSpend = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

  return (
    <SubscriptionContext.Provider 
      value={{ subscriptions, addSubscription, totalSpend, loading }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => useContext(SubscriptionContext);