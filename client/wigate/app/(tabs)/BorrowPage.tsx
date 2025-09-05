// app/(tabs)/books.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Button, StyleSheet } from "react-native";
import { collection, query, limit, startAfter, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "expo-router";

export default function BooksScreen() {
  const [books, setBooks] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Fetch first 25 books (default browsing)
  const fetchBooks = async (reset = false) => {
    let q = query(collection(db, "books"), orderBy("title"), limit(25));
    if (!reset && lastDoc) {
      q = query(
        collection(db, "books"),
        orderBy("title"),
        startAfter(lastDoc),
        limit(25)
      );
    }
    const snap = await getDocs(q);
    const newBooks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setBooks(reset ? newBooks : [...books, ...newBooks]);
  };

  // Universal search: title + authors + categories
  const searchBooks = async () => {
    if (!search.trim()) {
      fetchBooks(true); // fallback to browsing
      return;
    }

    const booksSet = new Map<string, any>();

    // Search in title
    const q1 = query(
      collection(db, "books"),
      where("title", ">=", search),
      where("title", "<=", search + "\uf8ff")
    );
    const snap1 = await getDocs(q1);
    snap1.docs.forEach((d) => booksSet.set(d.id, { id: d.id, ...d.data() }));

    // Search in authors
    const q2 = query(
      collection(db, "books"),
      where("authors", ">=", search),
      where("authors", "<=", search + "\uf8ff")
    );
    const snap2 = await getDocs(q2);
    snap2.docs.forEach((d) => booksSet.set(d.id, { id: d.id, ...d.data() }));

    // Search in categories
    const q3 = query(
      collection(db, "books"),
      where("categories", ">=", search),
      where("categories", "<=", search + "\uf8ff")
    );
    const snap3 = await getDocs(q3);
    snap3.docs.forEach((d) => booksSet.set(d.id, { id: d.id, ...d.data() }));

    // Merge results
    setBooks(Array.from(booksSet.values()));
    setLastDoc(null); // disable pagination while searching
  };

  useEffect(() => {
    fetchBooks(true);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search books..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <Button title="Search" onPress={searchBooks} />

      <FlatList
        data={books}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => router.push(`../book/${item.id}`)}
          >
            <Image
              source={
                typeof item.thumbnail === "string"
      ? { uri: item.thumbnail }
      : item.thumbnail || require("../../assets/images/icon.png")// fallback image
              }
              style={styles.thumbnail}
            />
            <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
            <Text>⭐ {item.average_rating}</Text>
          </TouchableOpacity>
        )}
      />

      {!search && (
        <Button title="Next Page" onPress={() => fetchBooks(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  search: { padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
  bookCard: {
    flex: 1,
    margin: 5,
    padding: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
  },
  thumbnail: { width: 80, height: 120, resizeMode: "cover", borderRadius: 5 },
  title: { fontSize: 12, fontWeight: "600", marginTop: 5 },
});
