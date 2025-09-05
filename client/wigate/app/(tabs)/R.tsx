import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from "react-native";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!auth.currentUser) return;

      // Step 1: Get user’s borrowed books
      const borrowSnap = await getDocs(
        query(collection(db, "borrows"), where("userId", "==", auth.currentUser.uid))
      );

      let categories: string[] = [];
      for (const docSnap of borrowSnap.docs) {
        const borrow = docSnap.data();
        const bookSnap = await getDocs(
          query(collection(db, "books"), where("__name__", "==", borrow.bookId))
        );
        bookSnap.forEach(b => {
          const book = b.data();
          if (book.categories) {
            categories = [...categories, ...book.categories];
          }
        });
      }

      // Step 2: Pick top category (user’s most borrowed genre)
      const topCategory = categories.sort(
        (a, b) => categories.filter(c => c === b).length - categories.filter(c => c === a).length
      )[0];

      if (topCategory) {
        // Step 3: Recommend books in that category (limit 5)
        const recSnap = await getDocs(
          query(collection(db, "books"), where("categories", "array-contains", topCategory), limit(5))
        );
        const recs = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecommendations(recs);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📚 Recommended For You</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recommendations.map((book) => (
          <TouchableOpacity key={book.id} style={styles.card}>
            <Image
              source={
                typeof book.thumbnail === "string"
                  ? { uri: book.thumbnail }
                  : require("../../assets/images/icon.png")
              }
              style={styles.thumbnail}
            />
            <Text numberOfLines={2} style={styles.title}>{book.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 15 },
  heading: { fontSize: 18, fontWeight: "bold", marginLeft: 10, marginBottom: 10 },
  card: { width: 120, marginHorizontal: 8 },
  thumbnail: { width: 120, height: 160, borderRadius: 8 },
  title: { fontSize: 14, marginTop: 5, textAlign: "center" },
});
