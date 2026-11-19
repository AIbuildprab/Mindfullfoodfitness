"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PromiseCard({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panelEl = panel.current;
    const photoEl = panelEl?.querySelector<HTMLElement>(".promise-photo");
    if (!panelEl || !photoEl) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let running = false;
    let currentY = 0;
    let targetY = 0;
    let initialized = false;

    const syncLayout = () => {
      const rect = panelEl.getBoundingClientRect();
      panelEl.style.setProperty("--promise-left", `${rect.left}px`);
      panelEl.style.setProperty("--promise-vh", `${window.innerHeight}px`);
      return rect;
    };

    const apply = () => {
      const rect = syncLayout();
      if (!desktop.matches || reduced.matches) {
        photoEl.style.transform = "";
        currentY = 0;
        targetY = 0;
        initialized = false;
        return false;
      }
      targetY = -rect.top;
      if (!initialized) {
        currentY = targetY;
        initialized = true;
      }
      return true;
    };

    const loop = () => {
      const active = apply();
      if (active) {
        currentY += (targetY - currentY) * 0.18;
        if (Math.abs(targetY - currentY) < 0.15) currentY = targetY;
        photoEl.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;
      }
      if (running) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || !desktop.matches || reduced.matches) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { rootMargin: "120px" },
    );

    observer.observe(panelEl);
    window.addEventListener("resize", syncLayout);
    desktop.addEventListener("change", start);
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
      desktop.removeEventListener("change", start);
    };
  }, []);

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="grid overflow-hidden rounded-[22px] lg:grid-cols-2">
        {children}
        <div
          ref={panel}
          className="promise-panel relative order-first h-[340px] overflow-hidden bg-black sm:h-[400px] lg:order-none lg:h-auto lg:min-h-0"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[url('/mff/promise-bg.webp')] bg-cover bg-right lg:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent lg:hidden"
          />
          <div
            aria-hidden
            className="promise-photo pointer-events-none absolute hidden bg-black bg-[url('/mff/promise-bg.webp')] bg-cover bg-no-repeat lg:block"
          />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[22px] border-[7px] border-gold shadow-[0_0_4px_rgba(0,0,0,0.34)] [transform:translateZ(0)]"
      />
    </div>
  );
}
