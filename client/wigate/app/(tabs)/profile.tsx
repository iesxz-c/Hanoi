import { useEffect, useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { router } from "expo-router";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setName(snap.data().name);
      }
      setLoading(false);
    };
    fetchProfile();
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

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text>Email: {email}</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
      />
      <Button title="Update Profile" onPress={updateProfile} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
