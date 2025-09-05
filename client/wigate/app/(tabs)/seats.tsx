// app/(tabs)/seats.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import * as Network from "expo-network";

export default function SeatsScreen() {
  const BACKEND_URL = "http://192.168.1.7:5000";
  const [seats, setSeats] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "seats"), (snapshot) => {
      setSeats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const checkWifi = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.type !== Network.NetworkStateType.WIFI) return false;

      const res = await fetch(`${BACKEND_URL}/ping`);
      const data = await res.json();
      return data.status === "ok";
    } catch (e) {
      console.log("Wi-Fi check failed:", e);
      return false;
    }
  };

  const bookSeat = async (seatId: string) => {
    const onWifi = await checkWifi();
    if (!onWifi) {
      Alert.alert("Error", "You must be connected to Wi-Fi to book a seat.");
      return;
    }

    const seatRef = doc(db, "seats", seatId);

    try {
      await runTransaction(db, async (transaction) => {
        const seatDoc = await transaction.get(seatRef);
        if (!seatDoc.exists()) throw new Error("Seat does not exist!");
        const seatData = seatDoc.data();
        if (seatData.status !== "free") throw new Error("Seat already taken!");

        transaction.update(seatRef, {
          status: "occupied",
          userId: auth.currentUser?.uid ?? "unknown",
        });
      });

      Alert.alert("Success", "Seat booked successfully!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const releaseSeat = async (seatId: string) => {
    const seatRef = doc(db, "seats", seatId);
    await updateDoc(seatRef, { status: "free", userId: null });
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const onWifi = await checkWifi();
      if (!onWifi && auth.currentUser) {
        const mySeat = seats.find((s) => s.userId === auth.currentUser?.uid);
        if (mySeat) {
          await releaseSeat(mySeat.id);
          Alert.alert(
            "Seat Released",
            "You are no longer connected to Wi-Fi."
          );
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [seats]);

  const renderSeat = ({ item }: { item: any }) => {
    const isMySeat = item.userId === auth.currentUser?.uid;
    let bgColor = "#d4fcd4"; // available
    if (item.status === "occupied") bgColor = isMySeat ? "#d4e3fc" : "#f8d4d4";

    return (
      <View style={[styles.seat, { backgroundColor: bgColor }]}>
        <Text style={styles.seatNumber}>Seat {item.number}</Text>
        <Text style={styles.statusText}>
          {item.status === "free" ? "Available" : isMySeat ? "Your Seat" : "Taken"}
        </Text>

        {item.status === "free" ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
            onPress={() => bookSeat(item.id)}
          >
            <Text style={styles.buttonText}>Book</Text>
          </TouchableOpacity>
        ) : isMySeat ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#FFA500" }]}
            onPress={() => releaseSeat(item.id)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Seat Selection</Text>
      <FlatList
        data={seats}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderSeat}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  seat: {
    flex: 1,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  seatNumber: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  statusText: { fontSize: 14, marginBottom: 12, color: "#333" },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
