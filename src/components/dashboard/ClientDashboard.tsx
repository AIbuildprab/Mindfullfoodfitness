"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { useUnread } from "@/lib/data/hooks";
import { clientNav, clientTabIds } from "@/lib/dashboard-nav";
import { ClientShell } from "./ClientShell";
import { Home } from "./client/Home";
import { Messages, Nutrition, Progress, Schedule, Training } from "./client/Pages";
import { CheckInSheet } from "./client/Sheets";

type Route = { tab: string; view: string };

function Inner({ userId, name }: { userId: string; name: string }) {
  const params = useSearchParams();
  const initialTab = params.get("tab") ?? "home";
  const [route, setRoute] = useState<Route>({
    tab: clientTabIds.includes(initialTab) ? initialTab : "home",
    view: params.get("view") ?? "",
  });
  const [checkIn, setCheckIn] = useState(params.get("checkin") === "1");
  const [version, setVersion] = useState(0);
  const unread = useUnread(userId, false);

  // In-app tab changes use replaceState so Next does not re-run the route.
  const go = useCallback((tab: string, view?: string) => {
    const q = new URLSearchParams();
    if (tab !== "home") q.set("tab", tab);
    if (view) q.set("view", view);
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `/dashboard?${qs}` : "/dashboard");
    setRoute({ tab, view: view ?? "" });
    window.scrollTo({ top: 0 });
  }, []);

  const { tab, view } = route;

  return (
    <>
      <ClientShell
        items={clientNav}
        active={tab}
        onSelect={(t) => go(t)}
        name={name}
        badges={{ messages: unread }}
        action={{ label: "Check-in", onClick: () => setCheckIn(true) }}
        chat={tab === "messages"}
      >
        {tab === "home" ? <Home meId={userId} name={name} go={go} version={version} onCheckIn={() => setCheckIn(true)} /> : null}
        {tab === "schedule" ? <Schedule meId={userId} /> : null}
        {tab === "messages" ? <Messages meId={userId} onBack={() => go("home")} /> : null}
        {tab === "training" ? <Training meId={userId} view={view} go={go} /> : null}
        {tab === "nutrition" ? <Nutrition meId={userId} view={view} go={go} /> : null}
        {tab === "progress" ? <Progress meId={userId} version={version} /> : null}
      </ClientShell>
      {checkIn ? <CheckInSheet meId={userId} onClose={() => setCheckIn(false)} onSaved={() => setVersion((v) => v + 1)} /> : null}
    </>
  );
}

export function ClientDashboard({ userId, name }: { userId: string; name: string }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F6F4EF]" />}>
      <Inner userId={userId} name={name} />
    </Suspense>
  );
}
