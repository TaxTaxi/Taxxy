// src/utils/getRelevantCorrections.ts
import { supabase } from "@/lib/supabase";

export async function getRelevantCorrections(description: string) {
  const { data: all, error } = await supabase
    .from("corrections")
    .select("*")
    .order("date", { ascending: false });

  if (error || !all) {
    console.error("❌ Failed to fetch corrections:", error);
    return [];
  }

  const lowerDesc = description.toLowerCase();

  const relevant = all.filter((c) => {
    const original = (c.original_reason || "").toLowerCase();
    const corrected = (c.corrected_reason || "").toLowerCase();
    const combined = original + " " + corrected;

    return lowerDesc
      .split(" ")
      .some((word) => word && combined.includes(word));
  });

  return relevant.slice(0, 5);
}
