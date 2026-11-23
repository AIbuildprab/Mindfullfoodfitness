"use client";

import { addDays, timeOf, today, weeksSince } from "@/lib/data/dates";
import { db, must, useQuery } from "@/lib/data/hooks";
import { fullName, type Session } from "@/lib/data/types";
import { Avatar, Bar, card, ErrorNote, H, linkBtn, Loading, primaryBtn, softBtn } from "../light";
import { useClients } from "./shared";

export type Nav = (q: { view?: string; client?: string; section?: string }) => void;

export function Overview({ nav, invite, name }: { nav: Nav; invite: () => void; name: string }) {
  const clients = useClients();
  const t = today();
  const stats = useQuery(async () => {
    const s = db();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const [checkins, workouts, unread, sessions, requested] = await Promise.all([
      s.from("checkins").select("client_id, day").gte("day", addDays(t, -6)),
      s.from("workouts").select("client_id").gte("scheduled_on", t),
      s.from("messages").select("client_id").is("read_at", null),
      s.from("sessions").select("*").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).neq("status", "cancelled").order("starts_at"),
      s.from("sessions").select("id", { count: "exact", head: true }).eq("status", "requested"),
    ]);
    const unreadRows = must(unread) as { client_id: string }[];
    return {
      checkins: must(checkins) as { client_id: string; day: string }[],
      planned: new Set((must(workouts) as { client_id: string }[]).map((w) => w.client_id)),
      unread: unreadRows,
      today: must(sessions) as Session[],
      requested: requested.count ?? 0,
    };
  }, []);

  const list = (clients.data ?? []).filter((c) => (c.client_details?.status ?? "active") !== "paused");
  const byId = new Map((clients.data ?? []).map((c) => [c.id, c]));
  const s = stats.data;

  const perClient = list.map((c) => {
    const days = new Set((s?.checkins ?? []).filter((x) => x.client_id === c.id).map((x) => x.day));
    const last3 = [0, 1, 2].some((i) => days.has(addDays(t, -i)));
    const new_ = c.client_details ? weeksSince(c.client_details.start_date) <= 1 : true;
    const flags: string[] = [];
    if (!new_ && !last3) flags.push("No check-in in 3 days");
    if (s && !s.planned.has(c.id)) flags.push("No upcoming workouts assigned");
    const msgs = (s?.unread ?? []).filter((m) => m.client_id === c.id).length;
    if (msgs) flags.push(`${msgs} unread message${msgs > 1 ? "s" : ""}`);
    return { c, days: days.size, flags };
  });
  const attention = perClient.filter((p) => p.flags.length);

  const summary = [
    { n: String(list.length), l: "Active clients" },
    { n: String(s?.today.length ?? "–"), l: "Sessions today" },
    { n: String(attention.length), l: "Need attention" },
    { n: String(s?.requested ?? "–"), l: "Session requests" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">Welcome back, {name}</h1>
          <p className="mt-1.5 text-[15px] text-[#6B665C]">
            {clients.loading || stats.loading ? "Loading your day." : `${attention.length} ${attention.length === 1 ? "client needs" : "clients need"} you today. ${s?.today.length ?? 0} on the diary.`}
          </p>
        </div>
        <button onClick={invite} className={primaryBtn}>Invite client</button>
      </div>

      {clients.error ? <ErrorNote message={clients.error} onRetry={clients.reload} /> : null}
      {stats.error ? <ErrorNote message={stats.error} onRetry={stats.reload} /> : null}

      <section className={`${card} grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-[#EFEBDF]`} aria-label="Summary">
        {summary.map((x) => (
          <div key={x.l} className="sm:px-6 sm:first:pl-0">
            <p className="text-3xl font-extrabold tabular-nums tracking-tight">{x.n}</p>
            <p className="mt-1 text-sm text-[#6B665C]">{x.l}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className={card} aria-label="Needs attention">
            <H>Needs attention</H>
            {clients.loading ? <Loading /> : attention.length === 0 ? (
              <p className="text-[15px] text-[#6B665C]">Everyone is on track.</p>
            ) : (
              <ul className="divide-y divide-[#EFEBDF]">
                {attention.map(({ c, flags }) => (
                  <li key={c.id}>
                    <button onClick={() => nav({ view: "clients", client: c.id, section: "overview" })} className="flex min-h-16 w-full items-center gap-3 py-3 text-left">
                      <Avatar name={fullName(c)} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold">{fullName(c)}</span>
                        <span className="block truncate text-sm text-[#6B665C]">{flags.join(" · ")}</span>
                      </span>
                      <span className={linkBtn}>Open</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-label="Check-ins this week">
            <H right={<button onClick={() => nav({ view: "clients" })} className={linkBtn}>All clients</button>}>Check-ins this week</H>
            {clients.loading ? <Loading rows={4} /> : list.length === 0 ? (
              <p className="text-[15px] text-[#6B665C]">No clients yet. Invite your first client to get started.</p>
            ) : (
              <ul className="space-y-4">
                {perClient.map(({ c, days }) => (
                  <li key={c.id} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_180px_1fr_44px]">
                    <Avatar name={fullName(c)} size={36} />
                    <p className="truncate text-[15px] font-bold">{fullName(c)}</p>
                    <div className="col-span-2 sm:col-span-1"><Bar pct={(days / 7) * 100} warn={days < 3} label={`${days} of 7 days checked in`} /></div>
                    <p className="hidden text-right text-sm font-bold tabular-nums sm:block">{days}/7</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-label="Today">
            <H right={<button onClick={() => nav({ view: "schedule" })} className={linkBtn}>Schedule</button>}>Today</H>
            {stats.loading ? <Loading /> : (s?.today ?? []).length === 0 ? (
              <p className="text-[15px] text-[#6B665C]">Nothing in the diary today.</p>
            ) : (
              <ul className="space-y-3">
                {s!.today.map((x) => {
                  const who = x.client_id ? byId.get(x.client_id) : null;
                  return (
                    <li key={x.id} className="flex gap-4">
                      <span className="w-12 shrink-0 pt-0.5 text-sm font-extrabold tabular-nums">{timeOf(x.starts_at)}</span>
                      <span className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${x.status === "open" ? "border border-dashed border-[#D9D3C3]" : "bg-[#F6F4EF]"}`}>
                        <span className="block text-[15px] font-bold">{who ? fullName(who) : "Open slot"}</span>
                        <span className="block text-sm text-[#6B665C]">{x.status === "requested" ? "Waiting for you to confirm" : x.title}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
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
