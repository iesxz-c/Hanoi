// app/(tabs)/profile.tsx
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,     // use setDoc(..., {merge:true}) so it works even if user doc doesn't exist yet
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import * as Network from "expo-network";

export default function Profile() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email] = useState(auth.currentUser?.email || "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Wi-Fi badge (kept from your version)
  const [wifiStatus, setWifiStatus] = useState<"connected" | "disconnected">("disconnected");

  // Interests
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // ---- data loaders ----
  const fetchProfile = async () => {
    if (!auth.currentUser) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      setName(data.name || "");
      setRole(data.role || "");
      setSelectedInterests(Array.isArray(data.interests) ? data.interests : []);
    }
  };

  const fetchCategories = async () => {
    // Read from your existing `categories` collection
    const snap = await getDocs(collection(db, "categories"));
    const list: string[] = [];
    snap.forEach((d) => {
      const nm = (d.data() as any)?.name ?? d.id; // support either field
      if (typeof nm === "string" && nm.trim()) list.push(nm.trim());
    });
    // unique + sorted
    const unique = Array.from(new Set(list.map((s) => s.trim()))).sort((a, b) =>
      a.localeCompare(b)
    );
    setAllCategories(unique);
  };

  const load = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchCategories()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();

    // Wi-Fi polling
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  // ---- actions ----
  const updateProfile = async () => {
    if (!auth.currentUser) return;
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      { name, interests: selectedInterests },
      { merge: true }
    );
    alert("Profile updated!");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const toggleInterest = (cat: string) => {
    if (selectedInterests.includes(cat)) {
      setSelectedInterests(selectedInterests.filter((c) => c !== cat));
    } else if (selectedInterests.length < 7) {
      setSelectedInterests([...selectedInterests, cat]);
    } else {
      alert("You can only select up to 7 interests.");
    }
  };

  // ---- derived UI lists ----
  const filtered = searchTerm.trim()
    ? allCategories.filter((c) =>
        c.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : allCategories.slice(0, 8); // show ONLY 8 by default

  if (loading && !refreshing) return <ActivityIndicator size="large" />;

  return (
    <ScrollView
      style={{ flex: 1, padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 16 }}>profile</Text>

      <Text style={{ marginBottom: 4 }}>Email: {email}</Text>
      <Text style={{ marginBottom: 12 }}>Role: {role}</Text>

        <Text style={{ marginBottom: 12 }}>
          Wi-Fi Status: {wifiStatus === "connected" ? "✅ Connected" : "❌ Not Connected"}
        </Text>
     
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12 }}
      />

      <Button title="Update Profile" onPress={updateProfile} />
      <View style={{ height: 10 }} />
      <Button title="Logout" onPress={handleLogout} />

      {/* Interests */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          Select Your Interests (Max 7)
        </Text>

        <TextInput
          placeholder="Search categories…"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12 }}
        />

        {/* Selected summary */}
        {selectedInterests.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
            {selectedInterests.map((c) => (
              <TouchableOpacity
                key={`sel-${c}`}
                onPress={() => toggleInterest(c)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  backgroundColor: "#00a0eb",
                  marginRight: 6,
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "white" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
<View>
  <Text>=========================================</Text>
</View>
        {/* Chips: only 8 by default; more appear via search */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {filtered.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => toggleInterest(category)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
                backgroundColor: selectedInterests.includes(category) ? "#00a0eb" : "#eee",
              }}
            >
              <Text style={{ color: selectedInterests.includes(category) ? "white" : "#333" }}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(!filtered || filtered.length === 0) && (
          <Text style={{ color: "#666", marginTop: 6 }}>
            No categories match “{searchTerm}”.
          </Text>
        )}
      </View>

      
    </ScrollView>
  );
}
