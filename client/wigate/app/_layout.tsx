import { Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) return null; // or splash screen

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
