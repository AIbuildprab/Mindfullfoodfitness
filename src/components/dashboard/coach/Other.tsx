"use client";

import { useEffect, useState } from "react";
import { addDays, ago, dateOf, dayLong, iso, timeOf, today } from "@/lib/data/dates";
import { db, must, useQuery } from "@/lib/data/hooks";
import { fullName, type ClientRow, type Invite, type Message, type NutritionTemplate, type Session, type WorkoutTemplate } from "@/lib/data/types";
import { Sheet } from "../ClientShell";
import { Thread } from "../Thread";
import { Avatar, card, EmptyCard, ErrorNote, Field, H, linkBtn, Loading, num, PageHead, primaryBtn, Select, softBtn } from "../light";
import { AssignWorkoutSheet } from "./Clients";
import type { Nav } from "./Overview";
import { parseExercises, useClients } from "./shared";

/* ---------------------------------------------------------------- inbox */
export function Inbox({ meId, clientId, nav }: { meId: string; clientId: string; nav: Nav }) {
  const clients = useClients();
  const msgs = useQuery(async () => must(await db().from("messages").select("*").order("created_at", { ascending: false }).limit(300)) as Message[], []);
  const reload = msgs.reload;

  useEffect(() => {
    const s = db();
    const ch = s.channel("coach-inbox").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => reload()).subscribe();
    return () => {
      s.removeChannel(ch);
    };
  }, [reload]);

  const list = clients.data ?? [];
  const last = new Map<string, Message>();
  const unread = new Map<string, number>();
  for (const m of msgs.data ?? []) {
    if (!last.has(m.client_id)) last.set(m.client_id, m);
    if (!m.read_at && m.sender_id === m.client_id) unread.set(m.client_id, (unread.get(m.client_id) ?? 0) + 1);
  }
  const sorted = [...list].sort((a, b) => (last.get(b.id)?.created_at ?? "").localeCompare(last.get(a.id)?.created_at ?? ""));
  const client = list.find((c) => c.id === clientId);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-white sm:rounded-3xl sm:shadow-[0_8px_24px_-12px_rgba(11,11,12,0.15)]">
      <div className={`w-full shrink-0 overflow-y-auto border-r border-[#EFEBDF] lg:w-[320px] ${client ? "hidden lg:block" : ""}`}>
        <h1 className="px-5 py-4 text-xl font-extrabold">Messages</h1>
        {clients.loading ? <div className="px-5"><Loading rows={4} /></div> : sorted.length === 0 ? <p className="px-5 text-sm text-[#6B665C]">No clients yet.</p> : (
          <ul>
            {sorted.map((c) => {
              const l = last.get(c.id);
              const n = unread.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <button onClick={() => nav({ view: "messages", client: c.id })} className={`flex min-h-16 w-full items-center gap-3 px-5 text-left transition hover:bg-[#FBFAF6] ${clientId === c.id ? "bg-[#F6F4EF]" : ""}`}>
                    <Avatar name={fullName(c)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{fullName(c)}</span>
                      <span className={`block truncate text-sm ${n ? "font-semibold text-[#0B0B0C]" : "text-[#6B665C]"}`}>{l ? l.body : "No messages yet"}</span>
                    </span>
                    {n ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D6453D] px-1.5 text-[11px] font-bold text-white">{n}</span> : l ? <span className="text-xs text-[#8A8577]">{ago(l.created_at).replace(" ago", "")}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className={`min-w-0 flex-1 flex-col ${client ? "flex" : "hidden lg:flex"}`}>
        {client ? (
          <Thread key={client.id} clientId={client.id} meId={meId} title={fullName(client)} avatar={<Avatar name={fullName(client)} />} placeholder={`Reply to ${client.first_name ?? "client"}`} onBack={() => nav({ view: "messages" })} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#6B665C]">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- schedule */
export function Schedule() {
  const clients = useClients();
  const [date, setDate] = useState(addDays(today(), 1));
  const [time, setTime] = useState("09:00");
  const [mins, setMins] = useState("60");
  const [err, setErr] = useState<string | null>(null);
  const q = useQuery(async () => must(await db().from("sessions").select("*").gte("starts_at", new Date(Date.now() - 86400000).toISOString()).neq("status", "cancelled").order("starts_at").limit(120)) as Session[], []);
  const byId = new Map((clients.data ?? []).map((c) => [c.id, c]));

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + (num(mins) ?? 60) * 60000);
    const r = await db().from("sessions").insert({ starts_at: start.toISOString(), ends_at: end.toISOString() });
    setErr(r.error ? "Slot did not save." : null);
    q.reload();
  }
  async function setStatus(s: Session, status: Session["status"], clear = false) {
    const r = await db().from("sessions").update(clear ? { status, client_id: null } : { status }).eq("id", s.id);
    setErr(r.error ? "That change did not save." : null);
    q.reload();
  }
  async function remove(id: string) {
    await db().from("sessions").delete().eq("id", id);
    q.reload();
  }

  const grouped = (q.data ?? []).reduce<Record<string, Session[]>>((a, s) => {
    (a[iso(new Date(s.starts_at))] ||= []).push(s);
    return a;
  }, {});

  return (
    <>
      <PageHead title="Schedule" sub="Open slots, requests and booked sessions." />
      <form onSubmit={addSlot} className={`${card} mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end`}>
        <Field label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <Field label="Start" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        <Field label="Minutes" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} />
        <button className={`${primaryBtn} !h-12`}>Add open slot</button>
      </form>
      {err ? <div className="mb-4"><ErrorNote message={err} /></div> : null}
      {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
      {q.loading ? <div className={card}><Loading rows={4} /></div> : Object.keys(grouped).length === 0 ? (
        <EmptyCard title="Nothing scheduled" text="Add open slots above so clients can book." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([k, ss]) => (
            <section key={k} className={card}>
              <H>{dayLong(k)}</H>
              <ul className="space-y-3">
                {ss.map((s) => {
                  const who = s.client_id ? byId.get(s.client_id) : null;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-3">
                      <span className="w-14 shrink-0 text-sm font-extrabold tabular-nums">{timeOf(s.starts_at)}</span>
                      <span className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${s.status === "open" ? "border border-dashed border-[#D9D3C3]" : "bg-[#F6F4EF]"}`}>
                        <span className="block text-[15px] font-bold">{who ? fullName(who) : "Open slot"}</span>
                        <span className="block text-sm text-[#6B665C]">{s.status === "requested" ? "Requested" : s.status === "confirmed" ? "Confirmed" : s.title}</span>
                      </span>
                      <span className="flex gap-2">
                        {s.status === "requested" ? <button onClick={() => setStatus(s, "confirmed")} className={primaryBtn}>Confirm</button> : null}
                        {s.status === "requested" || s.status === "confirmed" ? <button onClick={() => setStatus(s, "open", true)} className={softBtn}>Release</button> : null}
                        {s.status === "open" ? <button onClick={() => remove(s.id)} className={softBtn}>Remove</button> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------ templates */
function ClientPicker({ clients, value, onChange }: { clients: ClientRow[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select label="Client" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose a client</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
    </Select>
  );
}

function WorkoutTemplateSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [dur, setDur] = useState("");
  const [ex, setEx] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="New workout template" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await db().from("workout_templates").insert({ name: name.trim(), description: desc.trim() || null, duration_min: num(dur), exercises: parseExercises(ex) });
          setBusy(false);
          if (r.error) return setErr("Template did not save.");
          onSaved();
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Field label="Minutes" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} />
        <label className="block text-sm font-bold text-[#4A463E]">Exercises, one per line
          <textarea value={ex} onChange={(e) => setEx(e.target.value)} rows={5} placeholder={"Back squat 4x6\nRomanian deadlift 3x8"} className="mt-1.5 w-full rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-4 py-3 text-base font-normal outline-none placeholder:text-[#8A8577] focus:border-[#86712F]" />
        </label>
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || !name.trim()}>{busy ? "Saving" : "Save template"}</button>
      </form>
    </Sheet>
  );
}

function NutritionTemplateSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ name: "", description: "", kcal: "", p: "", c: "", f: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="New nutrition template" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await db().from("nutrition_templates").insert({ name: v.name.trim(), description: v.description.trim() || null, kcal: num(v.kcal), protein_g: num(v.p), carbs_g: num(v.c), fat_g: num(v.f) });
          setBusy(false);
          if (r.error) return setErr("Template did not save.");
          onSaved();
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="Name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <Field label="Description" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <Field label="Calories" inputMode="numeric" value={v.kcal} onChange={(e) => setV({ ...v, kcal: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein g" inputMode="numeric" value={v.p} onChange={(e) => setV({ ...v, p: e.target.value })} />
          <Field label="Carbs g" inputMode="numeric" value={v.c} onChange={(e) => setV({ ...v, c: e.target.value })} />
          <Field label="Fat g" inputMode="numeric" value={v.f} onChange={(e) => setV({ ...v, f: e.target.value })} />
        </div>
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || !v.name.trim()}>{busy ? "Saving" : "Save template"}</button>
      </form>
    </Sheet>
  );
}

function AssignNutritionSheet({ t, clients, onClose }: { t: NutritionTemplate; clients: ClientRow[]; onClose: () => void }) {
  const [cid, setCid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title={`Assign ${t.name}`} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await db().from("client_details").update({ kcal_target: t.kcal, protein_target: t.protein_g, carbs_target: t.carbs_g, fat_target: t.fat_g, updated_at: new Date().toISOString() }).eq("client_id", cid);
          setBusy(false);
          if (r.error) return setErr("Could not assign targets.");
          onClose();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-[#6B665C]">This sets the client’s daily targets to {t.kcal ?? "–"} kcal, {t.protein_g ?? "–"}P / {t.carbs_g ?? "–"}C / {t.fat_g ?? "–"}F.</p>
        <ClientPicker clients={clients} value={cid} onChange={setCid} />
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || !cid}>{busy ? "Saving" : "Assign targets"}</button>
      </form>
    </Sheet>
  );
}

function PickClientSheet({ clients, t, onClose }: { clients: ClientRow[]; t: WorkoutTemplate; onClose: () => void }) {
  const [cid, setCid] = useState("");
  if (cid) return <AssignWorkoutSheet clientId={cid} template={t} onClose={onClose} onSaved={() => undefined} />;
  return (
    <Sheet title={`Assign ${t.name}`} onClose={onClose}>
      <div className="space-y-4">
        <ClientPicker clients={clients} value={cid} onChange={setCid} />
      </div>
    </Sheet>
  );
}

export function Library({ kind }: { kind: "nutrition" | "workouts" }) {
  const clients = useClients();
  const [creating, setCreating] = useState(false);
  const [assignW, setAssignW] = useState<WorkoutTemplate | null>(null);
  const [assignN, setAssignN] = useState<NutritionTemplate | null>(null);
  const table = kind === "workouts" ? "workout_templates" : "nutrition_templates";
  const q = useQuery(async () => must(await db().from(table).select("*").order("created_at", { ascending: false })) as (WorkoutTemplate & NutritionTemplate)[], [kind]);
  const title = kind === "workouts" ? "Workout templates" : "Nutrition templates";

  async function remove(id: string) {
    await db().from(table).delete().eq("id", id);
    q.reload();
  }

  return (
    <>
      <PageHead title={title} sub="Your coach-wide library." action={<button onClick={() => setCreating(true)} className={primaryBtn}>New template</button>} />
      {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
      {q.loading ? <div className={card}><Loading rows={3} /></div> : (q.data ?? []).length === 0 ? (
        <EmptyCard title="No templates yet" text="Create one, then assign it to any client." />
      ) : (
        <ul className={`${card} divide-y divide-[#EFEBDF] !py-2`}>
          {q.data!.map((t) => (
            <li key={t.id} className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold">{t.name}</p>
                <p className="truncate text-sm text-[#6B665C]">
                  {kind === "workouts" ? `${t.exercises?.length ?? 0} exercises${t.duration_min ? ` · ${t.duration_min} min` : ""}` : `${t.kcal ?? "–"} kcal · ${t.protein_g ?? "–"}P / ${t.carbs_g ?? "–"}C / ${t.fat_g ?? "–"}F`}
                  {t.description ? ` · ${t.description}` : ""}
                </p>
              </div>
              <span className="flex gap-2">
                <button onClick={() => (kind === "workouts" ? setAssignW(t) : setAssignN(t))} className={softBtn}>Assign</button>
                <button onClick={() => remove(t.id)} className={linkBtn}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {creating && kind === "workouts" ? <WorkoutTemplateSheet onClose={() => setCreating(false)} onSaved={q.reload} /> : null}
      {creating && kind === "nutrition" ? <NutritionTemplateSheet onClose={() => setCreating(false)} onSaved={q.reload} /> : null}
      {assignW ? <PickClientSheet clients={clients.data ?? []} t={assignW} onClose={() => setAssignW(null)} /> : null}
      {assignN ? <AssignNutritionSheet clients={clients.data ?? []} t={assignN} onClose={() => setAssignN(null)} /> : null}
    </>
  );
}

/* ---------------------------------------------------------- training log */
export function TrainingLog({ nav }: { nav: Nav }) {
  const clients = useClients();
  const logs = useQuery(async () => must(await db().from("workout_logs").select("client_id, logged_on").order("logged_on", { ascending: false }).limit(200)) as { client_id: string; logged_on: string }[], []);
  const last = new Map<string, string>();
  for (const l of logs.data ?? []) if (!last.has(l.client_id)) last.set(l.client_id, l.logged_on);
  return (
    <>
      <PageHead title="Training log" sub="Pick a client to view their log." />
      {clients.loading ? <div className={card}><Loading rows={4} /></div> : (clients.data ?? []).length === 0 ? (
        <EmptyCard title="No clients yet" />
      ) : (
        <ul className={`${card} divide-y divide-[#EFEBDF] !py-2`}>
          {clients.data!.map((c) => (
            <li key={c.id}>
              <button onClick={() => nav({ view: "clients", client: c.id, section: "workouts" })} className="flex min-h-16 w-full items-center gap-3 py-3 text-left">
                <Avatar name={fullName(c)} />
                <span className="flex-1 text-[15px] font-bold">{fullName(c)}</span>
                <span className="text-sm text-[#6B665C]">{last.has(c.id) ? `Last: ${dateOf(`${last.get(c.id)}T12:00:00`)}` : "Nothing logged"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- invite */
export function InviteSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const invites = useQuery(async () => must(await db().from("invites").select("*").order("created_at", { ascending: false }).limit(8)) as Invite[], [saved]);
  const link = typeof window === "undefined" ? "/signup" : `${window.location.origin}/signup`;

  return (
    <Sheet title="Invite client" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const r = await db().from("invites").insert({ email: email.trim().toLowerCase(), first_name: name.trim() || null });
          setBusy(false);
          if (r.error) return setErr(r.error.code === "23505" ? "That email has already been invited." : "Invite did not save.");
          setName("");
          setEmail("");
          setSaved((s) => !s);
        }}
        className="space-y-4"
      >
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {err ? <ErrorNote message={err} /> : null}
        <button className={`${primaryBtn} w-full`} disabled={busy || !email.trim()}>{busy ? "Saving" : "Save invite"}</button>
      </form>
      <div className="mt-5 rounded-2xl bg-[#F6F4EF] p-4">
        <p className="text-sm text-[#4A463E]">Invites are recorded here and marked accepted when that email signs up. Send them the sign-up link yourself:</p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={link} aria-label="Sign-up link" className="h-11 min-w-0 flex-1 rounded-full border border-[#D9D3C3] bg-white px-4 text-sm" />
          <button onClick={() => { void navigator.clipboard?.writeText(link).then(() => setCopied(true)); }} className={softBtn} type="button">{copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      {(invites.data ?? []).length ? (
        <ul className="mt-5 divide-y divide-[#EFEBDF]">
          {invites.data!.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate font-semibold">{i.first_name ? `${i.first_name} · ` : ""}{i.email}</span>
              <span className={i.status === "accepted" ? "font-bold text-[#2F6B3F]" : "text-[#6B665C]"}>{i.status === "accepted" ? "Joined" : "Pending"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Sheet>
  );
}

