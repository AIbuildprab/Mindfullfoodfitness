"use client";

import { useState } from "react";
import { addDays, ago, dateOf, dayLong, dayNum, dayShort, timeOf, today, weekDays, weeksSince } from "@/lib/data/dates";
import { db, must, useQuery } from "@/lib/data/hooks";
import type { Checkin, Details, Habit, Meal, Message, Session, Workout } from "@/lib/data/types";
import { card, Check, ErrorNote, goldBtn, H, linkBtn, Loading, primaryBtn, softBtn, WeightLine } from "../light";
import { MealSheet, WorkoutSheet } from "./Sheets";

type Go = (tab: string, view?: string) => void;
const iconSvg = "h-4 w-4";

export function CalorieRing({ now, goal }: { now: number; goal: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(now / goal, 1) : 0;
  const left = goal - now;
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`${now} of ${goal} calories eaten`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#EFEBDF" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="#86712F" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums leading-none">{Math.abs(left)}</span>
        <span className="mt-1 text-xs font-semibold text-[#6B665C]">kcal {left >= 0 ? "left" : "over"}</span>
      </div>
    </div>
  );
}

export const sumMeals = (ms: Meal[]) =>
  ms.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.protein_g, c: a.c + m.carbs_g, f: a.f + m.fat_g }), { kcal: 0, p: 0, c: 0, f: 0 });

export function Macros({ meals, d }: { meals: Meal[]; d: Details | null }) {
  const t = sumMeals(meals);
  const rows = [
    { label: "Protein", now: t.p, goal: d?.protein_target },
    { label: "Carbs", now: t.c, goal: d?.carbs_target },
    { label: "Fat", now: t.f, goal: d?.fat_target },
  ];
  return (
    <div className="space-y-3.5">
      {rows.map((m) => (
        <div key={m.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-bold">{m.label}</span>
            <span className="tabular-nums text-[#6B665C]">{m.now}{m.goal ? ` / ${m.goal}` : ""}g</span>
          </div>
          <div className="h-2 rounded-full bg-[#EFEBDF]">
            <div className="h-full rounded-full bg-[#0B0B0C]" style={{ width: `${m.goal ? Math.min(100, (m.now / m.goal) * 100) : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Home({ meId, name, go, version, onCheckIn }: { meId: string; name: string; go: Go; version: number; onCheckIn: () => void }) {
  const todayStr = today();
  const [day, setDay] = useState(todayStr);
  const [mealOpen, setMealOpen] = useState(false);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [bump, setBump] = useState(0);
  const days = weekDays(todayStr);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const week = useQuery(async () => {
    const r = await db().from("workouts").select("*").eq("client_id", meId).gte("scheduled_on", days[0]).lte("scheduled_on", days[6]).order("scheduled_on");
    return must(r) as Workout[];
  }, [meId, bump]);

  const details = useQuery(async () => must(await db().from("client_details").select("*").eq("client_id", meId).maybeSingle()) as Details | null, [meId]);

  const meals = useQuery(async () => must(await db().from("meals").select("*").eq("client_id", meId).eq("day", day).order("created_at")) as Meal[], [meId, day, bump]);

  const habits = useQuery(async () => {
    const supabase = db();
    const [h, l] = await Promise.all([
      supabase.from("habits").select("*").eq("client_id", meId).eq("active", true).order("sort"),
      supabase.from("habit_logs").select("habit_id").eq("client_id", meId).eq("day", day),
    ]);
    return { habits: must(h) as Habit[], done: new Set((must(l) as { habit_id: string }[]).map((x) => x.habit_id)) };
  }, [meId, day, bump]);

  const checkins = useQuery(async () => must(await db().from("checkins").select("*").eq("client_id", meId).gte("day", addDays(todayStr, -56)).order("day")) as Checkin[], [meId, version]);

  const coachMsg = useQuery(async () => {
    const r = await db().from("messages").select("*").eq("client_id", meId).neq("sender_id", meId).order("created_at", { ascending: false }).limit(1);
    return (must(r) as Message[])[0] ?? null;
  }, [meId, version]);

  const next = useQuery(async () => {
    const r = await db().from("sessions").select("*").eq("client_id", meId).in("status", ["requested", "confirmed"]).gt("starts_at", new Date().toISOString()).order("starts_at").limit(1);
    return (must(r) as Session[])[0] ?? null;
  }, [meId, bump]);

  async function toggleHabit(id: string, on: boolean) {
    const s = db();
    if (on) await s.from("habit_logs").delete().eq("habit_id", id).eq("day", day);
    else await s.from("habit_logs").upsert({ habit_id: id, client_id: meId, day }, { onConflict: "habit_id,day" });
    habits.reload();
  }

  async function deleteMeal(id: string) {
    await db().from("meals").delete().eq("id", id);
    meals.reload();
  }

  const planned = week.data ?? [];
  const todays = planned.filter((w) => w.scheduled_on === day);
  const doneCount = planned.filter((w) => w.completed_at).length;
  const d = details.data;
  const eaten = sumMeals(meals.data ?? []);
  const weights = (checkins.data ?? []).filter((c) => c.weight_kg !== null).map((c) => Number(c.weight_kg));
  const checkedToday = (checkins.data ?? []).some((c) => c.day === todayStr);
  const checkinDays = new Set((checkins.data ?? []).map((c) => c.day));
  let streak = 0;
  for (let t = checkinDays.has(todayStr) ? todayStr : addDays(todayStr, -1); checkinDays.has(t); t = addDays(t, -1)) streak++;
  const delta = weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">{greeting}, {name}</h1>
          <p className="mt-1.5 text-[15px] text-[#6B665C]">
            {d ? `Week ${weeksSince(d.start_date)} of your ${d.phase} phase. ` : ""}
            {planned.length ? `${doneCount} of ${planned.length} sessions done this week.` : "No sessions planned this week yet."}
          </p>
        </div>
        {streak > 0 ? (
          <span className="inline-flex h-9 items-center rounded-full bg-[#E4D18B]/55 px-4 text-sm font-bold text-[#4d4015]">{streak}-day check-in streak</span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className={card} aria-label="This week">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {days.map((dt) => {
                const on = day === dt;
                const ws = planned.filter((w) => w.scheduled_on === dt);
                const done = ws.length > 0 && ws.every((w) => w.completed_at);
                return (
                  <button
                    key={dt}
                    onClick={() => setDay(dt)}
                    aria-pressed={on}
                    aria-label={`${dayLong(dt)}${ws.length ? (done ? ", workout done" : ", workout planned") : ""}`}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition ${on ? "bg-[#0B0B0C] text-white" : "text-[#6B665C] hover:bg-[#F6F4EF]"}`}
                  >
                    {dayShort(dt)}
                    <span className={`text-lg font-extrabold tabular-nums ${on ? "text-white" : "text-[#0B0B0C]"}`}>{dayNum(dt)}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-[#86712F]" : ws.length ? (on ? "bg-white/60" : "bg-[#86712F]/40") : on ? "bg-white/20" : "bg-[#DDD7C7]"}`} aria-hidden />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-[#0B0B0C] p-6 text-white sm:p-8" aria-label="Workout">
            {week.loading ? (
              <p className="py-10 text-white/60">Loading your plan</p>
            ) : week.error ? (
              <ErrorNote message={week.error} onRetry={week.reload} />
            ) : todays.length === 0 ? (
              <div className="py-4">
                <p className="text-sm font-semibold text-[#E4D18B]">{dayLong(day)}</p>
                <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.5rem]">{day === todayStr ? "Rest day" : "Nothing planned"}</h2>
                <p className="mt-2 max-w-md text-[15px] text-white/70">No workout is scheduled for this day. Log your meals, hit your habits and message Paul if you want to add a session.</p>
              </div>
            ) : (
              todays.map((w) => (
                <div key={w.id} className="[&+&]:mt-8 [&+&]:border-t [&+&]:border-white/10 [&+&]:pt-8">
                  <p className="text-sm font-semibold text-[#E4D18B]">{dayLong(day)} · Workout{w.completed_at ? " · Done" : ""}</p>
                  <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.5rem]">{w.name}</h2>
                  <p className="mt-2 text-[15px] text-white/70">
                    {w.duration_min ? `${w.duration_min} min · ` : ""}{w.exercises.length} exercises
                  </p>
                  {w.exercises.length ? (
                    <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                      {w.exercises.map((e, i) => (
                        <li key={e.name + i} className="flex items-center justify-between py-3 text-[15px]">
                          <span className="font-semibold">{e.name}</span>
                          <span className="tabular-nums text-white/70">{e.sets} × {e.reps}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setWorkout(w)} className={goldBtn}>{w.completed_at ? "View or log again" : "Start workout"}</button>
                    <button onClick={() => go("training")} className="inline-flex h-11 items-center rounded-full border border-white/25 px-5 text-sm font-bold text-white transition hover:bg-white/10">View plan</button>
                  </div>
                </div>
              ))
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className={card} aria-label="Meals">
              <H right={<button onClick={() => setMealOpen(true)} className={linkBtn}>Log meal</button>}>Meals</H>
              {meals.loading ? <Loading rows={3} /> : meals.error ? <ErrorNote message={meals.error} onRetry={meals.reload} /> : (meals.data ?? []).length === 0 ? (
                <p className="text-[15px] text-[#6B665C]">Nothing logged for {day === todayStr ? "today" : dayLong(day)}.</p>
              ) : (
                <ul className="divide-y divide-[#EFEBDF]">
                  {(meals.data ?? []).map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <Check on />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold">{m.slot}</p>
                        <p className="truncate text-sm text-[#6B665C]">{m.description || "No description"}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[#4A463E]">{m.kcal} kcal</span>
                      <button onClick={() => deleteMeal(m.id)} aria-label={`Delete ${m.slot}`} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8577] hover:bg-[#F6F4EF] hover:text-[#0B0B0C]">
                        <svg viewBox="0 0 24 24" className={iconSvg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card} aria-label="Habits">
              <H right={habits.data ? <span className="text-sm font-semibold text-[#6B665C]">{habits.data.done.size} of {habits.data.habits.length}</span> : null}>Habits</H>
              {habits.loading ? <Loading rows={3} /> : habits.error ? <ErrorNote message={habits.error} onRetry={habits.reload} /> : (habits.data?.habits ?? []).length === 0 ? (
                <p className="text-[15px] text-[#6B665C]">Paul will set your daily habits.</p>
              ) : (
                <ul className="divide-y divide-[#EFEBDF]">
                  {habits.data!.habits.map((h) => {
                    const on = habits.data!.done.has(h.id);
                    return (
                      <li key={h.id}>
                        <button onClick={() => toggleHabit(h.id, on)} aria-pressed={on} className="flex min-h-12 w-full items-center gap-3 py-2 text-left">
                          <Check on={on} />
                          <span className={`text-[15px] font-semibold ${on ? "text-[#6B665C] line-through decoration-[#CFC8B6]" : ""}`}>{h.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className={card} aria-label="Nutrition">
            <H right={<span className="text-sm font-semibold text-[#6B665C]">{day === todayStr ? "Today" : dayShort(day)}</span>}>Nutrition</H>
            {d?.kcal_target ? (
              <div className="flex items-center gap-5">
                <CalorieRing now={eaten.kcal} goal={d.kcal_target} />
                <div className="min-w-0 text-sm">
                  <p className="text-[#6B665C]">Eaten</p>
                  <p className="text-xl font-extrabold tabular-nums">{eaten.kcal.toLocaleString("en-GB")}</p>
                  <p className="mt-2 text-[#6B665C]">Target</p>
                  <p className="text-xl font-extrabold tabular-nums">{d.kcal_target.toLocaleString("en-GB")}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-extrabold tabular-nums">{eaten.kcal.toLocaleString("en-GB")} <span className="text-base font-semibold text-[#6B665C]">kcal eaten</span></p>
                <p className="mt-1 text-sm text-[#6B665C]">Paul has not set your calorie target yet.</p>
              </div>
            )}
            <div className="mt-6"><Macros meals={meals.data ?? []} d={d} /></div>
            <button onClick={onCheckIn} disabled={checkedToday} className={`${softBtn} mt-6 w-full`}>{checkedToday ? "Checked in today" : "Log today’s check-in"}</button>
          </section>

          <section className={card} aria-label="Message from Paul">
            <H right={<button onClick={() => go("messages")} className={linkBtn}>Open chat</button>}>Paul</H>
            {coachMsg.loading ? <Loading rows={2} /> : coachMsg.data ? (
              <>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B0B0C] text-sm font-bold text-[#E4D18B]">P</span>
                  <p className="line-clamp-4 rounded-2xl rounded-tl-md bg-[#F6F4EF] px-4 py-3 text-[15px] leading-relaxed">{coachMsg.data.body}</p>
                </div>
                <p className="mt-2 pl-[52px] text-xs text-[#6B665C]">{ago(coachMsg.data.created_at)}</p>
              </>
            ) : (
              <p className="text-[15px] text-[#6B665C]">No messages from Paul yet.</p>
            )}
            <button onClick={() => go("messages")} className={`${softBtn} mt-4 w-full`}>{coachMsg.data ? "Reply" : "Message Paul"}</button>
          </section>

          <section className={card} aria-label="Weight">
            <H right={<button onClick={() => go("progress")} className={linkBtn}>Details</button>}>Weight</H>
            {checkins.loading ? <Loading rows={2} /> : weights.length === 0 ? (
              <p className="text-[15px] text-[#6B665C]">Add your weight in a check-in to start your trend.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tabular-nums tracking-tight">{weights[weights.length - 1].toFixed(1)}</span>
                  <span className="text-sm font-semibold text-[#6B665C]">kg</span>
                  {weights.length > 1 ? <span className={`ml-auto text-sm font-bold ${delta <= 0 ? "text-[#2F6B3F]" : "text-[#4A463E]"}`}>{delta > 0 ? "+" : "−"}{Math.abs(delta).toFixed(1)} kg</span> : null}
                </div>
                <div className="mt-3"><WeightLine points={weights} label={`Weight trend over ${weights.length} check-ins`} /></div>
              </>
            )}
          </section>

          <section className={card} aria-label="Next session">
            <H>Next session</H>
            {next.loading ? <Loading rows={2} /> : next.data ? (
              <>
                <p className="text-[15px] font-bold">{dateOf(next.data.starts_at)} · {timeOf(next.data.starts_at)}</p>
                <p className="mt-0.5 text-sm text-[#6B665C]">{next.data.title} · {next.data.status === "confirmed" ? "Confirmed" : "Waiting for Paul to confirm"}</p>
                <button onClick={() => go("schedule")} className={`${softBtn} mt-4 w-full`}>Manage</button>
              </>
            ) : (
              <>
                <p className="text-[15px] text-[#6B665C]">No session booked.</p>
                <button onClick={() => go("schedule")} className={`${primaryBtn} mt-4 w-full`}>Book a session</button>
              </>
            )}
          </section>
        </div>
      </div>

      {mealOpen ? <MealSheet meId={meId} day={day} onClose={() => setMealOpen(false)} onSaved={() => setBump((b) => b + 1)} /> : null}
      {workout ? <WorkoutSheet meId={meId} workout={workout} onClose={() => setWorkout(null)} onSaved={() => setBump((b) => b + 1)} /> : null}
    </div>
  );
}
