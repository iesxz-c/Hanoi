import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const router = useRouter();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;
      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userSnap.exists()) setUser(userSnap.data());
    };
    fetchUser();
  }, []);

  // Fetch borrowed and overdue books
  const fetchBorrowedBooks = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "borrows"),
      where("userId", "==", auth.currentUser.uid),
      where("returnedAt", "==", null)
    );
    const snap = await getDocs(q);

    const booksData: any[] = [];
    const overdueData: any[] = [];

    for (const docSnap of snap.docs) {
      const borrow = docSnap.data();
      const bookSnap = await getDoc(doc(db, "books", borrow.bookId));
      if (bookSnap.exists()) {
        const book = { id: bookSnap.id, ...bookSnap.data(), ...borrow };
        booksData.push(book);

        const due = borrow.dueDate?.toDate ? borrow.dueDate.toDate() : null;
        if (due && new Date() > due) overdueData.push(book);
      }
    }

    setBorrowedBooks(booksData);
    setOverdueBooks(overdueData);
  };

  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBorrowedBooks();
    setRefreshing(false);
  }, []);

  // Fetch recommendations based on interests
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.interests || user.interests.length === 0) return;

      let allRecs: any[] = [];

      for (const cat of user.interests) {
        const q = query(
          collection(db, "books"),
          where("categories", "==", cat),
          limit(3)
        );
        const snap = await getDocs(q);
        snap.forEach((doc) => allRecs.push({ id: doc.id, ...doc.data() }));
      }

      allRecs = allRecs.sort(() => 0.5 - Math.random()).slice(0, 20);
      setRecommendations(allRecs);
    };

    fetchRecommendations();
  }, [user]);

  // Helper to safely get thumbnail
  const getThumbnail = (item: any) =>
    typeof item.thumbnail === "string" && item.thumbnail
      ? { uri: item.thumbnail }
      : require("../../assets/images/icon.png");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 15 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Borrowed Books */}
        <Text style={styles.sectionTitle}>📚 Your Borrowed Books</Text>
        {borrowedBooks.length > 0 ? (
          <FlatList
            horizontal
            data={borrowedBooks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookCard}
                onPress={() => router.push(`../book/${item.id}`)}
              >
                <Image source={getThumbnail(item)} style={styles.thumbnail} />
                <Text numberOfLines={1} style={styles.bookTitle}>
                  {item.title}
                </Text>
                {item.dueDate?.toDate && (
                  <Text style={styles.dueText}>
                    Due: {item.dueDate.toDate().toDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.emptyText}>You have no borrowed books.</Text>
        )}

        {/* Overdue Books */}
        <Text style={styles.sectionTitle}>⚠️ Overdue Books</Text>
        {overdueBooks.length > 0 ? (
          overdueBooks.map((book) => (
            <View key={book.id} style={styles.overdueCard}>
              <TouchableOpacity
                style={styles.bookCard}
                onPress={() => router.push(`../book/${book.id}`)}
              >
                <Image source={getThumbnail(book)} style={styles.thumbnailSmall} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.overdueText}>
                  Overdue since {book.dueDate.toDate().toDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No overdue books 🎉</Text>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>✨ Recommended Books</Text>
        {recommendations.length > 0 ? (
          <FlatList
            horizontal
            data={recommendations}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookCard}
                onPress={() => router.push(`../book/${item.id}`)}
              >
                <Image source={getThumbnail(item)} style={styles.thumbnail} />
                <Text numberOfLines={2} style={styles.bookTitle}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.emptyText}>
            No recommendations yet. Add interests in your profile!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  emptyText: { fontSize: 14, color: "gray", marginBottom: 10 },
  bookCard: {
    width: 120,
    marginRight: 10,
    padding: 5,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  thumbnail: { width: 80, height: 120, borderRadius: 5 },
  bookTitle: { fontSize: 14, fontWeight: "600", marginTop: 5, textAlign: "center" },
  dueText: { fontSize: 12, color: "orange", marginTop: 2 },
  overdueCard: {
    flexDirection: "row",
    backgroundColor: "#ffe5e5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  thumbnailSmall: { width: 50, height: 70, borderRadius: 5 },
  overdueText: { fontSize: 13, color: "red", marginTop: 2 },
});
