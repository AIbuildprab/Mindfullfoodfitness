export type Exercise = { name: string; sets: number; reps: string };

export type Details = {
  client_id: string;
  client_type: "online" | "in_person";
  phase: string;
  status: "active" | "paused" | "pending";
  start_date: string;
  kcal_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  weight_goal_kg: number | null;
  notes: string | null;
};

export type Workout = {
  id: string;
  client_id: string;
  scheduled_on: string;
  name: string;
  notes: string | null;
  duration_min: number | null;
  exercises: Exercise[];
  completed_at: string | null;
};

export type LogEntry = { name: string; sets: { weight: string; reps: string }[] };
export type WorkoutLog = { id: string; client_id: string; workout_id: string | null; logged_on: string; entries: LogEntry[] };

export type Meal = {
  id: string;
  client_id: string;
  day: string;
  slot: string;
  description: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Food = { id: string; client_id: string; name: string; note: string | null; kind: "recommended" | "limit" };
export type Checkin = { id: string; client_id: string; day: string; created_at: string; weight_kg: number | null; steps: number | null; sleep_hours: number | null; notes: string | null };
export type Habit = { id: string; client_id: string; label: string; sort: number; active: boolean };
export type Measurement = { id: string; client_id: string; day: string; waist_cm: number | null; chest_cm: number | null; hips_cm: number | null; arm_cm: number | null; thigh_cm: number | null };
export type Photo = { id: string; client_id: string; day: string; view: "front" | "side" | "back"; path: string };
export type Message = { id: string; client_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };
export type Session = { id: string; starts_at: string; ends_at: string; title: string; client_id: string | null; status: "open" | "requested" | "confirmed" | "cancelled" };
export type Invite = { id: string; email: string; first_name: string | null; status: "pending" | "accepted"; created_at: string };
export type WorkoutTemplate = { id: string; name: string; description: string | null; duration_min: number | null; exercises: Exercise[] };
export type NutritionTemplate = { id: string; name: string; description: string | null; kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };

export type ClientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  goal: string | null;
  client_details: Details | null;
};

export const fullName = (p: { first_name: string | null; last_name: string | null }) =>
  [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed client";
