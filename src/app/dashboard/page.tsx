import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const tiles = ["Today’s workout", "Nutrition", "Progress", "Check-ins", "Messages", "Billing"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, plan")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user.email ||
    "there";

  return (
    <section className="bg-neutral-50 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Client dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold text-black sm:text-5xl">
          Welcome, <span className="text-gold">{displayName}</span>
        </h1>
        <p className="mt-4 max-w-lg text-neutral-600">
          {profile?.plan
            ? `Plan: ${profile.plan}. Sections below are coming soon.`
            : "Your coaching hub. Sections below are coming soon."}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <div key={t} className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-lg font-bold text-black">{t}</p>
              <p className="mt-2 text-sm text-neutral-500">Coming soon</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-full border-2 border-black px-6 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            Back to site
          </Link>
          <SignOutButton />
        </div>
      </div>
    </section>
  );
}
