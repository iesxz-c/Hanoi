// app/book/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, Button, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export default function BookDetails() {
  const { id } = useLocalSearchParams(); // bookId from navigation
  const [book, setBook] = useState<any>(null);
  const [isBorrowed, setIsBorrowed] = useState<false | "mine" | "other">(false);
  // Load book data
  useEffect(() => {
    const fetchBook = async () => {
      const snap = await getDoc(doc(db, "books", id as string));
      if (snap.exists()) setBook({ id: snap.id, ...snap.data() });
    };

    const checkBorrowStatus = async () => {
      const q = query(
        collection(db, "borrows"),
        where("bookId", "==", id),
        where("returnedAt", "==", null)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const borrow = snap.docs[0].data();
        setIsBorrowed(borrow.userId === auth.currentUser?.uid ? "mine" : "other");
      } else {
        setIsBorrowed(false);
      }
    };

    fetchBook();
    checkBorrowStatus();
  }, [id]);

  const borrowBook = async () => {
    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please log in to borrow books.");
      return;
    }
    await addDoc(collection(db, "borrows"), {
      userId: auth.currentUser.uid,
      bookId: id,
      borrowedAt: new Date(),
      returnedAt: null,
    });
    setIsBorrowed("mine");
    Alert.alert("Success", "You borrowed this book!");
  };

  const returnBook = async () => {
    const q = query(
      collection(db, "borrows"),
      where("bookId", "==", id),
      where("userId", "==", auth.currentUser?.uid),
      where("returnedAt", "==", null)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { returnedAt: new Date() });
      setIsBorrowed(false);
      Alert.alert("Returned", "You returned this book.");
    }
  };

  if (!book) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={typeof book.thumbnail === "string"
      ? { uri: book.thumbnail }
      : book.thumbnail || require("../../assets/images/icon.png")} style={styles.thumbnail} />
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.meta}>
  Author:{" "}
  {Array.isArray(book.authors)
    ? book.authors.join(", ")
    : book.authors || "Unknown"}
</Text>

      <Text style={styles.meta}>⭐ {book.average_rating || "N/A"}</Text>
      <Text style={styles.meta}>
        Categories: {Array.isArray(book.categories) ? book.categories.join(", ") : "N/A"}
      </Text>

      {isBorrowed === "mine" ? (
        <Button title="Return Book" onPress={returnBook} color="red" />
      ) : isBorrowed === "other" ? (
        <Text style={{ color: "red", marginTop: 10 }}>❌ This book is borrowed by someone else</Text>
      ) : (
        <Button title="Borrow Book" onPress={borrowBook} color="green" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  thumbnail: { width: "100%", height: 200, resizeMode: "contain", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  author: { fontSize: 16, marginBottom: 10 },
  meta: { fontSize: 14, marginBottom: 5 },
});
