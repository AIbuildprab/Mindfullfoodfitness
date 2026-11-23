"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const card =
  "rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(11,11,12,0.05),0_8px_24px_-12px_rgba(11,11,12,0.12)] sm:p-6";
export const primaryBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#0B0B0C] px-6 text-sm font-bold text-white transition hover:bg-[#2a2a2a] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
export const goldBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#E4D18B] px-6 text-sm font-bold text-[#0B0B0C] transition hover:bg-[#EBDDA5] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
export const softBtn =
  "inline-flex h-11 items-center justify-center rounded-full border border-[#D9D3C3] bg-white px-5 text-sm font-bold text-[#0B0B0C] transition hover:border-[#86712F] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
export const linkBtn = "text-sm font-bold text-[#86712F] hover:underline";
const inputCls =
  "mt-1.5 h-12 w-full rounded-xl border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-base font-normal text-[#0B0B0C] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]";

export function H({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-extrabold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">{title}</h1>
        {sub ? <p className="mt-1.5 text-[15px] text-[#6B665C]">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
        on ? "border-[#86712F] bg-[#86712F]" : "border-[#CFC8B6] bg-white"
      }`}
      aria-hidden
    >
      {on ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      ) : null}
    </span>
  );
}

export function Tabs({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="mb-6 inline-flex max-w-full overflow-x-auto rounded-full bg-[#EAE5D8] p-1 [scrollbar-width:none]">
      {items.map((i) => (
        <button
          key={i.id}
          role="tab"
          aria-selected={value === i.id}
          onClick={() => onChange(i.id)}
          className={`h-10 shrink-0 rounded-full px-5 text-sm font-bold transition ${value === i.id ? "bg-white shadow-sm" : "text-[#4A463E] hover:text-[#0B0B0C]"}`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyCard({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={`${card} flex min-h-[220px] flex-col items-center justify-center text-center`}>
      <p className="text-lg font-extrabold">{title}</p>
      {text ? <p className="mt-1.5 max-w-xs text-[15px] text-[#6B665C]">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#EFEBDF] ${className}`} aria-hidden />;
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skel key={i} className={`h-5 ${i % 2 ? "w-3/5" : "w-full"}`} />
      ))}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FBEAE7] px-4 py-3 text-sm text-[#8A2B20]">
      <span>{message}</span>
      {onRetry ? (
        <button onClick={onRetry} className="font-bold underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Field({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-bold text-[#4A463E]">
      {label}
      <input {...rest} className={inputCls} />
    </label>
  );
}

export function Select({ label, children, ...rest }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm font-bold text-[#4A463E]">
      {label}
      <select {...rest} className={inputCls}>
        {children}
      </select>
    </label>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#EFEBDF] text-xs font-extrabold text-[#4A463E]"
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Bar({ pct, label, warn }: { pct: number; label: string; warn?: boolean }) {
  return (
    <div className="h-2 w-full rounded-full bg-[#EFEBDF]" role="img" aria-label={label}>
      <div className={`h-full rounded-full ${warn ? "bg-[#C9772B]" : "bg-[#0B0B0C]"}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function WeightLine({ points, label }: { points: number[]; label: string }) {
  if (points.length < 2) return <p className="text-sm text-[#6B665C]">Log your weight in two check-ins to see a trend.</p>;
  const w = 240;
  const h = 64;
  const min = Math.min(...points) - 0.3;
  const max = Math.max(...points) + 0.3;
  const pts = points.map((v, i) => [(i / (points.length - 1)) * w, h - ((v - min) / (max - min)) * h]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} className="h-20 w-full" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="#0B0B0C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill="#86712F" />
    </svg>
  );
}

/** Parses a number input; empty or invalid becomes null. */
export const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));
