"use client";

import { useState } from "react";
import { today } from "@/lib/data/dates";
import { db } from "@/lib/data/hooks";
import type { LogEntry, Workout } from "@/lib/data/types";
import { ErrorNote, Field, num, primaryBtn, Select } from "../light";
import { Sheet } from "../ClientShell";

type Done = () => void;

function useSubmit(onDone: Done) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setErr(null);
    const r = await fn();
    setBusy(false);
    if (r.error) setErr("That did not save. Check your connection and try again.");
    else onDone();
  }
  return { busy, err, run };
}

export function CheckInSheet({ meId, onClose, onSaved }: { meId: string; onClose: () => void; onSaved: Done }) {
  const [weight, setWeight] = useState("");
  const [steps, setSteps] = useState("");
  const [sleep, setSleep] = useState("");
  const [notes, setNotes] = useState("");
  const { busy, err, run } = useSubmit(() => {
    onSaved();
    onClose();
  });
  const empty = !weight && !steps && !sleep && !notes.trim();

  return (
    <Sheet title="Daily check-in" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            db().from("checkins").upsert(
              { client_id: meId, day: today(), weight_kg: num(weight), steps: num(steps), sleep_hours: num(sleep), notes: notes.trim() || null },
              { onConflict: "client_id,day" },
            ),
          );
        }}
        className="space-y-4"
      >
        <Field label="Weight (kg)" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <Field label="Steps" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} />
        <Field label="Sleep (hours)" inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} />
        <Field label="Note for Paul (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || empty}>{busy ? "Saving" : "Save check-in"}</button>
      </form>
    </Sheet>
  );
}

export function MealSheet({ meId, day, onClose, onSaved }: { meId: string; day: string; onClose: () => void; onSaved: Done }) {
  const [slot, setSlot] = useState("Breakfast");
  const [description, setDescription] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const { busy, err, run } = useSubmit(() => {
    onSaved();
    onClose();
  });

  return (
    <Sheet title="Log a meal" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            db().from("meals").insert({
              client_id: meId,
              day,
              slot,
              description: description.trim() || null,
              kcal: num(kcal) ?? 0,
              protein_g: num(p) ?? 0,
              carbs_g: num(c) ?? 0,
              fat_g: num(f) ?? 0,
            }),
          );
        }}
        className="space-y-4"
      >
        <Select label="Meal" value={slot} onChange={(e) => setSlot(e.target.value)}>
          {["Breakfast", "Lunch", "Dinner", "Snack"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Field label="What did you have?" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Chicken, rice, greens" />
        <Field label="Calories" inputMode="numeric" required value={kcal} onChange={(e) => setKcal(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein g" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
          <Field label="Carbs g" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} />
          <Field label="Fat g" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} />
        </div>
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || num(kcal) === null}>{busy ? "Saving" : "Save meal"}</button>
      </form>
    </Sheet>
  );
}

export function WorkoutSheet({ meId, workout, onClose, onSaved }: { meId: string; workout: Workout; onClose: () => void; onSaved: Done }) {
  const [entries, setEntries] = useState<LogEntry[]>(
    workout.exercises.map((e) => ({ name: e.name, sets: Array.from({ length: Math.max(1, e.sets) }, () => ({ weight: "", reps: "" })) })),
  );
  const done = !!workout.completed_at;
  const { busy, err, run } = useSubmit(() => {
    onSaved();
    onClose();
  });

  const set = (i: number, j: number, k: "weight" | "reps", v: string) =>
    setEntries((es) => es.map((e, a) => (a !== i ? e : { ...e, sets: e.sets.map((s, b) => (b === j ? { ...s, [k]: v } : s)) })));

  return (
    <Sheet title={workout.name} onClose={onClose}>
      {workout.notes ? <p className="mb-4 rounded-2xl bg-[#F6F4EF] p-4 text-[15px] leading-relaxed">{workout.notes}</p> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const log = await db().from("workout_logs").insert({ client_id: meId, workout_id: workout.id, logged_on: today(), entries });
            if (log.error) return log;
            return db().from("workouts").update({ completed_at: new Date().toISOString() }).eq("id", workout.id);
          });
        }}
        className="space-y-5"
      >
        {workout.exercises.length === 0 ? <p className="text-sm text-[#6B665C]">No exercises listed. Paul will add them.</p> : null}
        {workout.exercises.map((ex, i) => (
          <fieldset key={ex.name + i}>
            <legend className="mb-2 flex w-full items-baseline justify-between text-[15px] font-bold">
              {ex.name}
              <span className="text-sm font-normal text-[#6B665C]">{ex.sets} × {ex.reps}</span>
            </legend>
            <div className="space-y-2">
              {entries[i].sets.map((s, j) => (
                <div key={j} className="grid grid-cols-[28px_1fr_1fr] items-center gap-2">
                  <span className="text-sm font-bold text-[#6B665C]">{j + 1}</span>
                  <input aria-label={`${ex.name} set ${j + 1} weight in kg`} placeholder="kg" inputMode="decimal" value={s.weight} onChange={(e) => set(i, j, "weight", e.target.value)} className="h-11 rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-3 text-base outline-none focus:border-[#86712F]" />
                  <input aria-label={`${ex.name} set ${j + 1} reps`} placeholder="reps" inputMode="numeric" value={s.reps} onChange={(e) => set(i, j, "reps", e.target.value)} className="h-11 rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-3 text-base outline-none focus:border-[#86712F]" />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy}>{busy ? "Saving" : done ? "Save another log" : "Finish workout"}</button>
      </form>
    </Sheet>
  );
}

export function MeasurementSheet({ meId, onClose, onSaved }: { meId: string; onClose: () => void; onSaved: Done }) {
  const [v, setV] = useState({ waist_cm: "", chest_cm: "", hips_cm: "", arm_cm: "", thigh_cm: "" });
  const { busy, err, run } = useSubmit(() => {
    onSaved();
    onClose();
  });
  const fields: [keyof typeof v, string][] = [
    ["waist_cm", "Waist (cm)"],
    ["chest_cm", "Chest (cm)"],
    ["hips_cm", "Hips (cm)"],
    ["arm_cm", "Arm (cm)"],
    ["thigh_cm", "Thigh (cm)"],
  ];
  return (
    <Sheet title="Body measurements" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            db().from("measurements").upsert(
              {
                client_id: meId,
                day: today(),
                waist_cm: num(v.waist_cm),
                chest_cm: num(v.chest_cm),
                hips_cm: num(v.hips_cm),
                arm_cm: num(v.arm_cm),
                thigh_cm: num(v.thigh_cm),
              },
              { onConflict: "client_id,day" },
            ),
          );
        }}
        className="space-y-4"
      >
        {fields.map(([k, label]) => (
          <Field key={k} label={label} inputMode="decimal" value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} />
        ))}
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || Object.values(v).every((x) => !x)}>{busy ? "Saving" : "Save measurements"}</button>
      </form>
    </Sheet>
  );
}
