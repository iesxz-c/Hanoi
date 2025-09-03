// app/(tabs)/seats.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

export default function SeatsScreen() {
  const [seats, setSeats] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "seats"), (snapshot) => {
      setSeats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const bookSeat = async (seatId: string) => {
    const seatRef = doc(db, "seats", seatId);
    await updateDoc(seatRef, {
      status: "booked",
      userId: auth.currentUser?.uid,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Selection</Text>
      <FlatList
        data={seats}
        numColumns={2} // show seats in grid
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMySeat = item.userId === auth.currentUser?.uid;
          return (
            <View
              style={[
                styles.seat,
                item.status === "booked"
                  ? isMySeat
                    ? styles.mySeat
                    : styles.bookedSeat
                  : styles.availableSeat,
              ]}
            >
              <Text style={styles.seatText}>Seat {item.number}</Text>
              <Text>Status: {item.status}</Text>
              {item.status === "available" ? (
                <Button title="Book" onPress={() => bookSeat(item.id)} />
              ) : isMySeat ? (
                <Text style={{ color: "green" }}>✅ Your Seat</Text>
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
