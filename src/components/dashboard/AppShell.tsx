"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { scrollTopSoon } from "@/lib/scroll-top";
import type { NavIcon, NavItem } from "@/lib/dashboard-nav";
import { Icon } from "./Icons";

type Props = {
  variant: "client" | "coach";
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  center: { label: string; icon: NavIcon; onClick: () => void };
  topAction?: ReactNode;
  badges?: Record<string, number>;
  chat?: boolean;
  children: ReactNode;
};

const badgeText = (n: number) => (n > 9 ? "9+" : String(n));

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
      {badgeText(n)}
    </span>
  );
}

function AccountMenu({ variant }: { variant: "client" | "coach" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3a3a3a] text-[#9A9A9A] transition hover:border-gold hover:text-gold-2"
      >
        <Icon name="clients" className="h-[18px] w-[18px]" />
      </button>
      {open ? (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#161616] py-1 text-sm shadow-xl">
            <Link href="/account" className="block px-4 py-2.5 text-white/90 hover:bg-white/[0.07]">
              {variant === "coach" ? "Trainer settings" : "Settings"}
            </Link>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/");
                router.refresh();
                scrollTopSoon();
              }}
              className="block w-full px-4 py-2.5 text-left text-white/90 hover:bg-white/[0.07]"
            >
              Log out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NavList({
  items,
  active,
  onSelect,
  badges,
  rail,
}: Pick<Props, "items" | "active" | "onSelect" | "badges"> & { rail?: boolean }) {
  return (
    <nav aria-label="Dashboard" className={`flex flex-col gap-1 ${rail ? "items-center" : ""}`}>
      {items.map((i) => {
        const on = active === i.id;
        return (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            aria-current={on ? "page" : undefined}
            title={i.label}
            className={`relative flex items-center gap-3 rounded-xl text-sm font-semibold transition ${
              rail ? "h-11 w-11 justify-center" : "min-h-11 w-full px-3"
            } ${on ? "bg-white/[0.09] text-white" : "text-[#9A9A9A] hover:bg-white/[0.04] hover:text-white"}`}
          >
            <span className="relative">
              <Icon name={i.icon} />
              {rail ? <Badge n={badges?.[i.id]} /> : null}
            </span>
            {rail ? <span className="sr-only">{i.label}</span> : i.label}
            {!rail && badges?.[i.id] ? (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[11px] font-bold text-white">
                {badgeText(badges[i.id])}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function SettingsLink({ variant, rail }: { variant: "client" | "coach"; rail?: boolean }) {
  return (
    <Link
      href="/account"
      title="Settings"
      className={`flex items-center gap-3 rounded-xl text-sm font-semibold text-[#9A9A9A] transition hover:bg-white/[0.04] hover:text-white ${
        rail ? "h-11 w-11 justify-center" : "min-h-11 px-3"
      }`}
    >
      <Icon name="settings" />
      {rail ? <span className="sr-only">Settings</span> : variant === "coach" ? "Trainer settings" : "Settings"}
    </Link>
  );
}

export function AppShell({ variant, items, active, onSelect, center, topAction, badges, chat, children }: Props) {
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  return (
    <div
      data-app-shell
      className="flex min-h-[calc(100dvh-69px)] flex-col bg-[#0E0E0E] text-white lg:h-dvh lg:min-h-0"
    >
      {/* Desktop top bar */}
      <div className="hidden h-[60px] shrink-0 items-center gap-4 border-b border-[#3a3a3a] bg-[#0E0E0E] px-5 lg:flex">
        <Link href={variant === "coach" ? "/coach" : "/dashboard"} aria-label="Home">
          <Image
            src="/brand/Logo_Inverted.png"
            alt="Mindfull Food Fitness"
            width={120}
            height={29}
            className="h-7 w-auto"
            style={{ width: "auto" }}
          />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {topAction}
          <AccountMenu variant={variant} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Tablet rail */}
        <aside className="hidden w-[72px] shrink-0 flex-col items-center justify-between border-r border-[#3a3a3a] py-4 md:flex lg:hidden">
          <NavList items={items} active={active} onSelect={onSelect} badges={badges} rail />
          <SettingsLink variant={variant} rail />
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden w-[208px] shrink-0 flex-col justify-between border-r border-[#3a3a3a] p-3 lg:flex">
          <NavList items={items} active={active} onSelect={onSelect} badges={badges} />
          <SettingsLink variant={variant} />
        </aside>

        <main
          className={`min-w-0 flex-1 ${
            chat
              ? "h-[calc(100dvh-69px)] overflow-hidden lg:h-full"
              : "px-5 py-5 pb-28 md:pb-6 lg:overflow-y-auto lg:px-7 lg:py-6"
          }`}
        >
          <div className={chat ? "h-full" : "mx-auto w-full max-w-[1280px]"}>{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav: 7 slots, the centre one is an action, not a tab */}
      <nav
        aria-label="Dashboard"
        className={`safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 items-end border-t border-[#3a3a3a] bg-[#111] px-1 pt-1.5 md:hidden ${
          chat ? "hidden" : ""
        }`}
      >
        {[...left, "centre" as const, ...right].map((i) =>
          i === "centre" ? (
            <button
              key="centre"
              onClick={center.onClick}
              className="mx-auto -mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-full border border-gold/60 bg-gold-deep text-white shadow-lg"
            >
              <Icon name={center.icon} className="h-5 w-5" />
              <span className="text-[10px] font-bold">{center.label}</span>
            </button>
          ) : (
            <button
              key={i.id}
              onClick={() => onSelect(i.id)}
              aria-current={active === i.id ? "page" : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                active === i.id ? "text-gold-2" : "text-[#9A9A9A]"
              }`}
            >
              <span className="relative">
                <Icon name={i.icon} className="h-[22px] w-[22px]" />
                <Badge n={badges?.[i.id]} />
              </span>
              {i.short}
            </button>
          ),
        )}
      </nav>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#3a3a3a] bg-[#1b1b1b] p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#9A9A9A] hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
