import { db, must, useQuery } from "@/lib/data/hooks";
import type { ClientRow, Exercise } from "@/lib/data/types";

export function useClients() {
  return useQuery(async () => {
    const r = await db()
      .from("profiles")
      .select("id, first_name, last_name, phone, goal, client_details(*)")
      .eq("role", "client")
      .order("created_at");
    return must(r) as unknown as ClientRow[];
  }, []);
}

/** "Back squat 4x6" or "Back squat | 4 | 6-8", one exercise per line. */
export function parseExercises(text: string): Exercise[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (l.includes("|")) {
        const [name, sets, reps] = l.split("|").map((s) => s.trim());
        return { name, sets: Number(sets) || 3, reps: reps || "10" };
      }
      const m = l.match(/^(.*?)\s+(\d+)\s*[x×]\s*(.+)$/i);
      return m ? { name: m[1].trim(), sets: Number(m[2]), reps: m[3].trim() } : { name: l, sets: 3, reps: "10" };
    });
}

export const exercisesToText = (ex: Exercise[]) => ex.map((e) => `${e.name} ${e.sets}x${e.reps}`).join("\n");
