import { useEffect, useState } from "react";
import {ActivityIndicator, View, Text, TextInput, Button } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import * as Network from "expo-network";

export default function Profile() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(true);
  const [wifiStatus, setWifiStatus] = useState<"connected" | "disconnected">("disconnected");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setName(snap.data().name);
       setRole(snap.data().role);  
      }
      setLoading(false);
    };
    fetchProfile();

    // ✅ Check Wi-Fi status every 3s
    const interval = setInterval(async () => {
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected && state.type === Network.NetworkStateType.WIFI) {
        setWifiStatus("connected");
      } else {
        setWifiStatus("disconnected");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateProfile = async () => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { name });
    alert("Profile updated!");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text>Email: {email}</Text>
      <Text>Role: {role}</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
      />
      <Button title="Update Profile" onPress={updateProfile} />
      <Button title="Logout" onPress={handleLogout} />
    
      <View style={{ marginTop: 20 }}>
        <Text>
          Wi-Fi Status:{" "}
          {wifiStatus === "connected" ? "✅ Connected" : "❌ Not Connected"}
        </Text>
      </View>
    </View>
  );
}
