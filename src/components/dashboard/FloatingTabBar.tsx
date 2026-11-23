"use client";

import { useRef, useState } from "react";
import type { NavItem } from "@/lib/dashboard-nav";
import { Icon } from "./Icons";

/**
 * Phone navigation: a floating pill with a glass "bubble" under the active tab.
 * Tap a tab, or press and drag sideways: the bubble follows your finger and
 * the tab under it opens when you let go.
 */
export function FloatingTabBar({
  items,
  active,
  onSelect,
  badges,
}: {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  badges?: Record<string, number>;
}) {
  const n = items.length;
  const track = useRef<HTMLDivElement>(null);
  const activeIdx = Math.max(0, items.findIndex((i) => i.id === active));
  // While dragging: bubble offset in px (from the track's left edge) and the tab under it.
  const [drag, setDrag] = useState<{ px: number; idx: number } | null>(null);

  function measure(clientX: number) {
    const r = track.current!.getBoundingClientRect();
    const w = r.width / n;
    const px = Math.min(Math.max(clientX - r.left - w / 2, 0), r.width - w);
    const idx = Math.min(n - 1, Math.max(0, Math.floor((clientX - r.left) / w)));
    return { px, idx };
  }

  const shown = drag ? drag.idx : activeIdx;

  return (
    <nav
      aria-label="Dashboard"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        className="pointer-events-auto mx-auto max-w-[420px] touch-none select-none rounded-full border border-white/10 bg-[#0B0B0C]/88 p-1 shadow-[0_18px_40px_-12px_rgba(11,11,12,0.55),0_2px_6px_rgba(11,11,12,0.25)] backdrop-blur-xl"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(measure(e.clientX));
        }}
        onPointerMove={(e) => {
          if (drag) setDrag(measure(e.clientX));
        }}
        onPointerUp={(e) => {
          const d = measure(e.clientX);
          setDrag(null);
          if (items[d.idx].id !== active) onSelect(items[d.idx].id);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        <div ref={track} className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {/* The bubble */}
          <span
            aria-hidden
            className={`absolute inset-y-0 left-0 rounded-full border border-white/25 bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_-6px_rgba(228,209,139,0.5)] backdrop-blur-sm ${
              drag ? "" : "transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1.25,0.36,1)] motion-reduce:transition-none"
            }`}
            style={{
              width: `${100 / n}%`,
              transform: drag
                ? `translateX(${drag.px}px) scale(1.14)`
                : `translateX(${activeIdx * 100}%) scale(1)`,
            }}
          />
          {items.map((i, idx) => {
            const on = shown === idx;
            const count = badges?.[i.id];
            return (
              <button
                key={i.id}
                // Pointer events handle touch and mouse; this only serves keyboard and assistive tech.
                onClick={(e) => {
                  if (e.detail === 0) onSelect(i.id);
                }}
                aria-current={active === i.id ? "page" : undefined}
                className={`relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold outline-offset-[-2px] transition-colors duration-200 ${
                  on ? "text-[#E4D18B]" : "text-white/65"
                }`}
              >
                <span className="relative">
                  <Icon name={i.icon} className="h-[22px] w-[22px]" />
                  {count ? (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D6453D] px-1 text-[10px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                {i.short}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
