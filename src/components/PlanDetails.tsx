"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * "What's included" disclosure for a pricing card: collapsed on phones so the
 * price and the button come first, opened on desktop where there is room.
 */
export function PlanDetails({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && window.matchMedia("(min-width: 1024px)").matches) el.open = true;
  }, []);

  return (
    <details ref={ref} className="group mt-5 border-t border-black/10 pt-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-black [&::-webkit-details-marker]:hidden">
        {label}
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
          fill="none"
          aria-hidden
        >
          <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pb-1 pt-2">{children}</div>
    </details>
  );
}
