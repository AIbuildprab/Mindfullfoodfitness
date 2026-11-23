"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { coachNav, coachViewIds } from "@/lib/dashboard-nav";
import { useUnread } from "@/lib/data/hooks";
import { ClientShell } from "./ClientShell";
import { Clients } from "./coach/Clients";
import { Inbox, InviteSheet, Library, Schedule, TrainingLog } from "./coach/Other";
import { Overview, type Nav } from "./coach/Overview";

type Route = { view: string; client: string; section: string };

function Inner({ userId, name }: { userId: string; name: string }) {
  const params = useSearchParams();
  const v = params.get("view") ?? "overview";
  const [route, setRoute] = useState<Route>({
    view: coachViewIds.includes(v) ? v : "overview",
    client: params.get("client") ?? "",
    section: params.get("section") ?? "overview",
  });
  const [invite, setInvite] = useState(false);
  const unread = useUnread(userId, true);

  // In-app updates use replaceState; leaving Clients clears the selection.
  const nav: Nav = useCallback((q) => {
    const sp = new URLSearchParams();
    const view = q.view ?? "overview";
    if (view !== "overview") sp.set("view", view);
    if (q.client && (view === "clients" || view === "messages")) sp.set("client", q.client);
    if (q.section && view === "clients") sp.set("section", q.section);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/coach?${qs}` : "/coach");
    setRoute({ view, client: view === "clients" || view === "messages" ? (q.client ?? "") : "", section: q.section ?? "overview" });
    window.scrollTo({ top: 0 });
  }, []);

  const { view, client, section } = route;

  return (
    <>
      <ClientShell
        items={coachNav}
        active={view === "training-log" ? "overview" : view}
        onSelect={(id) => nav({ view: id })}
        name={name}
        homeHref="/coach"
        settingsLabel="Trainer settings"
        badges={{ messages: unread }}
        action={{ label: "Invite", onClick: () => setInvite(true) }}
        chat={view === "messages"}
      >
        {view === "overview" ? <Overview nav={nav} invite={() => setInvite(true)} name={name} /> : null}
        {view === "schedule" ? <Schedule /> : null}
        {view === "messages" ? <Inbox meId={userId} clientId={client} nav={nav} /> : null}
        {view === "clients" ? <Clients clientId={client} section={section} nav={nav} /> : null}
        {view === "nutrition" ? <Library kind="nutrition" /> : null}
        {view === "workouts" ? <Library kind="workouts" /> : null}
        {view === "training-log" ? <TrainingLog nav={nav} /> : null}
      </ClientShell>
      {invite ? <InviteSheet onClose={() => setInvite(false)} /> : null}
    </>
  );
}

export function CoachDashboard({ userId, name }: { userId: string; name: string }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F6F4EF]" />}>
      <Inner userId={userId} name={name} />
    </Suspense>
  );
}
