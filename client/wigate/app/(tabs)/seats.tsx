// app/(tabs)/seats.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
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
  const [seats, setSeats] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "seats"), (snapshot) => {
      setSeats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Check if connected to Wi-Fi (Expo restriction: can't get SSID)
  const checkWifi = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.type === Network.NetworkStateType.WIFI;
    } catch (e) {
      console.log("Wi-Fi check failed:", e);
      return false;
    }
  };

  // ✅ Safe booking with Firestore transaction
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

        if (!seatDoc.exists()) {
          throw new Error("Seat does not exist!");
        }

        const seatData = seatDoc.data();

        if (seatData.status !== "free") {
          throw new Error("Seat already taken!");
        }

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

  // ✅ Release/cancel your own seat
  const releaseSeat = async (seatId: string) => {
    const seatRef = doc(db, "seats", seatId);
    await updateDoc(seatRef, {
      status: "free",
      userId: null,
    });
  };

  // ✅ Auto-release seat if Wi-Fi disconnected
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
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);
  }, [seats]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Selection</Text>
      <FlatList
        data={seats}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMySeat = item.userId === auth.currentUser?.uid;
          return (
            <View
              style={[
                styles.seat,
                item.status === "occupied"
                  ? isMySeat
                    ? styles.mySeat
                    : styles.bookedSeat
                  : styles.availableSeat,
              ]}
            >
              <Text style={styles.seatText}>Seat {item.number}</Text>
              <Text>Status: {item.status}</Text>

              {item.status === "free" ? (
                <Button title="Book" onPress={() => bookSeat(item.id)} />
              ) : isMySeat ? (
                <>
                  <Text style={{ color: "green" }}>✅ Your Seat</Text>
                  <Button
                    title="Cancel"
                    color="orange"
                    onPress={() => releaseSeat(item.id)}
                  />
                </>
              ) : (
                <Text style={{ color: "red" }}>❌ Taken</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 10, fontWeight: "bold" },
  seat: {
    flex: 1,
    margin: 8,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  seatText: { fontSize: 16, fontWeight: "600" },
  availableSeat: { backgroundColor: "#d4fcd4" },
  bookedSeat: { backgroundColor: "#f8d4d4" },
  mySeat: { backgroundColor: "#d4e3fc" },
});
