import { db } from "@/firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export const fetchRecentLogs = async () => {
  const q = query(
    collection(db, "activity_logs"),
    orderBy("timestamp", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
