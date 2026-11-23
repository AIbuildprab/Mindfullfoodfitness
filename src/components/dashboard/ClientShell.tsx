"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { scrollTopSoon } from "@/lib/scroll-top";
import type { NavItem } from "@/lib/dashboard-nav";
import { Icon } from "./Icons";

type Props = {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  name: string;
  badges?: Record<string, number>;
  action: { label: string; onClick: () => void };
  homeHref?: string;
  settingsLabel?: string;
  chat?: boolean;
  children: ReactNode;
};

function Dot({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D6453D] px-1 text-[10px] font-bold text-white">
      {n > 9 ? "9+" : n}
    </span>
  );
}

function AccountMenu({ name, settingsLabel }: { name: string; settingsLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0C] text-sm font-bold text-[#E4D18B] outline-offset-2 transition hover:bg-[#2a2a2a]"
      >
        {name.charAt(0).toUpperCase()}
      </button>
      {open ? (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-[#E7E3D9] bg-white py-1.5 text-sm shadow-[0_12px_32px_-8px_rgba(11,11,12,0.25)]">
            <p className="truncate px-4 pb-1.5 pt-1 text-xs font-semibold text-[#6B665C]">{name}</p>
            <Link href="/account" className="block px-4 py-2.5 font-semibold text-[#0B0B0C] hover:bg-[#F6F4EF]">
              {settingsLabel}
            </Link>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/");
                router.refresh();
                scrollTopSoon();
              }}
              className="block w-full px-4 py-2.5 text-left font-semibold text-[#0B0B0C] hover:bg-[#F6F4EF]"
            >
              Log out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ClientShell({ items, active, onSelect, name, badges, action, homeHref = "/dashboard", settingsLabel = "Settings", chat, children }: Props) {
  return (
    <div data-app-shell="full" className="flex min-h-dvh flex-col bg-[#F6F4EF] text-[#0B0B0C]">
      <header className="sticky top-0 z-30 border-b border-[#E7E3D9] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:gap-6">
          <Link href={homeHref} aria-label="Home" className="flex h-10 shrink-0 items-center rounded-xl bg-[#0B0B0C] px-3">
            <Image
              src="/brand/Logo_Inverted.png"
              alt="Mindfull Food Fitness"
              width={120}
              height={29}
              className="h-6 w-auto"
              style={{ width: "auto" }}
            />
          </Link>

          <nav aria-label="Dashboard" className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {items.map((i) => {
              const on = active === i.id;
              return (
                <button
                  key={i.id}
                  onClick={() => onSelect(i.id)}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex h-10 items-center gap-2 rounded-full px-3 text-sm min-[900px]:px-4 font-semibold transition ${
                    on ? "bg-[#0B0B0C] text-white" : "text-[#4A463E] hover:bg-[#F0ECE2]"
                  }`}
                >
                  <span className="relative">
                    <Icon name={i.icon} className="h-[18px] w-[18px]" />
                    <Dot n={badges?.[i.id]} />
                  </span>
                  <span className="hidden min-[900px]:inline">{i.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <button
              onClick={action.onClick}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full border border-[#D9D3C3] bg-white px-4 text-sm font-bold text-[#0B0B0C] transition hover:border-[#86712F] hover:text-[#86712F]"
            >
              {action.label}
            </button>
            <AccountMenu name={name} settingsLabel={settingsLabel} />
          </div>
        </div>
      </header>

      <main className={chat ? "flex min-h-0 flex-1 flex-col" : "flex-1"}>
        <div
          className={
            chat
              ? "mx-auto flex min-h-0 w-full max-w-[860px] flex-1 flex-col px-0 sm:px-6 sm:py-6"
              : "mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8"
          }
        >
          {children}
        </div>
      </main>

      {/* Phone tab bar */}
      <nav
        aria-label="Dashboard"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#E7E3D9] bg-white/95 px-1 pt-1.5 backdrop-blur md:hidden"
      >
        {items.map((i) => {
          const on = active === i.id;
          return (
            <button
              key={i.id}
              onClick={() => onSelect(i.id)}
              aria-current={on ? "page" : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                on ? "text-[#0B0B0C]" : "text-[#7A7568]"
              }`}
            >
              <span className={`relative flex h-7 w-11 items-center justify-center rounded-full transition ${on ? "bg-[#E4D18B]/60" : ""}`}>
                <Icon name={i.icon} className="h-[20px] w-[20px]" />
                <Dot n={badges?.[i.id]} />
              </span>
              {i.short}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B0B0C]/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 text-[#0B0B0C] sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F4EF] text-[#4A463E] hover:bg-[#ECE7DA]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
