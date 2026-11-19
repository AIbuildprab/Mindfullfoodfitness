"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { nav, navGroups, site } from "@/lib/site";
import { UserIcon } from "./UserIcon";

function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-black hover:text-white"
    >
      {children}
    </a>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [mGroup, setMGroup] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const solid = scrolled || open || pathname === "/privacy" || pathname === "/terms" || pathname === "/login" || pathname === "/dashboard" || pathname === "/signup";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const bar = progressRef.current;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const ids = ["home", ...nav.map((item) => item.id)];

    const update = () => {
      const probe = window.scrollY + window.innerHeight * 0.35;
      let current = "home";
      let currentTop = -Infinity;
      for (const id of ids) {
        const node = document.getElementById(id);
        if (!node) continue;
        const top = node.getBoundingClientRect().top + window.scrollY;
        if (top <= probe && top >= currentTop) {
          current = id;
          currentTop = top;
        }
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        const last = [...ids].reverse().find((id) => document.getElementById(id));
        if (last) current = last;
      }
      setActive(current);
    };

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setMGroup(null);
  };

  return (
    <>
      <div className="hidden bg-gold-deep text-white lg:block">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-2">
          <a
            href={`mailto:${site.email}`}
            className="inline-flex min-h-8 min-w-0 items-center gap-2 font-[family-name:var(--font-open-sans)] text-xs sm:text-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
              <path d="M3 6.5h18v11H3v-11Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className="truncate">{site.email}</span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <Social href={site.facebook} label="Facebook">
              <svg viewBox="0 0 512 512" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
              </svg>
            </Social>
            <Social href={site.instagram} label="Instagram">
              <svg viewBox="0 0 448 512" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </Social>
            <Social href={site.youtube} label="YouTube">
              <svg viewBox="0 0 576 512" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
              </svg>
            </Social>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b border-white/5 text-white transition-colors duration-300 ${
          solid ? "bg-black" : "bg-black/[0.07]"
        }`}
      >
        <div
          ref={progressRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gold"
        />
        <div
          className={`mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 transition-[padding] duration-300 ${
            scrolled ? "py-2 lg:py-2.5" : "py-3 lg:py-3.5"
          }`}
        >
          <Link href="/#home" onClick={close} aria-label="Mindfull Food Fitness — home" className="inline-flex min-h-11 shrink-0 items-center">
            <Image
              src="/brand/Logo_Inverted.png"
              alt="Mindfull Food Fitness"
              width={132}
              height={32}
              className="h-7 w-auto lg:h-8"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-end gap-x-3 font-[family-name:var(--font-open-sans)] text-[14px] font-medium lg:flex"
            aria-label="Menu"
          >
            {navGroups.map((entry) => {
              if ("items" in entry) {
                const current = entry.items.some((item) => item.id === active);
                const expanded = group === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="relative"
                    onMouseEnter={() => setGroup(entry.id)}
                    onMouseLeave={() => setGroup(null)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setGroup(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setGroup(null);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-haspopup="true"
                      onClick={() => setGroup(expanded ? null : entry.id)}
                      className={`inline-flex items-center gap-1.5 border-b-2 px-2 py-1.5 whitespace-nowrap transition ${
                        current || expanded ? "border-gold text-gold" : "border-transparent text-white hover:text-gold"
                      }`}
                    >
                      {entry.label}
                      <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" aria-hidden>
                        <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      className={`absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 transition duration-200 ${
                        expanded ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                      }`}
                    >
                      <ul className="overflow-hidden rounded-xl border border-white/10 bg-black/95 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur">
                        {entry.items.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              onClick={() => setGroup(null)}
                              tabIndex={expanded ? undefined : -1}
                              aria-current={active === item.id ? "true" : undefined}
                              className={`block rounded-lg px-3.5 py-2.5 text-[14px] transition hover:bg-white/10 hover:text-gold ${
                                active === item.id ? "text-gold" : "text-white"
                              }`}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }
              const current = active === entry.id;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  aria-current={current ? "true" : undefined}
                  className={`border-b-2 px-2 py-1.5 whitespace-nowrap transition ${
                    current ? "border-gold text-gold" : "border-transparent text-white hover:text-gold"
                  }`}
                >
                  {entry.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/login"
            aria-label="Sign in"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-white/30 px-3.5 py-2.5 font-[family-name:var(--font-open-sans)] text-[14px] font-medium text-white transition hover:border-gold hover:text-gold lg:inline-flex"
          >
            <UserIcon />
            <span className="hidden xl:inline">Sign in</span>
          </Link>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link
            href="/login"
            onClick={close}
            aria-label="Sign in"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" />
              )}
            </svg>
          </button>
          </div>
        </div>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={close}
              className="menu-fade fixed inset-0 -z-10 cursor-default bg-black/60 lg:hidden"
            />
            <div
              id="mobile-menu"
              className="menu-in safe-bottom max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-black px-5 pt-1 lg:hidden"
            >
              <nav className="flex flex-col font-[family-name:var(--font-open-sans)]" aria-label="Menu">
                {navGroups.map((entry, idx) => {
                  if ("items" in entry) {
                    const expanded = mGroup === entry.id;
                    return (
                      <div key={entry.id} className="menu-item border-b border-white/10" style={{ "--i": idx } as CSSProperties}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setMGroup(expanded ? null : entry.id)}
                          className="flex min-h-12 w-full items-center justify-between text-[15px] text-white"
                        >
                          {entry.label}
                          <svg
                            viewBox="0 0 12 12"
                            className={`h-3 w-3 text-gold transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                            fill="none"
                            aria-hidden
                          >
                            <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {expanded ? (
                          <div className="pb-2 pl-3">
                            {entry.items.map((item) => (
                              <Link
                                key={item.id}
                                href={item.href}
                                onClick={close}
                                className="flex min-h-11 items-center text-[14px] text-white/75 hover:text-gold"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={entry.id}
                      href={entry.href}
                      onClick={close}
                      className="menu-item flex min-h-12 items-center border-b border-white/10 text-[15px] text-white"
                      style={{ "--i": idx } as CSSProperties}
                    >
                      {entry.label}
                    </Link>
                  );
                })}
                <div className="menu-item py-3" style={{ "--i": 5 } as CSSProperties}>
                  <Link
                    href="/login"
                    onClick={close}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-5 text-sm font-medium text-white"
                  >
                    <UserIcon className="h-4 w-4" />
                    Sign in
                  </Link>
                </div>
              </nav>
            </div>
          </>
        ) : null}
      </header>
    </>
  );
}
