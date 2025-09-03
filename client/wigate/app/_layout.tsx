import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // ✅ Authenticated users
        <Stack.Screen name="(tabs)" />
      ) : (
        // ✅ Guests
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
