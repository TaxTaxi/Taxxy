import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getRelevantCorrections(description: string) {
  const snapshot = await getDocs(collection(db, "corrections"));
  const all = snapshot.docs.map((doc) => doc.data() as any);

  const lowerDesc = description.toLowerCase();

  const relevant = all.filter((c) => {
    if (c.deleted) return false;

    const original = (c.original?.reason || "").toLowerCase();
    const corrected = (c.corrected?.reason || "").toLowerCase();
    const combined = original + " " + corrected;

    // Require at least 1 word overlap with the transaction description
    const overlap = lowerDesc
      .split(" ")
      .some((word) => word && combined.includes(word));

    return overlap;
  });

  // Sort by newest
  relevant.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return relevant.slice(0, 5);
}
