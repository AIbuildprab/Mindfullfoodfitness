"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, type ReactNode } from "react";
import { coachNav, coachViewIds } from "@/lib/dashboard-nav";
import { card, EmptyCard, goldBtn, H, PageHead, primaryBtn, softBtn } from "./ClientDashboard";
import { ClientShell, Sheet } from "./ClientShell";

/*
  Coach workspace. Same light shell as the client app.
  Every client, figure and message here is SAMPLE DATA until Supabase is wired in.
*/

type Client = {
  id: string;
  name: string;
  type: "Online" | "In person";
  phase: string;
  week: string;
  adherence: number;
  last: string;
  flag?: string;
};

const CLIENTS: Client[] = [
  { id: "1", name: "Sam Okafor", type: "In person", phase: "Build", week: "Week 7", adherence: 92, last: "Today, 07:40" },
  { id: "2", name: "Priya Shah", type: "Online", phase: "Cut", week: "Week 3", adherence: 61, last: "3 days ago", flag: "No check-in for 3 days" },
  { id: "3", name: "Dan Whitfield", type: "Online", phase: "Build", week: "Week 11", adherence: 84, last: "Yesterday" },
  { id: "4", name: "Hannah Lowe", type: "In person", phase: "Foundations", week: "Week 1", adherence: 100, last: "Today, 06:15", flag: "New client, plan not assigned" },
  { id: "5", name: "Marcus Bell", type: "Online", phase: "Maintain", week: "Week 14", adherence: 73, last: "2 days ago" },
];

const SESSIONS = [
  { time: "07:00", who: "Sam Okafor", what: "Lower body strength" },
  { time: "09:00", who: "Hannah Lowe", what: "Intro session" },
  { time: "17:30", who: "Open slot", what: "Available to book" },
  { time: "18:30", who: "Dan Whitfield", what: "Upper body, form check" },
];

const TEMPLATES = {
  nutrition: [
    { t: "Lean build, 2,400 kcal", d: "Training and rest day targets, 4 meals" },
    { t: "Cut, 1,900 kcal", d: "High protein, flexible carbs" },
    { t: "Maintenance, 2,200 kcal", d: "Balanced split, weekend allowance" },
  ],
  workouts: [
    { t: "Lower body strength", d: "5 exercises, 55 min" },
    { t: "Upper push and pull", d: "6 exercises, 50 min" },
    { t: "Full body foundations", d: "6 exercises, 45 min" },
  ],
};

const clientSections = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Progress" },
  { id: "nutrition", label: "Nutrition" },
  { id: "workouts", label: "Workouts" },
  { id: "check-ins", label: "Check-ins" },
  { id: "account", label: "Account" },
];

type Nav = (q: { view?: string; client?: string; section?: string }) => void;

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#EFEBDF] text-xs font-extrabold text-[#4A463E]"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-[#EFEBDF]" role="img" aria-label={`${pct}% plan adherence`}>
      <div className={`h-full rounded-full ${pct < 70 ? "bg-[#C9772B]" : "bg-[#0B0B0C]"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Overview({ nav, invite }: { nav: Nav; invite: () => void }) {
  const attention = CLIENTS.filter((c) => c.flag);
  const stats = [
    { n: "5", l: "Active clients" },
    { n: "3", l: "Sessions today" },
    { n: "2", l: "Need attention" },
    { n: "82%", l: "Avg adherence" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">Welcome back, Paul</h1>
          <p className="mt-1.5 text-[15px] text-[#6B665C]">Two clients need you today. Three sessions on the diary.</p>
        </div>
        <button onClick={invite} className={primaryBtn}>Invite client</button>
      </div>

      <section className={`${card} grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-[#EFEBDF]`} aria-label="Summary">
        {stats.map((s) => (
          <div key={s.l} className="sm:px-6 sm:first:pl-0">
            <p className="text-3xl font-extrabold tabular-nums tracking-tight">{s.n}</p>
            <p className="mt-1 text-sm text-[#6B665C]">{s.l}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className={card} aria-label="Needs attention">
            <H>Needs attention</H>
            <ul className="divide-y divide-[#EFEBDF]">
              {attention.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => nav({ view: "clients", client: c.id, section: "overview" })}
                    className="flex min-h-16 w-full items-center gap-3 py-3 text-left"
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold">{c.name}</span>
                      <span className="block truncate text-sm text-[#6B665C]">{c.flag}</span>
                    </span>
                    <span className="text-sm font-bold text-[#86712F]">Open</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={card} aria-label="Clients">
            <H right={<button onClick={() => nav({ view: "clients" })} className="text-sm font-bold text-[#86712F] hover:underline">All clients</button>}>
              Client adherence
            </H>
            <ul className="space-y-4">
              {CLIENTS.map((c) => (
                <li key={c.id} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_180px_1fr_44px]">
                  <Avatar name={c.name} size={36} />
                  <p className="text-[15px] font-bold">{c.name}</p>
                  <div className="col-span-2 sm:col-span-1"><Bar pct={c.adherence} /></div>
                  <p className="hidden text-right text-sm font-bold tabular-nums sm:block">{c.adherence}%</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-label="Today">
            <H right={<button onClick={() => nav({ view: "schedule" })} className="text-sm font-bold text-[#86712F] hover:underline">Schedule</button>}>
              Today
            </H>
            <ul className="space-y-3">
              {SESSIONS.map((s) => (
                <li key={s.time} className="flex gap-4">
                  <span className="w-12 shrink-0 pt-0.5 text-sm font-extrabold tabular-nums">{s.time}</span>
                  <span className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${s.who === "Open slot" ? "border border-dashed border-[#D9D3C3]" : "bg-[#F6F4EF]"}`}>
                    <span className="block text-[15px] font-bold">{s.who}</span>
                    <span className="block text-sm text-[#6B665C]">{s.what}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={card} aria-label="Training log">
            <H>Gym training log</H>
            <p className="text-sm text-[#6B665C]">See what any client logged, set by set.</p>
            <button onClick={() => nav({ view: "training-log" })} className={`${softBtn} mt-4 w-full`}>Open training log</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ClientList({ selected, nav }: { selected: string; nav: Nav }) {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const list = CLIENTS.filter(
    (c) => (filter === "All" || c.type === filter) && c.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <div className={`${card} !p-3 sm:!p-4`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search clients"
        aria-label="Search clients"
        className="mb-3 h-11 w-full rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-[15px] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]"
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", "Online", "In person"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`h-9 rounded-full px-4 text-sm font-bold transition ${filter === f ? "bg-[#0B0B0C] text-white" : "bg-[#F0ECE2] text-[#4A463E] hover:bg-[#E7E2D3]"}`}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="space-y-0.5">
        {list.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => nav({ view: "clients", client: c.id, section: "overview" })}
              aria-current={selected === c.id ? "true" : undefined}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition ${selected === c.id ? "bg-[#F6F4EF]" : "hover:bg-[#FBFAF6]"}`}
            >
              <Avatar name={c.name} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{c.name}</span>
                <span className="block text-xs text-[#6B665C]">{c.type} · {c.phase}</span>
              </span>
              {c.flag ? <span className="h-2.5 w-2.5 rounded-full bg-[#C9772B]" aria-label="Needs attention" /> : null}
            </button>
          </li>
        ))}
        {list.length === 0 ? <li className="px-3 py-6 text-center text-sm text-[#6B665C]">No clients match.</li> : null}
      </ul>
    </div>
  );
}

function ClientWorkspace({ client, section, nav }: { client: Client; section: string; nav: Nav }) {
  return (
    <div>
      <button onClick={() => nav({ view: "clients" })} className="mb-3 inline-flex h-9 items-center gap-1 rounded-full pr-3 text-sm font-bold text-[#4A463E] hover:text-[#0B0B0C] lg:hidden">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
        Clients
      </button>
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={client.name} size={56} />
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{client.name}</h2>
          <p className="text-sm text-[#6B665C]">{client.type} · {client.phase} phase · {client.week}</p>
        </div>
      </div>
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-[#EAE5D8] p-1 [scrollbar-width:none]">
        {clientSections.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            onClick={() => nav({ view: "clients", client: client.id, section: s.id })}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${section === s.id ? "bg-white shadow-sm" : "text-[#4A463E] hover:text-[#0B0B0C]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "overview" ? (
        <div className="space-y-6">
          <section className={`${card} grid grid-cols-3 divide-x divide-[#EFEBDF]`}>
            {[
              { n: `${client.adherence}%`, l: "Adherence" },
              { n: client.week.replace("Week ", ""), l: "Week" },
              { n: client.last.split(",")[0], l: "Last active" },
            ].map((s) => (
              <div key={s.l} className="px-3 first:pl-0 sm:px-6">
                <p className="text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{s.n}</p>
                <p className="mt-1 text-sm text-[#6B665C]">{s.l}</p>
              </div>
            ))}
          </section>
          {client.flag ? (
            <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <p className="text-[15px] font-bold">{client.flag}</p>
                <p className="text-sm text-[#6B665C]">Send a nudge or adjust their plan.</p>
              </div>
              <button onClick={() => nav({ view: "messages", client: client.id })} className={primaryBtn}>Message {client.name.split(" ")[0]}</button>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyCard
          title={`${clientSections.find((s) => s.id === section)?.label ?? "Section"} is empty`}
          text={`${client.name.split(" ")[0]}'s ${section} will appear here once they start logging.`}
        />
      )}
    </div>
  );
}

function Clients({ clientId, section, nav }: { clientId: string; section: string; nav: Nav }) {
  const client = CLIENTS.find((c) => c.id === clientId);
  return (
    <>
      <PageHead title="Clients" sub={`${CLIENTS.length} active`} />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className={client ? "hidden lg:block" : ""}><ClientList selected={clientId} nav={nav} /></div>
        <div className={client ? "" : "hidden lg:block"}>
          {client ? <ClientWorkspace client={client} section={section} nav={nav} /> : <EmptyCard title="Select a client" text="Pick someone from the list to see their plan and progress." />}
        </div>
      </div>
    </>
  );
}

function Inbox({ clientId, nav }: { clientId: string; nav: Nav }) {
  const client = CLIENTS.find((c) => c.id === clientId);
  const [threads, setThreads] = useState<Record<string, { me: boolean; t: string }[]>>({
    "1": [{ me: false, t: "Legs are still sore from Tuesday!" }, { me: true, t: "Good sign. Keep the tempo slow today." }],
    "2": [{ me: false, t: "Sorry, travelling this week. Can I catch up on Friday?" }],
  });
  const [text, setText] = useState("");
  const msgs = threads[clientId] ?? [];
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-white sm:rounded-3xl sm:shadow-[0_8px_24px_-12px_rgba(11,11,12,0.15)]">
      <div className={`w-full shrink-0 overflow-y-auto border-r border-[#EFEBDF] lg:w-[320px] ${client ? "hidden lg:block" : ""}`}>
        <h1 className="px-5 py-4 text-xl font-extrabold">Messages</h1>
        <ul>
          {CLIENTS.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => nav({ view: "messages", client: c.id })}
                className={`flex min-h-16 w-full items-center gap-3 px-5 text-left transition hover:bg-[#FBFAF6] ${clientId === c.id ? "bg-[#F6F4EF]" : ""}`}
              >
                <Avatar name={c.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">{c.name}</span>
                  <span className="block truncate text-sm text-[#6B665C]">{(threads[c.id] ?? []).slice(-1)[0]?.t ?? "No messages yet"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={`min-w-0 flex-1 flex-col ${client ? "flex" : "hidden lg:flex"}`}>
        {client ? (
          <>
            <div className="flex items-center gap-3 border-b border-[#EFEBDF] px-4 py-3">
              <button onClick={() => nav({ view: "messages" })} aria-label="Back to inbox" className="flex h-9 w-9 items-center justify-center rounded-full text-[#4A463E] hover:bg-[#F6F4EF] lg:hidden">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
              </button>
              <Avatar name={client.name} />
              <p className="text-[15px] font-extrabold">{client.name}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.length === 0 ? <p className="py-10 text-center text-sm text-[#6B665C]">Start the conversation.</p> : null}
              {msgs.map((m, i) => (
                <div key={i} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${m.me ? "ml-auto rounded-tr-md bg-[#0B0B0C] text-white" : "rounded-tl-md bg-[#F6F4EF]"}`}>{m.t}</div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                setThreads((t) => ({ ...t, [clientId]: [...(t[clientId] ?? []), { me: true, t: text.trim() }] }));
                setText("");
              }}
              className="safe-bottom flex gap-2 border-t border-[#EFEBDF] p-3"
            >
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Reply to ${client.name.split(" ")[0]}`} className="h-11 min-w-0 flex-1 rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-[15px] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]" />
              <button className={primaryBtn}>Send</button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#6B665C]">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

function Library({ kind, title, sub }: { kind: "nutrition" | "workouts"; title: string; sub: string }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1.5 text-[15px] text-[#6B665C]">{sub}</p>
        </div>
        <button className={primaryBtn}>New template</button>
      </div>
      <ul className={`${card} divide-y divide-[#EFEBDF] !py-2`}>
        {TEMPLATES[kind].map((t) => (
          <li key={t.t} className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div>
              <p className="text-[15px] font-bold">{t.t}</p>
              <p className="text-sm text-[#6B665C]">{t.d}</p>
            </div>
            <button className={softBtn}>Assign</button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Schedule() {
  return (
    <>
      <PageHead title="Schedule" sub="Monday 23 November" />
      <section className={card}>
        <ul className="space-y-3">
          {SESSIONS.map((s) => (
            <li key={s.time} className="flex gap-4">
              <span className="w-14 shrink-0 pt-2.5 text-sm font-extrabold tabular-nums">{s.time}</span>
              <span className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 ${s.who === "Open slot" ? "border border-dashed border-[#D9D3C3]" : "bg-[#F6F4EF]"}`}>
                <span>
                  <span className="block text-[15px] font-bold">{s.who}</span>
                  <span className="block text-sm text-[#6B665C]">{s.what}</span>
                </span>
                {s.who === "Open slot" ? <button className={softBtn}>Block</button> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function TrainingLog({ nav }: { nav: Nav }) {
  return (
    <>
      <PageHead title="Training log" sub="Pick a client to view their log." />
      <ul className={`${card} divide-y divide-[#EFEBDF] !py-2`}>
        {CLIENTS.map((c) => (
          <li key={c.id}>
            <button onClick={() => nav({ view: "clients", client: c.id, section: "workouts" })} className="flex min-h-16 w-full items-center gap-3 py-3 text-left">
              <Avatar name={c.name} />
              <span className="flex-1 text-[15px] font-bold">{c.name}</span>
              <span className="text-sm text-[#6B665C]">Last: {c.last}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="block text-sm font-bold text-[#4A463E]">
      {label}
      <input type={type} className="mt-1.5 h-12 w-full rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-base font-normal text-[#0B0B0C] outline-none focus:border-[#86712F]" />
    </label>
  );
}

function Inner() {
  const params = useSearchParams();
  const [, force] = useState(0);
  const [invite, setInvite] = useState(false);

  // In-app updates use replaceState; leaving Clients clears the selection.
  const nav: Nav = useCallback((q) => {
    const sp = new URLSearchParams();
    const v = q.view ?? "overview";
    if (v !== "overview") sp.set("view", v);
    if (q.client && (v === "clients" || v === "messages")) sp.set("client", q.client);
    if (q.section && v === "clients") sp.set("section", q.section);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/coach?${qs}` : "/coach");
    force((n) => n + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const sp = typeof window === "undefined" ? params : new URLSearchParams(window.location.search);
  const viewParam = sp.get("view") ?? "overview";
  const view = coachViewIds.includes(viewParam) ? viewParam : "overview";
  const client = sp.get("client") ?? "";
  const section = sp.get("section") ?? "overview";
  const active = view === "training-log" ? "overview" : view;

  const body: Record<string, ReactNode> = {
    overview: <Overview nav={nav} invite={() => setInvite(true)} />,
    schedule: <Schedule />,
    messages: <Inbox clientId={client} nav={nav} />,
    clients: <Clients clientId={client} section={section} nav={nav} />,
    nutrition: <Library kind="nutrition" title="Nutrition templates" sub="Your coach-wide library." />,
    workouts: <Library kind="workouts" title="Workout templates" sub="Your coach-wide library." />,
    "training-log": <TrainingLog nav={nav} />,
  };

  return (
    <>
      <ClientShell
        items={coachNav}
        active={active}
        onSelect={(id) => nav({ view: id })}
        name="Paul"
        homeHref="/coach"
        settingsLabel="Trainer settings"
        action={{ label: "Invite", onClick: () => setInvite(true) }}
        chat={view === "messages"}
      >
        {body[view]}
      </ClientShell>
      {invite ? (
        <Sheet title="Invite client" onClose={() => setInvite(false)}>
          <form onSubmit={(e) => { e.preventDefault(); setInvite(false); }} className="space-y-4">
            <Field label="Name" />
            <Field label="Email" type="email" />
            <button className={`${goldBtn} w-full`}>Send invite</button>
          </form>
        </Sheet>
      ) : null}
    </>
  );
}

export function CoachDashboard() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F6F4EF]" />}>
      <Inner />
    </Suspense>
  );
}
