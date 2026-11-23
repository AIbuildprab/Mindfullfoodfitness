"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const KEY = "mff-install-dismissed";
const DAYS = 14;

function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(KEY));
    return !!t && Date.now() - t < DAYS * 86400000;
  } catch {
    return false;
  }
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Thin banner that appears while the device has no connection. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="bg-[#0B0B0C] px-4 py-2 text-center text-sm font-semibold text-white">
      You’re offline. Changes won’t save until you’re back online.
    </div>
  );
}

const noopSubscribe = () => () => {};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Android and desktop Chrome get the native install prompt; iPhone gets “Add to Home Screen” steps. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // Read once on the client; false while rendering on the server.
  const eligible = useSyncExternalStore(noopSubscribe, () => !isStandalone() && !dismissedRecently(), () => false);
  const ios = useSyncExternalStore(noopSubscribe, isIosDevice, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setDismissed(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  }

  if (!eligible || dismissed || (!event && !ios)) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#0B0B0C] p-4 text-white sm:px-6" role="region" aria-label="Install the app">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold">Add Mindfull to your home screen</p>
        <p className="mt-0.5 text-sm text-white/70">
          {event ? "Open your plan in one tap, full screen, like an app." : "Tap Share, then Add to Home Screen, to open it like an app."}
        </p>
      </div>
      <div className="flex gap-2">
        {event ? (
          <button
            onClick={async () => {
              await event.prompt();
              const c = await event.userChoice;
              setEvent(null);
              if (c.outcome === "accepted") setDismissed(true);
              else dismiss();
            }}
            className="h-10 rounded-full bg-[#E4D18B] px-5 text-sm font-bold text-[#0B0B0C]"
          >
            Install
          </button>
        ) : null}
        <button onClick={dismiss} className="h-10 rounded-full border border-white/25 px-4 text-sm font-bold text-white hover:bg-white/10">
          Not now
        </button>
      </div>
    </div>
  );
}

/** Keeps the browser/status bar colour in step with the white dashboard header. */
export function ThemeColor({ color }: { color: string }) {
  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const prev = metas.map((m) => m.content);
    metas.forEach((m) => (m.content = color));
    return () => metas.forEach((m, i) => (m.content = prev[i]));
  }, [color]);
  return null;
}
