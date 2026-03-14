// Context/appContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AppContext = createContext();

const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", rate: 1.0,      name: "Nigerian Naira" },
  USD: { code: "USD", symbol: "$", rate: 1 / 1500,  name: "US Dollar"      },
  GBP: { code: "GBP", symbol: "£", rate: 1 / 2002,  name: "British Pound"  },
  EUR: { code: "EUR", symbol: "€", rate: 1 / 1583.4, name: "Euro"           },
};

export { CURRENCIES };

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode]       = useState(false);
  const [currencyCode, setCurrencyCode] = useState("NGN");

  // Persist settings
  useEffect(() => {
    AsyncStorage.multiGet(["@revolv_dark", "@revolv_currency"]).then((pairs) => {
      if (pairs[0][1] !== null) setDarkMode(JSON.parse(pairs[0][1]));
      if (pairs[1][1] !== null) setCurrencyCode(pairs[1][1]);
    });
  }, []);

  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem("@revolv_dark", JSON.stringify(next));
  };

  // Keep old setDarkMode API so existing settings.jsx still works
  const setDarkModeCompat = (val) => {
    setDarkMode(val);
    AsyncStorage.setItem("@revolv_dark", JSON.stringify(val));
  };

  const updateCurrency = async (code) => {
    setCurrencyCode(code);
    await AsyncStorage.setItem("@revolv_currency", code);
  };

  const currency = CURRENCIES[currencyCode] ?? CURRENCIES.NGN;

  // ── Dark theme: deep navy/slate with purple accents ──────────────────────────
  // ── Light theme: clean white/slate ───────────────────────────────────────────
  const theme = darkMode
    ? {
        // Backgrounds
        background: "#0d1117",   // Very dark navy - like GitHub dark
        card:       "#161b22",   // Slightly lighter card
        input:      "#21262d",   // Input fields
        inputText:  "#e6edf3",
        // Text
        text:       "#e6edf3",   // Near white
        subText:    "#8b949e",   // Muted grey-blue
        subtext:    "#8b949e",
        // UI
        border:     "#30363d",   // Subtle border
        iconBg:     "#21262d",
        tabBar:     "#161b22",
        // Accent stays purple
        accent:     "#a855f7",
        statusBarStyle: "light-content",
      }
    : {
        background: "#f8fafc",
        card:       "#ffffff",
        input:      "#f1f5f9",
        inputText:  "#0f172a",
        text:       "#0f172a",
        subText:    "#64748b",
        subtext:    "#64748b",
        border:     "#e2e8f0",
        iconBg:     "#f1f5f9",
        tabBar:     "#ffffff",
        accent:     "#8e44ad",
        statusBarStyle: "dark-content",
      };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode: setDarkModeCompat,
        toggleDark,
        currency,
        currencyCode,
        updateCurrency,
        CURRENCIES,
        theme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
