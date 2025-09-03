import { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // make sure db = getFirestore(app)
import { router } from "expo-router";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // new field
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Save profile to Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        role: "user",
        createdAt: new Date(),
      });

      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text>Signup</Text>
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Signup" onPress={handleSignup} />
      <Button title="Go to Login" onPress={() => router.push("/(auth)/login")} />
    </View>
  );
}
