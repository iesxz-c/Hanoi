import { Tabs, useRouter } from "expo-router";
import { Alert, Pressable } from "react-native";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have @expo/vector-icons installed

export default function TabLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login"); // navigate to login after logout
    } catch (error: any) {
      Alert.alert("Sign Out Error", error.message);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6", // A nice blue for the active tab
        tabBarInactiveTintColor: "#6B7280", // A muted gray for inactive tabs
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index" // This corresponds to your (tabs)/index.tsx file
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerShown: true, // Hiding header since your page has its own "Home" title
        }}
      />

      {/* Seats Tab */}
      <Tabs.Screen
        name="seats" // This corresponds to your (tabs)/seats.tsx file
        options={{
          title: "Seats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab with Sign Out button */}
      <Tabs.Screen
        name="profile" // This corresponds to your (tabs)/profile.tsx file
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable onPress={handleSignOut} style={{ marginRight: 15 }}>
              <Ionicons name="log-out-outline" size={26} color="#3B82F6" />
            </Pressable>
          ),
        }}
      />
      
      {/* Borrow Page Tab */}
      <Tabs.Screen
        name="BooksScreen" // Make sure this matches your file name, e.g., (tabs)/borrowpage.tsx
        options={{
          title: "Borrow",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="browsers" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
