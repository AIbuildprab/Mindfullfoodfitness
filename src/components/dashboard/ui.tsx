import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#3a3a3a] bg-[#1b1b1b] p-5 ${className}`}>{children}</section>
  );
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold text-white">{children}</h2>
      {hint ? <span className="text-xs text-[#9A9A9A]">{hint}</span> : null}
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-[26px]">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-[#9A9A9A]">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skel({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-bold text-white">{title}</p>
      {text ? <p className="mt-2 max-w-xs text-sm text-[#9A9A9A]">{text}</p> : null}
    </div>
  );
}

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="mb-5 inline-flex rounded-xl border border-[#3a3a3a] bg-[#161616] p-1">
      {items.map((i) => (
        <button
          key={i.id}
          role="tab"
          aria-selected={value === i.id}
          onClick={() => onChange(i.id)}
          className={`min-h-10 rounded-lg px-5 text-sm font-semibold transition ${
            value === i.id ? "bg-white/[0.09] text-white" : "text-[#9A9A9A] hover:text-white"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export const goldBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-gold/50 bg-gold/15 px-5 text-sm font-bold text-gold-2 transition hover:bg-gold-deep hover:text-white";
export const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#3a3a3a] px-5 text-sm font-semibold text-white transition hover:border-gold hover:text-gold-2";
