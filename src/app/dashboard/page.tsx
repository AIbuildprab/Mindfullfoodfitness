import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const tiles = ["Today’s workout", "Nutrition", "Progress", "Check-ins", "Messages", "Billing"];

// Placeholder shell for the upcoming client dashboard. Add an auth guard here.
export default function DashboardPage() {
  return (
    <section className="bg-neutral-50 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Client dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold text-black sm:text-5xl">
          Your <span className="text-gold">dashboard</span>
        </h1>
        <p className="mt-4 max-w-lg text-neutral-600">
          Coming soon. This is where the sections below will live.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <div key={t} className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-lg font-bold text-black">{t}</p>
              <p className="mt-2 text-sm text-neutral-500">Coming soon</p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="mt-10 inline-flex min-h-12 items-center rounded-full border-2 border-black px-6 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Back to site
        </Link>
      </div>
    </section>
  );
}
