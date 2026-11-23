"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, type ReactNode } from "react";
import { clientNav, clientTabIds } from "@/lib/dashboard-nav";
import { ClientShell, Sheet } from "./ClientShell";

/*
  Client dashboard. Light, top-nav, card grid, Trainerize-style home.
  All figures below are SAMPLE DATA until the plan / logging tables are wired to Supabase.
*/

const WEEK = [
  { d: "Mon", n: 23, done: true },
  { d: "Tue", n: 24, done: true },
  { d: "Wed", n: 25, done: false },
  { d: "Thu", n: 26, done: false },
  { d: "Fri", n: 27, done: false },
  { d: "Sat", n: 28, done: false },
  { d: "Sun", n: 29, done: false },
];
const TODAY_INDEX = 0;

const EXERCISES = [
  { name: "Back squat", sets: "4 × 6" },
  { name: "Romanian deadlift", sets: "3 × 8" },
  { name: "Walking lunge", sets: "3 × 12" },
  { name: "Leg curl", sets: "3 × 12" },
  { name: "Calf raise", sets: "3 × 15" },
];

const MEALS = [
  { name: "Breakfast", detail: "Oats, whey, blueberries", kcal: 520, logged: true },
  { name: "Lunch", detail: "Chicken, rice, greens", kcal: 640, logged: true },
  { name: "Dinner", detail: "Not logged yet", kcal: 0, logged: false },
];

const MACROS = [
  { label: "Protein", now: 118, goal: 160, unit: "g" },
  { label: "Carbs", now: 150, goal: 220, unit: "g" },
  { label: "Fat", now: 38, goal: 65, unit: "g" },
];

const CALORIES = { now: 1160, goal: 2100 };
const WEIGHT = [84.6, 84.2, 84.3, 83.9, 83.6, 83.4, 83.1];

export const card = "rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(11,11,12,0.05),0_8px_24px_-12px_rgba(11,11,12,0.12)] sm:p-6";
export const primaryBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#0B0B0C] px-6 text-sm font-bold text-white transition hover:bg-[#2a2a2a] active:scale-[0.98]";
export const goldBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#E4D18B] px-6 text-sm font-bold text-[#0B0B0C] transition hover:bg-[#EBDDA5] active:scale-[0.98]";
export const softBtn =
  "inline-flex h-11 items-center justify-center rounded-full border border-[#D9D3C3] bg-white px-5 text-sm font-bold text-[#0B0B0C] transition hover:border-[#86712F] active:scale-[0.98]";

export function H({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-extrabold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
        on ? "border-[#86712F] bg-[#86712F]" : "border-[#CFC8B6] bg-white"
      }`}
      aria-hidden
    >
      {on ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      ) : null}
    </span>
  );
}

function CalorieRing({ now, goal }: { now: number; goal: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(now / goal, 1);
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`${now} of ${goal} calories eaten`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#EFEBDF" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#86712F"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums leading-none">{goal - now}</span>
        <span className="mt-1 text-xs font-semibold text-[#6B665C]">kcal left</span>
      </div>
    </div>
  );
}

function WeightLine() {
  const w = 240;
  const h = 64;
  const min = Math.min(...WEIGHT) - 0.3;
  const max = Math.max(...WEIGHT) + 0.3;
  const pts = WEIGHT.map((v, i) => [(i / (WEIGHT.length - 1)) * w, h - ((v - min) / (max - min)) * h]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} className="h-16 w-full" role="img" aria-label="Weight trend, down 1.5 kg over 7 weeks">
      <path d={d} fill="none" stroke="#0B0B0C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill="#86712F" />
    </svg>
  );
}

function Home({ name, onCheckIn, go }: { name: string; onCheckIn: () => void; go: (t: string, v?: string) => void }) {
  const [day, setDay] = useState(TODAY_INDEX);
  const [habits, setHabits] = useState([
    { label: "Drink 3L water", on: true },
    { label: "8,000 steps", on: false },
    { label: "7+ hours sleep", on: false },
    { label: "No alcohol", on: true },
  ]);
  const doneHabits = habits.filter((h) => h.on).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
            {greeting}, {name}
          </h1>
          <p className="mt-1.5 text-[15px] text-[#6B665C]">Week 7 of your Build phase. Two sessions done, two to go.</p>
        </div>
        <span className="inline-flex h-9 items-center rounded-full bg-[#E4D18B]/55 px-4 text-sm font-bold text-[#4d4015]">
          12-day streak
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <section className={card} aria-label="This week">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {WEEK.map((w, i) => {
                const on = day === i;
                return (
                  <button
                    key={w.d}
                    onClick={() => setDay(i)}
                    aria-pressed={on}
                    aria-label={`${w.d} ${w.n}${w.done ? ", workout done" : ""}`}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition ${
                      on ? "bg-[#0B0B0C] text-white" : "text-[#6B665C] hover:bg-[#F6F4EF]"
                    }`}
                  >
                    {w.d}
                    <span className={`text-lg font-extrabold tabular-nums ${on ? "text-white" : "text-[#0B0B0C]"}`}>{w.n}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${w.done ? "bg-[#86712F]" : on ? "bg-white/30" : "bg-[#DDD7C7]"}`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-[#0B0B0C] p-6 text-white sm:p-8" aria-label="Today's workout">
            <p className="text-sm font-semibold text-[#E4D18B]">{WEEK[day].d} · Workout</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.5rem]">Lower body strength</h2>
            <p className="mt-2 text-[15px] text-white/70">55 min · {EXERCISES.length} exercises · with Paul’s coaching notes</p>
            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {EXERCISES.map((e) => (
                <li key={e.name} className="flex items-center justify-between py-3 text-[15px]">
                  <span className="font-semibold">{e.name}</span>
                  <span className="tabular-nums text-white/70">{e.sets}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => go("training")} className={goldBtn}>Start workout</button>
              <button onClick={() => go("training")} className="inline-flex h-11 items-center rounded-full border border-white/25 px-5 text-sm font-bold text-white transition hover:bg-white/10">
                View plan
              </button>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className={card} aria-label="Meals">
              <H right={<button onClick={() => go("nutrition")} className="text-sm font-bold text-[#86712F] hover:underline">Open</button>}>
                Meals
              </H>
              <ul className="divide-y divide-[#EFEBDF]">
                {MEALS.map((m) => (
                  <li key={m.name} className="flex items-center gap-3 py-3">
                    <Check on={m.logged} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">{m.name}</p>
                      <p className="truncate text-sm text-[#6B665C]">{m.detail}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[#4A463E]">{m.logged ? `${m.kcal} kcal` : "Log"}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={card} aria-label="Habits">
              <H right={<span className="text-sm font-semibold text-[#6B665C]">{doneHabits} of {habits.length}</span>}>Habits</H>
              <ul className="divide-y divide-[#EFEBDF]">
                {habits.map((h, i) => (
                  <li key={h.label}>
                    <button
                      onClick={() => setHabits((hs) => hs.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                      aria-pressed={h.on}
                      className="flex min-h-12 w-full items-center gap-3 py-2 text-left"
                    >
                      <Check on={h.on} />
                      <span className={`text-[15px] font-semibold ${h.on ? "text-[#6B665C] line-through decoration-[#CFC8B6]" : ""}`}>{h.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <section className={card} aria-label="Nutrition">
            <H right={<span className="text-sm font-semibold text-[#6B665C]">Today</span>}>Nutrition</H>
            <div className="flex items-center gap-5">
              <CalorieRing {...CALORIES} />
              <div className="min-w-0 text-sm">
                <p className="text-[#6B665C]">Eaten</p>
                <p className="text-xl font-extrabold tabular-nums">{CALORIES.now.toLocaleString("en-GB")}</p>
                <p className="mt-2 text-[#6B665C]">Target</p>
                <p className="text-xl font-extrabold tabular-nums">{CALORIES.goal.toLocaleString("en-GB")}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3.5">
              {MACROS.map((m) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-bold">{m.label}</span>
                    <span className="tabular-nums text-[#6B665C]">{m.now} / {m.goal}{m.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EFEBDF]">
                    <div className="h-full rounded-full bg-[#0B0B0C]" style={{ width: `${(m.now / m.goal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onCheckIn} className={`${softBtn} mt-6 w-full`}>Log today’s check-in</button>
          </section>

          <section className={card} aria-label="Message from Paul">
            <H right={<button onClick={() => go("messages")} className="text-sm font-bold text-[#86712F] hover:underline">Open chat</button>}>
              Paul
            </H>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B0B0C] text-sm font-bold text-[#E4D18B]">P</span>
              <p className="rounded-2xl rounded-tl-md bg-[#F6F4EF] px-4 py-3 text-[15px] leading-relaxed">
                Nice work on Tuesday’s session. Keep the squat tempo slow today and send me a quick video of your last set.
              </p>
            </div>
            <button onClick={() => go("messages")} className={`${softBtn} mt-4 w-full`}>Reply</button>
          </section>

          <section className={card} aria-label="Progress">
            <H right={<button onClick={() => go("progress")} className="text-sm font-bold text-[#86712F] hover:underline">Details</button>}>
              Weight
            </H>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tabular-nums tracking-tight">{WEIGHT[WEIGHT.length - 1].toFixed(1)}</span>
              <span className="text-sm font-semibold text-[#6B665C]">kg</span>
              <span className="ml-auto text-sm font-bold text-[#2F6B3F]">−1.5 kg in 7 weeks</span>
            </div>
            <div className="mt-3"><WeightLine /></div>
          </section>

          <section className={card} aria-label="Next session">
            <H>Next session</H>
            <p className="text-[15px] font-bold">Thursday 26 Nov · 18:00</p>
            <p className="mt-0.5 text-sm text-[#6B665C]">1-to-1 with Paul · Leicester</p>
            <button onClick={() => go("schedule")} className={`${softBtn} mt-4 w-full`}>Reschedule</button>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">{title}</h1>
      {sub ? <p className="mt-1.5 text-[15px] text-[#6B665C]">{sub}</p> : null}
    </div>
  );
}

export function Tabs({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="mb-6 inline-flex rounded-full bg-[#EAE5D8] p-1">
      {items.map((i) => (
        <button
          key={i.id}
          role="tab"
          aria-selected={value === i.id}
          onClick={() => onChange(i.id)}
          className={`h-10 rounded-full px-5 text-sm font-bold transition ${value === i.id ? "bg-white shadow-sm" : "text-[#4A463E] hover:text-[#0B0B0C]"}`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className={`${card} flex min-h-[260px] flex-col items-center justify-center text-center`}>
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mt-1.5 max-w-xs text-[15px] text-[#6B665C]">{text}</p>
    </div>
  );
}

const SLOTS = ["07:00", "09:00", "12:30", "17:30", "18:30"];

function Schedule() {
  const [pick, setPick] = useState<string | null>("Thu-18:30");
  return (
    <>
      <PageHead title="Book a session" sub="Pick a time from Paul’s availability." />
      <div className={card}>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {WEEK.map((w) => (
            <div key={w.d} className="space-y-1.5 sm:space-y-2">
              <p className="pb-1 text-center text-xs font-bold text-[#6B665C]">
                {w.d}
                <span className="block text-base text-[#0B0B0C]">{w.n}</span>
              </p>
              {SLOTS.map((s) => {
                const id = `${w.d}-${s}`;
                const on = pick === id;
                return (
                  <button
                    key={id}
                    onClick={() => setPick(id)}
                    aria-pressed={on}
                    className={`h-10 w-full rounded-xl border text-[11px] font-bold tabular-nums transition sm:text-xs ${
                      on ? "border-[#0B0B0C] bg-[#0B0B0C] text-white" : "border-[#E7E3D9] bg-[#FBFAF6] text-[#4A463E] hover:border-[#86712F]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEBDF] pt-5">
          <p className="text-sm text-[#6B665C]">{pick ? `Selected: ${pick.replace("-", " at ")}` : "Choose a time"}</p>
          <button disabled={!pick} className={`${primaryBtn} disabled:opacity-40`}>Request session</button>
        </div>
      </div>
    </>
  );
}

function Messages({ onBack }: { onBack: () => void }) {
  const [msgs, setMsgs] = useState([
    { me: false, t: "Nice work on Tuesday’s session. Keep the squat tempo slow today." },
    { me: true, t: "Will do. Legs are still sore from Tuesday!" },
    { me: false, t: "Good sign. Send me a quick video of your last set." },
  ]);
  const [text, setText] = useState("");
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white sm:rounded-3xl sm:shadow-[0_8px_24px_-12px_rgba(11,11,12,0.15)]">
      <div className="flex items-center gap-3 border-b border-[#EFEBDF] px-4 py-3">
        <button onClick={onBack} aria-label="Back to Home" className="flex h-9 w-9 items-center justify-center rounded-full text-[#4A463E] hover:bg-[#F6F4EF]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0C] text-sm font-bold text-[#E4D18B]">P</span>
        <div>
          <p className="text-[15px] font-extrabold leading-tight">Paul McGann</p>
          <p className="text-xs text-[#6B665C]">Your coach</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
              m.me ? "ml-auto rounded-tr-md bg-[#0B0B0C] text-white" : "rounded-tl-md bg-[#F6F4EF]"
            }`}
          >
            {m.t}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setMsgs((m) => [...m, { me: true, t: text.trim() }]);
          setText("");
        }}
        className="safe-bottom flex gap-2 border-t border-[#EFEBDF] p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message Paul"
          className="h-11 min-w-0 flex-1 rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-[15px] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]"
        />
        <button className={primaryBtn}>Send</button>
      </form>
    </div>
  );
}

function Progress() {
  return (
    <>
      <PageHead title="Progress" sub="Your monthly report and trends." />
      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${card} md:col-span-2`}>
          <H>Weight</H>
          <WeightLine />
        </div>
        <EmptyCard title="Body measurements" text="Add your first set of measurements at your next check-in." />
        <EmptyCard title="Progress photos" text="Front, side and back photos appear here once uploaded." />
      </div>
    </>
  );
}

function CheckIn({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Daily check-in" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="space-y-4">
        {["Weight (kg)", "Steps", "Sleep (hours)"].map((f) => (
          <label key={f} className="block text-sm font-bold text-[#4A463E]">
            {f}
            <input
              inputMode="decimal"
              className="mt-1.5 h-12 w-full rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-base font-normal text-[#0B0B0C] outline-none focus:border-[#86712F]"
            />
          </label>
        ))}
        <button className={`${primaryBtn} w-full`}>Save check-in</button>
      </form>
    </Sheet>
  );
}

function Inner({ name }: { name: string }) {
  const params = useSearchParams();
  const tabParam = params.get("tab") ?? "home";
  const tab = clientTabIds.includes(tabParam) ? tabParam : "home";
  const view = params.get("view") ?? "";
  const [checkIn, setCheckIn] = useState(params.get("checkin") === "1");
  const [, force] = useState(0);

  // In-app tab changes use replaceState so Next does not re-run the route.
  const go = useCallback((t: string, v?: string) => {
    const q = new URLSearchParams();
    if (t !== "home") q.set("tab", t);
    if (v) q.set("view", v);
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `/dashboard?${qs}` : "/dashboard");
    force((n) => n + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const current = typeof window === "undefined" ? new URLSearchParams(params.toString()) : new URLSearchParams(window.location.search);
  const liveTab = clientTabIds.includes(current.get("tab") ?? "home") ? (current.get("tab") ?? "home") : "home";
  const liveView = current.get("view") ?? view;
  const activeTab = typeof window === "undefined" ? tab : liveTab;

  const body: Record<string, ReactNode> = {
    home: <Home name={name} onCheckIn={() => setCheckIn(true)} go={go} />,
    schedule: <Schedule />,
    messages: <Messages onBack={() => go("home")} />,
    training: (
      <>
        <PageHead title="Training" sub="Your programme and workout history." />
        <Tabs
          items={[{ id: "plan", label: "My plan" }, { id: "log", label: "My log" }]}
          value={liveView === "log" ? "log" : "plan"}
          onChange={(v) => go("training", v === "log" ? "log" : undefined)}
        />
        <EmptyCard
          title={liveView === "log" ? "No sessions logged yet" : "No plan yet"}
          text={liveView === "log" ? "Finished workouts will show up here." : "Paul will add your programme soon."}
        />
      </>
    ),
    nutrition: (
      <>
        <PageHead title="Nutrition" sub="Your targets and food list." />
        <Tabs
          items={[{ id: "plan", label: "My plan" }, { id: "food-list", label: "Food list" }]}
          value={liveView === "food-list" ? "food-list" : "plan"}
          onChange={(v) => go("nutrition", v === "food-list" ? "food-list" : undefined)}
        />
        <EmptyCard
          title={liveView === "food-list" ? "No food list yet" : "No plan yet"}
          text="Paul will add this soon."
        />
      </>
    ),
    progress: <Progress />,
  };

  return (
    <>
      <ClientShell
        items={clientNav}
        active={activeTab}
        onSelect={(t) => go(t)}
        name={name}
        action={{ label: "Check-in", onClick: () => setCheckIn(true) }}
        chat={activeTab === "messages"}
      >
        {body[activeTab]}
      </ClientShell>
      {checkIn ? <CheckIn onClose={() => setCheckIn(false)} /> : null}
    </>
  );
}

export function ClientDashboard({ name }: { name: string }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F6F4EF]" />}>
      <Inner name={name} />
    </Suspense>
  );
}
