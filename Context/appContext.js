// Context/appContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";

const AppContext = createContext();

const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", rate: 1.0,       name: "Nigerian Naira" },
  USD: { code: "USD", symbol: "$", rate: 1 / 1500,   name: "US Dollar"      },
  GBP: { code: "GBP", symbol: "£", rate: 1 / 2002,   name: "British Pound"  },
  EUR: { code: "EUR", symbol: "€", rate: 1 / 1583.4,  name: "Euro"           },
};

export { CURRENCIES };

// ─── Currency conversion helper ───────────────────────────────────────────────
// BUG FIX: subscriptions can be billed in any currency (sub.amountCurrency),
// but that was never actually converted anywhere — totals and prices just
// multiplied the raw amount by the app's *display* currency rate, ignoring
// what currency the subscription was actually entered in.
//
// CURRENCIES[code].rate is "how much 1 NGN is worth in that currency", so NGN
// is the internal base unit. To bring any subscription's amount into that
// base unit: baseAmount = amount / CURRENCIES[fromCode].rate.
// formatPrice() (in home.jsx) already converts base -> display currency, so
// running an amount through toBaseAmount() first makes that math correct
// regardless of what currency the subscription was billed in.
export function toBaseAmount(amount, fromCode) {
  const from = CURRENCIES[fromCode] ?? CURRENCIES.NGN;
  const rate = from.rate || 1;
  return (amount || 0) / rate;
}

// ─── Font weight → Nunito family name map ─────────────────────────────────────
// Use this anywhere you set fontWeight so Nunito renders correctly.
// React Native maps fontWeight to the loaded family name.
export const F = {
  regular:   "Nunito_400Regular",
  medium:    "Nunito_500Medium",
  semibold:  "Nunito_600SemiBold",
  bold:      "Nunito_700Bold",
  extrabold: "Nunito_800ExtraBold",
  black:     "Nunito_900Black",
};

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode]         = useState(false);
  const [currencyCode, setCurrencyCode] = useState("NGN");
  const [fontsLoaded, fontError]        = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(["@revolv_dark", "@revolv_currency"])
      .then((pairs) => {
        if (!active) return;
        const settings = Object.fromEntries(pairs);
        // Accept only values written by this app; damaged settings use defaults.
        setDarkMode(settings["@revolv_dark"] === "true");
        const storedCurrency = settings["@revolv_currency"];
        if (Object.prototype.hasOwnProperty.call(CURRENCIES, storedCurrency)) {
          setCurrencyCode(storedCurrency);
        }
      })
      .catch((error) => {
        console.warn("Could not load saved settings; using defaults.", error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (fontError) console.warn("Could not load Nunito; using system fonts.", fontError);
  }, [fontError]);

  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem("@revolv_dark", JSON.stringify(next));
  };

  const setDarkModeCompat = (val) => {
    setDarkMode(val);
    AsyncStorage.setItem("@revolv_dark", JSON.stringify(val));
  };

  const updateCurrency = async (code) => {
    setCurrencyCode(code);
    await AsyncStorage.setItem("@revolv_currency", code);
  };

  const currency = CURRENCIES[currencyCode] ?? CURRENCIES.NGN;

  // ── Dark theme: true AMOLED black with purple accent ─────────────────────────
  const theme = darkMode
    ? {
        background: "#050507",   // near-pure black
        card:       "#0e0e14",   // slightly lifted card
        input:      "#16161f",   // input fields
        inputText:  "#e8e8f0",
        text:       "#e8e8f0",
        subText:    "#7070a0",   // muted purple-grey
        subtext:    "#7070a0",
        border:     "#1e1e2e",   // very subtle border
        iconBg:     "#16161f",
        tabBar:     "#0a0a10",
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
        accent:     "#7c5cff",
        statusBarStyle: "dark-content",
      };

  // A font failure must not keep the entire app on a blank screen.
  if (!fontsLoaded && !fontError) return null;

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
        fontsLoaded,
        F,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
