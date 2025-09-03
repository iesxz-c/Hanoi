// app/(tabs)/seats.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

export default function SeatsScreen() {
  const [seats, setSeats] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "seats"), (snapshot) => {
      setSeats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Safe booking with Firestore transaction
  const bookSeat = async (seatId: string) => {
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

        // 🔒 Ensure user does not already have a seat
        const q = query(
          collection(db, "seats"),
          where("userId", "==", auth.currentUser?.uid)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
          throw new Error("You already booked a seat!");
        }

        transaction.update(seatRef, {
          status: "occupied",
          userId: auth.currentUser?.uid,
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
