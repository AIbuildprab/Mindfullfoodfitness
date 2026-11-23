"use client";

import { useState } from "react";
import { addDays, ago, dayLong, today, weeksSince } from "@/lib/data/dates";
import { db, must, useQuery } from "@/lib/data/hooks";
import {
  fullName,
  type Checkin,
  type ClientRow,
  type Details,
  type Food,
  type Meal,
  type Measurement,
  type Photo,
  type Workout,
  type WorkoutLog,
  type WorkoutTemplate,
} from "@/lib/data/types";
import { Sheet } from "../ClientShell";
import {
  Avatar,
  BackIcon,
  card,
  EmptyCard,
  ErrorNote,
  Field,
  H,
  linkBtn,
  Loading,
  num,
  PageHead,
  primaryBtn,
  Select,
  WeightLine,
} from "../light";
import type { Nav } from "./Overview";
import { exercisesToText, parseExercises, useClients } from "./shared";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Progress" },
  { id: "nutrition", label: "Nutrition" },
  { id: "workouts", label: "Workouts" },
  { id: "check-ins", label: "Check-ins" },
  { id: "account", label: "Account" },
];

const typeLabel = (t?: string) => (t === "in_person" ? "In person" : "Online");

/* ----------------------------------------------------------- list */
function ClientList({ clients, selected, nav }: { clients: ClientRow[]; selected: string; nav: Nav }) {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const list = clients.filter((c) => (filter === "All" || typeLabel(c.client_details?.client_type) === filter) && fullName(c).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className={`${card} !p-3 sm:!p-4`}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" aria-label="Search clients" className="mb-3 h-11 w-full rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-[15px] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]" />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", "Online", "In person"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`h-9 rounded-full px-4 text-sm font-bold transition ${filter === f ? "bg-[#0B0B0C] text-white" : "bg-[#F0ECE2] text-[#4A463E] hover:bg-[#E7E2D3]"}`}>{f}</button>
        ))}
      </div>
      <ul className="space-y-0.5">
        {list.map((c) => (
          <li key={c.id}>
            <button onClick={() => nav({ view: "clients", client: c.id, section: "overview" })} aria-current={selected === c.id ? "true" : undefined} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition ${selected === c.id ? "bg-[#F6F4EF]" : "hover:bg-[#FBFAF6]"}`}>
              <Avatar name={fullName(c)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{fullName(c)}</span>
                <span className="block text-xs text-[#6B665C]">{typeLabel(c.client_details?.client_type)} · {c.client_details?.phase ?? "No phase"}</span>
              </span>
              {c.client_details?.status === "paused" ? <span className="rounded-full bg-[#EFEBDF] px-2 py-0.5 text-[11px] font-bold text-[#6B665C]">Paused</span> : null}
            </button>
          </li>
        ))}
        {list.length === 0 ? <li className="px-3 py-6 text-center text-sm text-[#6B665C]">{clients.length ? "No clients match." : "No clients yet."}</li> : null}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------- sections */
function Overview({ c, nav }: { c: ClientRow; nav: Nav }) {
  const q = useQuery(async () => {
    const s = db();
    const [ci, wo] = await Promise.all([
      s.from("checkins").select("*").eq("client_id", c.id).gte("day", addDays(today(), -13)).order("day", { ascending: false }),
      s.from("workouts").select("*").eq("client_id", c.id).gte("scheduled_on", addDays(today(), -13)).lte("scheduled_on", today()),
    ]);
    return { ci: must(ci) as Checkin[], wo: must(wo) as Workout[] };
  }, [c.id]);
  const d = c.client_details;
  const week = (q.data?.ci ?? []).filter((x) => x.day >= addDays(today(), -6)).length;
  const done = (q.data?.wo ?? []).filter((w) => w.completed_at).length;
  const planned = q.data?.wo.length ?? 0;
  const last = q.data?.ci[0];
  return (
    <div className="space-y-6">
      {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
      <section className={`${card} grid grid-cols-3 divide-x divide-[#EFEBDF]`}>
        {[
          { n: q.loading ? "–" : `${week}/7`, l: "Check-ins this week" },
          { n: q.loading ? "–" : planned ? `${done}/${planned}` : "–", l: "Workouts, 14 days" },
          { n: q.loading ? "–" : last ? ago(last.created_at).replace(" ago", "") : "None", l: "Last check-in" },
        ].map((x) => (
          <div key={x.l} className="px-3 first:pl-0 sm:px-6">
            <p className="text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{x.n}</p>
            <p className="mt-1 text-sm text-[#6B665C]">{x.l}</p>
          </div>
        ))}
      </section>
      <section className={card}>
        <H right={<button onClick={() => nav({ view: "messages", client: c.id })} className={linkBtn}>Message</button>}>About</H>
        <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
          <div><dt className="text-sm text-[#6B665C]">Goal</dt><dd className="font-semibold">{c.goal || "Not given"}</dd></div>
          <div><dt className="text-sm text-[#6B665C]">Phone</dt><dd className="font-semibold">{c.phone || "Not given"}</dd></div>
          <div><dt className="text-sm text-[#6B665C]">Phase</dt><dd className="font-semibold">{d ? `${d.phase}, week ${weeksSince(d.start_date)}` : "Not set"}</dd></div>
          <div><dt className="text-sm text-[#6B665C]">Notes</dt><dd className="font-semibold">{d?.notes || "None"}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function ProgressSection({ c }: { c: ClientRow }) {
  const ci = useQuery(async () => must(await db().from("checkins").select("*").eq("client_id", c.id).order("day")) as Checkin[], [c.id]);
  const ms = useQuery(async () => must(await db().from("measurements").select("*").eq("client_id", c.id).order("day", { ascending: false }).limit(1)) as Measurement[], [c.id]);
  const photos = useQuery(async () => {
    const s = db();
    const rows = must(await s.from("progress_photos").select("*").eq("client_id", c.id).order("day", { ascending: false }).limit(12)) as Photo[];
    if (!rows.length) return [] as (Photo & { url: string })[];
    const signed = await s.storage.from("progress-photos").createSignedUrls(rows.map((p) => p.path), 3600);
    return rows.map((p, i) => ({ ...p, url: signed.data?.[i]?.signedUrl ?? "" }));
  }, [c.id]);
  const w = (ci.data ?? []).filter((x) => x.weight_kg !== null);
  const m = ms.data?.[0];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className={`${card} md:col-span-2`}>
        <H right={w.length ? <span className="text-sm font-semibold tabular-nums text-[#6B665C]">{Number(w[w.length - 1].weight_kg).toFixed(1)} kg now</span> : null}>Weight</H>
        {ci.loading ? <Loading rows={2} /> : <WeightLine points={w.map((x) => Number(x.weight_kg))} label="Weight trend" />}
      </section>
      <section className={card}>
        <H>Measurements</H>
        {ms.loading ? <Loading /> : !m ? <p className="text-[15px] text-[#6B665C]">None logged yet.</p> : (
          <ul className="divide-y divide-[#EFEBDF] text-[15px]">
            {([["waist_cm", "Waist"], ["chest_cm", "Chest"], ["hips_cm", "Hips"], ["arm_cm", "Arm"], ["thigh_cm", "Thigh"]] as const).filter(([k]) => m[k] !== null).map(([k, l]) => (
              <li key={k} className="flex justify-between py-2.5"><span className="font-semibold">{l}</span><span className="tabular-nums">{m[k]} cm</span></li>
            ))}
          </ul>
        )}
      </section>
      <section className={card}>
        <H>Photos</H>
        {photos.loading ? <Loading /> : (photos.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">No photos yet.</p> : (
          <ul className="grid grid-cols-3 gap-2">
            {photos.data!.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl bg-[#EFEBDF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.url ? <img src={p.url} alt={`${p.view} photo, ${dayLong(p.day)}`} className="aspect-[3/4] w-full object-cover" /> : <div className="aspect-[3/4]" />}
                <p className="px-2 py-1 text-[11px] font-semibold capitalize text-[#6B665C]">{p.view} · {p.day.slice(5)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TargetsForm({ c, onSaved }: { c: ClientRow; onSaved: () => void }) {
  const d = c.client_details;
  const [v, setV] = useState({ kcal: String(d?.kcal_target ?? ""), p: String(d?.protein_target ?? ""), c: String(d?.carbs_target ?? ""), f: String(d?.fat_target ?? "") });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const r = await db().from("client_details").update({ kcal_target: num(v.kcal), protein_target: num(v.p), carbs_target: num(v.c), fat_target: num(v.f), updated_at: new Date().toISOString() }).eq("client_id", c.id);
    setState(r.error ? "error" : "saved");
    if (!r.error) onSaved();
  }
  return (
    <form onSubmit={save} className={card}>
      <H>Daily targets</H>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories" inputMode="numeric" value={v.kcal} onChange={(e) => setV({ ...v, kcal: e.target.value })} />
        <Field label="Protein g" inputMode="numeric" value={v.p} onChange={(e) => setV({ ...v, p: e.target.value })} />
        <Field label="Carbs g" inputMode="numeric" value={v.c} onChange={(e) => setV({ ...v, c: e.target.value })} />
        <Field label="Fat g" inputMode="numeric" value={v.f} onChange={(e) => setV({ ...v, f: e.target.value })} />
      </div>
      {state === "error" ? <div className="mt-3"><ErrorNote message="Targets did not save." /></div> : null}
      <div className="mt-4 flex items-center gap-3">
        <button className={primaryBtn} disabled={state === "saving"}>{state === "saving" ? "Saving" : "Save targets"}</button>
        {state === "saved" ? <span className="text-sm font-semibold text-[#2F6B3F]">Saved</span> : null}
      </div>
    </form>
  );
}

function NutritionSection({ c, reloadClients }: { c: ClientRow; reloadClients: () => void }) {
  const meals = useQuery(async () => must(await db().from("meals").select("*").eq("client_id", c.id).gte("day", addDays(today(), -2)).order("day", { ascending: false }).order("created_at")) as Meal[], [c.id]);
  const foods = useQuery(async () => must(await db().from("client_foods").select("*").eq("client_id", c.id).order("created_at")) as Food[], [c.id]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<Food["kind"]>("recommended");
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const r = await db().from("client_foods").insert({ client_id: c.id, name: name.trim(), note: note.trim() || null, kind });
    if (r.error) return setErr("Could not add that food.");
    setErr(null);
    setName("");
    setNote("");
    foods.reload();
  }
  async function remove(id: string) {
    await db().from("client_foods").delete().eq("id", id);
    foods.reload();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TargetsForm c={c} onSaved={reloadClients} />
      <section className={card}>
        <H>Recent meals</H>
        {meals.loading ? <Loading /> : (meals.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">Nothing logged in the last 3 days.</p> : (
          <ul className="divide-y divide-[#EFEBDF]">
            {meals.data!.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0"><p className="text-[15px] font-bold">{m.slot} <span className="text-xs font-semibold text-[#6B665C]">{m.day.slice(5)}</span></p><p className="truncate text-sm text-[#6B665C]">{m.description || "No description"}</p></div>
                <span className="text-sm font-semibold tabular-nums">{m.kcal} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={`${card} md:col-span-2`}>
        <H>Food list</H>
        <form onSubmit={add} className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
          <Field label="Food" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as Food["kind"])}><option value="recommended">Eat more</option><option value="limit">Limit</option></Select>
          <button className={`${primaryBtn} !h-12`} disabled={!name.trim()}>Add</button>
        </form>
        {err ? <ErrorNote message={err} /> : null}
        {foods.loading ? <Loading /> : (foods.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">No foods added yet.</p> : (
          <ul className="divide-y divide-[#EFEBDF]">
            {foods.data!.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><p className="text-[15px] font-bold">{f.name} <span className="text-xs font-semibold text-[#6B665C]">{f.kind === "limit" ? "Limit" : "Eat more"}</span></p>{f.note ? <p className="text-sm text-[#6B665C]">{f.note}</p> : null}</div>
                <button onClick={() => remove(f.id)} className={linkBtn}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AssignWorkoutSheet({ clientId, template, onClose, onSaved }: { clientId: string; template?: WorkoutTemplate; onClose: () => void; onSaved: () => void }) {
  const tpls = useQuery(async () => must(await db().from("workout_templates").select("*").order("name")) as WorkoutTemplate[], []);
  const [tid, setTid] = useState(template?.id ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [date, setDate] = useState(today());
  const [dur, setDur] = useState(template?.duration_min ? String(template.duration_min) : "");
  const [notes, setNotes] = useState("");
  const [ex, setEx] = useState(template ? exercisesToText(template.exercises) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function pick(id: string) {
    setTid(id);
    const t = tpls.data?.find((x) => x.id === id);
    if (t) {
      setName(t.name);
      setDur(t.duration_min ? String(t.duration_min) : "");
      setEx(exercisesToText(t.exercises));
    }
  }

  return (
    <Sheet title="Assign workout" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await db().from("workouts").insert({ client_id: clientId, scheduled_on: date, name: name.trim(), notes: notes.trim() || null, duration_min: num(dur), exercises: parseExercises(ex) });
          setBusy(false);
          if (r.error) return setErr("Workout did not save.");
          onSaved();
          onClose();
        }}
        className="space-y-4"
      >
        {!template && (tpls.data ?? []).length ? (
          <Select label="Start from a template" value={tid} onChange={(e) => pick(e.target.value)}>
            <option value="">Blank workout</option>
            {tpls.data!.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        ) : null}
        <Field label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <Field label="Minutes" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} />
        </div>
        <label className="block text-sm font-bold text-[#4A463E]">Exercises, one per line
          <textarea value={ex} onChange={(e) => setEx(e.target.value)} rows={5} placeholder={"Back squat 4x6\nRomanian deadlift 3x8"} className="mt-1.5 w-full rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-4 py-3 text-base font-normal outline-none placeholder:text-[#8A8577] focus:border-[#86712F]" />
        </label>
        <Field label="Note for the client (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || !name.trim()}>{busy ? "Saving" : "Assign workout"}</button>
      </form>
    </Sheet>
  );
}

function WorkoutsSection({ c }: { c: ClientRow }) {
  const [open, setOpen] = useState(false);
  const plan = useQuery(async () => must(await db().from("workouts").select("*").eq("client_id", c.id).order("scheduled_on", { ascending: false }).limit(30)) as Workout[], [c.id]);
  const logs = useQuery(async () => must(await db().from("workout_logs").select("*").eq("client_id", c.id).order("logged_on", { ascending: false }).limit(20)) as WorkoutLog[], [c.id]);
  const names = new Map((plan.data ?? []).map((w) => [w.id, w.name]));

  async function remove(id: string) {
    await db().from("workouts").delete().eq("id", id);
    plan.reload();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className={card}>
        <H right={<button onClick={() => setOpen(true)} className={linkBtn}>Assign</button>}>Assigned workouts</H>
        {plan.loading ? <Loading /> : (plan.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">No workouts assigned yet.</p> : (
          <ul className="divide-y divide-[#EFEBDF]">
            {plan.data!.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="text-[15px] font-bold">{w.name}</p><p className="text-sm text-[#6B665C]">{dayLong(w.scheduled_on)}{w.completed_at ? " · Done" : ""}</p></div>
                {!w.completed_at ? <button onClick={() => remove(w.id)} className={linkBtn}>Remove</button> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={card}>
        <H>Training log</H>
        {logs.loading ? <Loading /> : (logs.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">Nothing logged yet.</p> : (
          <ul className="space-y-4">
            {logs.data!.map((l) => (
              <li key={l.id}>
                <p className="text-sm font-semibold text-[#6B665C]">{dayLong(l.logged_on)}</p>
                <p className="mb-1 text-[15px] font-extrabold">{(l.workout_id && names.get(l.workout_id)) || "Workout"}</p>
                <ul className="divide-y divide-[#EFEBDF] text-sm">
                  {l.entries.map((e, i) => (
                    <li key={i} className="flex justify-between gap-3 py-1.5"><span className="font-semibold">{e.name}</span><span className="tabular-nums text-[#6B665C]">{e.sets.filter((s) => s.reps || s.weight).map((s) => `${s.weight || "–"}×${s.reps || "–"}`).join("  ") || "–"}</span></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
      {open ? <AssignWorkoutSheet clientId={c.id} onClose={() => setOpen(false)} onSaved={plan.reload} /> : null}
    </div>
  );
}

function CheckinsSection({ c }: { c: ClientRow }) {
  const q = useQuery(async () => must(await db().from("checkins").select("*").eq("client_id", c.id).order("day", { ascending: false }).limit(30)) as Checkin[], [c.id]);
  if (q.loading) return <div className={card}><Loading rows={4} /></div>;
  if (q.error) return <ErrorNote message={q.error} onRetry={q.reload} />;
  if (!q.data?.length) return <EmptyCard title="No check-ins yet" text={`${c.first_name ?? "They"} has not logged a check-in.`} />;
  return (
    <section className={card}>
      <ul className="divide-y divide-[#EFEBDF]">
        {q.data.map((x) => (
          <li key={x.id} className="py-3">
            <p className="text-[15px] font-bold">{dayLong(x.day)}</p>
            <p className="text-sm tabular-nums text-[#6B665C]">{[x.weight_kg !== null && `${x.weight_kg} kg`, x.steps !== null && `${x.steps.toLocaleString("en-GB")} steps`, x.sleep_hours !== null && `${x.sleep_hours} h sleep`].filter(Boolean).join(" · ") || "No numbers"}</p>
            {x.notes ? <p className="mt-1 text-[15px]">{x.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AccountSection({ c, reload }: { c: ClientRow; reload: () => void }) {
  const d = c.client_details;
  const [v, setV] = useState({
    client_type: d?.client_type ?? "online",
    phase: d?.phase ?? "Foundations",
    status: d?.status ?? "active",
    start_date: d?.start_date ?? today(),
    weight_goal_kg: String(d?.weight_goal_kg ?? ""),
    notes: d?.notes ?? "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        const r = await db().from("client_details").update({ ...v, weight_goal_kg: num(v.weight_goal_kg), notes: v.notes.trim() || null, updated_at: new Date().toISOString() } as Partial<Details>).eq("client_id", c.id);
        setState(r.error ? "error" : "saved");
        if (!r.error) reload();
      }}
      className={`${card} max-w-xl space-y-4`}
    >
      <Select label="Coaching type" value={v.client_type} onChange={(e) => setV({ ...v, client_type: e.target.value as Details["client_type"] })}><option value="online">Online</option><option value="in_person">In person</option></Select>
      <Field label="Phase" value={v.phase} onChange={(e) => setV({ ...v, phase: e.target.value })} />
      <Select label="Status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as Details["status"] })}><option value="active">Active</option><option value="pending">Pending</option><option value="paused">Paused</option></Select>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" type="date" value={v.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value })} />
        <Field label="Goal weight (kg)" inputMode="decimal" value={v.weight_goal_kg} onChange={(e) => setV({ ...v, weight_goal_kg: e.target.value })} />
      </div>
      <Field label="Private notes" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
      {state === "error" ? <ErrorNote message="Changes did not save." /> : null}
      <div className="flex items-center gap-3">
        <button className={primaryBtn} disabled={state === "saving"}>{state === "saving" ? "Saving" : "Save changes"}</button>
        {state === "saved" ? <span className="text-sm font-semibold text-[#2F6B3F]">Saved</span> : null}
      </div>
    </form>
  );
}

/* ------------------------------------------------------- workspace */
function Workspace({ c, section, nav, reload }: { c: ClientRow; section: string; nav: Nav; reload: () => void }) {
  const d = c.client_details;
  return (
    <div>
      <button onClick={() => nav({ view: "clients" })} className="mb-3 inline-flex h-9 items-center gap-1 rounded-full pr-3 text-sm font-bold text-[#4A463E] hover:text-[#0B0B0C] lg:hidden"><BackIcon />Clients</button>
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={fullName(c)} size={56} />
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{fullName(c)}</h2>
          <p className="text-sm text-[#6B665C]">{typeLabel(d?.client_type)} · {d?.phase ?? "No phase"}{d ? ` · Week ${weeksSince(d.start_date)}` : ""}</p>
        </div>
      </div>
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-[#EAE5D8] p-1 [scrollbar-width:none]">
        {SECTIONS.map((s) => (
          <button key={s.id} role="tab" aria-selected={section === s.id} onClick={() => nav({ view: "clients", client: c.id, section: s.id })} className={`h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${section === s.id ? "bg-white shadow-sm" : "text-[#4A463E] hover:text-[#0B0B0C]"}`}>{s.label}</button>
        ))}
      </div>
      {section === "overview" ? <Overview c={c} nav={nav} /> : null}
      {section === "progress" ? <ProgressSection c={c} /> : null}
      {section === "nutrition" ? <NutritionSection c={c} reloadClients={reload} /> : null}
      {section === "workouts" ? <WorkoutsSection c={c} /> : null}
      {section === "check-ins" ? <CheckinsSection c={c} /> : null}
      {section === "account" ? <AccountSection c={c} reload={reload} /> : null}
    </div>
  );
}

export function Clients({ clientId, section, nav }: { clientId: string; section: string; nav: Nav }) {
  const q = useClients();
  const clients = q.data ?? [];
  const client = clients.find((c) => c.id === clientId);
  return (
    <>
      <PageHead title="Clients" sub={q.loading ? "Loading" : `${clients.length} ${clients.length === 1 ? "client" : "clients"}`} />
      {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className={client ? "hidden lg:block" : ""}><ClientList clients={clients} selected={clientId} nav={nav} /></div>
        <div className={client ? "" : "hidden lg:block"}>
          {client ? <Workspace c={client} section={section} nav={nav} reload={q.reload} /> : <EmptyCard title="Select a client" text="Pick someone from the list to see their plan and progress." />}
        </div>
      </div>
    </>
  );
}

