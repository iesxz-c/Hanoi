import { Tabs } from "expo-router";
import { Button, Alert } from "react-native";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function TabLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login"); // navigate to login after logout
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <Button title="Logout" onPress={handleSignOut} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
    </Tabs>
  );
}
