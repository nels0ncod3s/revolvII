// app/index.jsx — sole entry point, routes based on onboarding state
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { userStorage } from "../utils/storage";

export default function Index() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    userStorage.getProfile().then((profile) => {
      if (profile?.name) {
        setTarget("/(tabs)/home");
      } else {
        setTarget("/splash");
      }
    });
  }, []);

  if (!target) return null;
  return <Redirect href={target} />;
}
