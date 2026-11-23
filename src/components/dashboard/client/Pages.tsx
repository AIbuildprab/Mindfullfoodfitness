"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, dateOf, dayLong, iso, timeOf, today } from "@/lib/data/dates";
import { db, must, useQuery } from "@/lib/data/hooks";
import type { Checkin, Details, Food, Measurement, Meal, Photo, Session, Workout, WorkoutLog } from "@/lib/data/types";
import { Thread } from "../Thread";
import { card, EmptyCard, ErrorNote, H, linkBtn, Loading, PageHead, primaryBtn, Select, softBtn, Tabs, WeightLine } from "../light";
import { Macros, sumMeals, CalorieRing } from "./Home";
import { MealSheet, MeasurementSheet, WorkoutSheet } from "./Sheets";

type Go = (tab: string, view?: string) => void;

/* ------------------------------------------------------------ schedule */
export function Schedule({ meId }: { meId: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery(async () => {
    const r = await db()
      .from("sessions")
      .select("*")
      .gt("starts_at", new Date().toISOString())
      .lt("starts_at", new Date(Date.now() + 21 * 86400000).toISOString())
      .order("starts_at");
    return must(r) as Session[];
  }, [meId]);

  const mine = (q.data ?? []).filter((s) => s.client_id === meId);
  const open = (q.data ?? []).filter((s) => s.status === "open");
  const byDay = open.reduce<Record<string, Session[]>>((a, s) => {
    const k = iso(new Date(s.starts_at));
    (a[k] ||= []).push(s);
    return a;
  }, {});

  async function act(kind: "request" | "cancel", id: string) {
    setBusy(id);
    setErr(null);
    const r = kind === "request" ? await db().rpc("request_session", { p_id: id }) : await db().rpc("cancel_session", { p_id: id });
    setBusy(null);
    if (r.error) setErr(r.error.message);
    q.reload();
  }

  return (
    <>
      <PageHead title="Book a session" sub="Pick a time from Paul’s availability." />
      {err ? <div className="mb-4"><ErrorNote message={err} /></div> : null}
      {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
      <div className="space-y-6">
        {mine.length ? (
          <section className={card}>
            <H>Your sessions</H>
            <ul className="divide-y divide-[#EFEBDF]">
              {mine.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-[15px] font-bold">{dateOf(s.starts_at)} · {timeOf(s.starts_at)}</p>
                    <p className="text-sm text-[#6B665C]">{s.title} · {s.status === "confirmed" ? "Confirmed" : "Waiting for Paul to confirm"}</p>
                  </div>
                  <button onClick={() => act("cancel", s.id)} disabled={busy === s.id} className={softBtn}>Cancel</button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={card}>
          <H>Available times</H>
          {q.loading ? <Loading rows={4} /> : Object.keys(byDay).length === 0 ? (
            <p className="text-[15px] text-[#6B665C]">No open times right now. Message Paul to ask for a slot.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(byDay).map(([k, ss]) => (
                <div key={k}>
                  <p className="mb-2 text-sm font-bold text-[#6B665C]">{dayLong(k)}</p>
                  <div className="flex flex-wrap gap-2">
                    {ss.map((s) => (
                      <button key={s.id} onClick={() => act("request", s.id)} disabled={busy === s.id} className="h-11 rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-5 text-sm font-bold tabular-nums transition hover:border-[#0B0B0C] hover:bg-[#0B0B0C] hover:text-white disabled:opacity-40">
                        {timeOf(s.starts_at)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ messages */
export function Messages({ meId, onBack }: { meId: string; onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white sm:rounded-3xl sm:shadow-[0_8px_24px_-12px_rgba(11,11,12,0.15)]">
      <Thread
        clientId={meId}
        meId={meId}
        title="Paul McGann"
        onBack={onBack}
        placeholder="Message Paul"
        avatar={<span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0C] text-sm font-bold text-[#E4D18B]">P</span>}
      />
    </div>
  );
}

/* ------------------------------------------------------------ training */
export function Training({ meId, view, go }: { meId: string; view: string; go: Go }) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const plan = useQuery(async () => must(await db().from("workouts").select("*").eq("client_id", meId).gte("scheduled_on", addDays(today(), -7)).order("scheduled_on").limit(60)) as Workout[], [meId, view]);
  const logs = useQuery(async () => must(await db().from("workout_logs").select("*").eq("client_id", meId).order("logged_on", { ascending: false }).limit(40)) as WorkoutLog[], [meId, view]);
  const names = new Map((plan.data ?? []).map((w) => [w.id, w.name]));
  const isLog = view === "log";

  return (
    <>
      <PageHead title="Training" sub="Your programme and workout history." />
      <Tabs items={[{ id: "plan", label: "My plan" }, { id: "log", label: "My log" }]} value={isLog ? "log" : "plan"} onChange={(v) => go("training", v === "log" ? "log" : undefined)} />
      {!isLog ? (
        plan.loading ? <div className={card}><Loading rows={4} /></div> : plan.error ? <ErrorNote message={plan.error} onRetry={plan.reload} /> : (plan.data ?? []).length === 0 ? (
          <EmptyCard title="No plan yet" text="Paul will add your programme soon." />
        ) : (
          <ul className="space-y-3">
            {plan.data!.map((w) => (
              <li key={w.id} className={`${card} flex flex-wrap items-center justify-between gap-3 !p-4 sm:!p-5`}>
                <div>
                  <p className="text-sm font-semibold text-[#6B665C]">{dayLong(w.scheduled_on)}</p>
                  <p className="text-lg font-extrabold">{w.name}</p>
                  <p className="text-sm text-[#6B665C]">{w.exercises.length} exercises{w.duration_min ? ` · ${w.duration_min} min` : ""}{w.completed_at ? " · Done" : ""}</p>
                </div>
                <button onClick={() => setWorkout(w)} className={w.completed_at ? softBtn : primaryBtn}>{w.completed_at ? "View" : "Start"}</button>
              </li>
            ))}
          </ul>
        )
      ) : logs.loading ? <div className={card}><Loading rows={4} /></div> : logs.error ? <ErrorNote message={logs.error} onRetry={logs.reload} /> : (logs.data ?? []).length === 0 ? (
        <EmptyCard title="No sessions logged yet" text="Finished workouts will show up here." />
      ) : (
        <ul className="space-y-3">
          {logs.data!.map((l) => (
            <li key={l.id} className={card}>
              <p className="text-sm font-semibold text-[#6B665C]">{dayLong(l.logged_on)}</p>
              <p className="mb-3 text-lg font-extrabold">{(l.workout_id && names.get(l.workout_id)) || "Workout"}</p>
              <ul className="divide-y divide-[#EFEBDF]">
                {l.entries.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2 text-[15px]">
                    <span className="font-semibold">{e.name}</span>
                    <span className="tabular-nums text-[#6B665C]">{e.sets.filter((s) => s.reps || s.weight).map((s) => `${s.weight || "–"}kg×${s.reps || "–"}`).join("  ") || "No sets recorded"}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {workout ? <WorkoutSheet meId={meId} workout={workout} onClose={() => setWorkout(null)} onSaved={() => { plan.reload(); logs.reload(); }} /> : null}
    </>
  );
}

/* ------------------------------------------------------------ nutrition */
export function Nutrition({ meId, view, go }: { meId: string; view: string; go: Go }) {
  const day = today();
  const [open, setOpen] = useState(false);
  const details = useQuery(async () => must(await db().from("client_details").select("*").eq("client_id", meId).maybeSingle()) as Details | null, [meId]);
  const meals = useQuery(async () => must(await db().from("meals").select("*").eq("client_id", meId).eq("day", day).order("created_at")) as Meal[], [meId]);
  const foods = useQuery(async () => must(await db().from("client_foods").select("*").eq("client_id", meId).order("created_at")) as Food[], [meId]);
  const isFoods = view === "food-list";
  const d = details.data;
  const eaten = sumMeals(meals.data ?? []);

  return (
    <>
      <PageHead title="Nutrition" sub="Your targets and food list." />
      <Tabs items={[{ id: "plan", label: "My plan" }, { id: "food-list", label: "Food list" }]} value={isFoods ? "food-list" : "plan"} onChange={(v) => go("nutrition", v === "food-list" ? "food-list" : undefined)} />
      {!isFoods ? (
        <div className="grid gap-6 md:grid-cols-2">
          <section className={card}>
            <H>Daily targets</H>
            {details.loading ? <Loading /> : !d?.kcal_target ? (
              <p className="text-[15px] text-[#6B665C]">Paul has not set your targets yet. You can still log what you eat.</p>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-5">
                  <CalorieRing now={eaten.kcal} goal={d.kcal_target} />
                  <p className="text-sm text-[#6B665C]">Target<br /><span className="text-xl font-extrabold tabular-nums text-[#0B0B0C]">{d.kcal_target.toLocaleString("en-GB")}</span> kcal</p>
                </div>
                <Macros meals={meals.data ?? []} d={d} />
              </>
            )}
          </section>
          <section className={card}>
            <H right={<button onClick={() => setOpen(true)} className={linkBtn}>Log meal</button>}>Today’s meals</H>
            {meals.loading ? <Loading /> : (meals.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">Nothing logged yet today.</p> : (
              <ul className="divide-y divide-[#EFEBDF]">
                {meals.data!.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0"><p className="text-[15px] font-bold">{m.slot}</p><p className="truncate text-sm text-[#6B665C]">{m.description || "No description"}</p></div>
                    <span className="text-sm font-semibold tabular-nums">{m.kcal} kcal</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : foods.loading ? <div className={card}><Loading rows={4} /></div> : (foods.data ?? []).length === 0 ? (
        <EmptyCard title="No food list yet" text="Paul will add foods to eat more of and foods to limit." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {(["recommended", "limit"] as const).map((k) => (
            <section key={k} className={card}>
              <H>{k === "recommended" ? "Eat more of" : "Limit"}</H>
              <ul className="divide-y divide-[#EFEBDF]">
                {foods.data!.filter((f) => f.kind === k).map((f) => (
                  <li key={f.id} className="py-3"><p className="text-[15px] font-bold">{f.name}</p>{f.note ? <p className="text-sm text-[#6B665C]">{f.note}</p> : null}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {open ? <MealSheet meId={meId} day={day} onClose={() => setOpen(false)} onSaved={meals.reload} /> : null}
    </>
  );
}

/* ------------------------------------------------------------- progress */
const MEASURES: [keyof Measurement, string][] = [["waist_cm", "Waist"], ["chest_cm", "Chest"], ["hips_cm", "Hips"], ["arm_cm", "Arm"], ["thigh_cm", "Thigh"]];

export function Progress({ meId, version }: { meId: string; version: number }) {
  const [mOpen, setMOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<Photo["view"]>("front");
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const checkins = useQuery(async () => must(await db().from("checkins").select("*").eq("client_id", meId).order("day")) as Checkin[], [meId, version]);
  const ms = useQuery(async () => must(await db().from("measurements").select("*").eq("client_id", meId).order("day", { ascending: false }).limit(2)) as Measurement[], [meId]);
  const photos = useQuery(async () => {
    const supabase = db();
    const rows = must(await supabase.from("progress_photos").select("*").eq("client_id", meId).order("day", { ascending: false }).limit(12)) as Photo[];
    if (!rows.length) return [] as (Photo & { url: string })[];
    const signed = await supabase.storage.from("progress-photos").createSignedUrls(rows.map((p) => p.path), 3600);
    return rows.map((p, i) => ({ ...p, url: signed.data?.[i]?.signedUrl ?? "" }));
  }, [meId]);

  async function upload(f: File) {
    setErr(null);
    setUploading(true);
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const path = `${meId}/${Date.now()}-${view}.${ext}`;
    const up = await db().storage.from("progress-photos").upload(path, f, { contentType: f.type });
    if (up.error) {
      setErr("Photo upload failed. Use a JPG, PNG or WebP under 8 MB.");
      setUploading(false);
      return;
    }
    const ins = await db().from("progress_photos").insert({ client_id: meId, day: today(), view, path });
    setUploading(false);
    if (ins.error) setErr("Photo uploaded but could not be saved. Try again.");
    photos.reload();
  }

  const weights = (checkins.data ?? []).filter((c) => c.weight_kg !== null);
  const [latest, prev] = ms.data ?? [];

  return (
    <>
      <PageHead title="Progress" sub="Your weight, measurements and photos." />
      {err ? <div className="mb-4"><ErrorNote message={err} /></div> : null}
      <div className="grid gap-6 md:grid-cols-2">
        <section className={`${card} md:col-span-2`}>
          <H right={weights.length ? <span className="text-sm font-semibold tabular-nums text-[#6B665C]">{Number(weights[weights.length - 1].weight_kg).toFixed(1)} kg now</span> : null}>Weight</H>
          {checkins.loading ? <Loading rows={2} /> : <WeightLine points={weights.map((c) => Number(c.weight_kg))} label={`Weight across ${weights.length} check-ins`} />}
        </section>

        <section className={card}>
          <H right={<button onClick={() => setMOpen(true)} className={linkBtn}>Add</button>}>Body measurements</H>
          {ms.loading ? <Loading /> : !latest ? <p className="text-[15px] text-[#6B665C]">Add your first set of measurements.</p> : (
            <>
              <p className="mb-2 text-xs font-semibold text-[#6B665C]">{dayLong(latest.day)}</p>
              <ul className="divide-y divide-[#EFEBDF]">
                {MEASURES.filter(([k]) => latest[k] !== null).map(([k, label]) => {
                  const now = Number(latest[k]);
                  const before = prev && prev[k] !== null ? Number(prev[k]) : null;
                  const diff = before === null ? null : now - before;
                  return (
                    <li key={k} className="flex items-center justify-between py-2.5 text-[15px]">
                      <span className="font-semibold">{label}</span>
                      <span className="tabular-nums">{now} cm{diff ? <span className="ml-2 text-sm text-[#6B665C]">{diff > 0 ? "+" : "−"}{Math.abs(diff).toFixed(1)}</span> : null}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className={card}>
          <H>Progress photos</H>
          <div className="mb-4 flex gap-2">
            <Select label="View" value={view} onChange={(e) => setView(e.target.value as Photo["view"])}>
              <option value="front">Front</option><option value="side">Side</option><option value="back">Back</option>
            </Select>
            <div className="flex items-end">
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose photo" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
              <button onClick={() => file.current?.click()} disabled={uploading} className={`${primaryBtn} mb-0 !h-12`}>{uploading ? "Uploading" : "Upload"}</button>
            </div>
          </div>
          {photos.loading ? <Loading /> : (photos.data ?? []).length === 0 ? <p className="text-[15px] text-[#6B665C]">No photos yet.</p> : (
            <ul className="grid grid-cols-3 gap-2">
              {photos.data!.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-xl bg-[#EFEBDF]">
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={`${p.view} photo, ${dayLong(p.day)}`} className="aspect-[3/4] w-full object-cover" />
                  ) : <div className="aspect-[3/4]" />}
                  <p className="px-2 py-1 text-[11px] font-semibold capitalize text-[#6B665C]">{p.view} · {p.day.slice(5)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {mOpen ? <MeasurementSheet meId={meId} onClose={() => setMOpen(false)} onSaved={ms.reload} /> : null}
    </>
  );
}

export function useScrollTop(dep: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [dep]);
}
