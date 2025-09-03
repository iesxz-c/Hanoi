// utils/releaseUserSeat.ts
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, updateDoc } from "firebase/firestore";

export const releaseUserSeat = async (uid: string) => {
  try {
    const q = query(collection(db, "seats"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    for (const seatDoc of snapshot.docs) {
      await updateDoc(seatDoc.ref, {
        status: "free",
        userId: null,
      });
    }

    console.log(`Released seat(s) for user: ${uid}`);
  } catch (err) {
    console.error("Error releasing seat:", err);
  }
};
