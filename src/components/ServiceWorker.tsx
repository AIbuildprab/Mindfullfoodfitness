"use client";

import { useEffect, useState } from "react";

/** Registers the service worker and offers a one-tap reload when a new version is ready. */
export function ServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let reloading = false;

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
        // Look for a new version whenever the app comes back to the foreground.
        const check = () => document.visibilityState === "visible" && reg.update().catch(() => {});
        document.addEventListener("visibilitychange", check);
      })
      .catch(() => {});

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[80] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-[#0B0B0C] px-4 py-3 text-sm text-white shadow-[0_18px_40px_-12px_rgba(11,11,12,0.55)] md:bottom-6"
    >
      <span className="font-semibold">A new version is ready.</span>
      <button onClick={() => waiting.postMessage("SKIP_WAITING")} className="h-9 rounded-full bg-[#E4D18B] px-4 font-bold text-[#0B0B0C]">
        Update
      </button>
    </div>
  );
}
