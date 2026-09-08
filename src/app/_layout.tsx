import { Stack, router, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "../config/firebase";
import "../global.css";

export default function RootLayout() {
  const segments = useSegments();

  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

    if (!firebaseUser && !inAuthGroup) {
      router.replace("/login");
    }

    if (firebaseUser && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [firebaseUser, loading, segments]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
