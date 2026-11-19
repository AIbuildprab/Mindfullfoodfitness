"use client";

import Link from "next/link";
import type { ReactNode } from "react";

// "Back to home" must always land at the top of the landing page. A soft Next.js
// navigation can keep the window's old scroll position (the sticky header counts
// as "already in view"), so reset it explicitly once the route has changed.
export function BackHome({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link
      href="/"
      className={className}
      onClick={() => {
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        const reset = () => window.scrollTo(0, 0);
        reset();
        [50, 150, 400].forEach((ms) => setTimeout(reset, ms));
        setTimeout(() => (html.style.scrollBehavior = ""), 450);
      }}
    >
      {children}
    </Link>
  );
}
