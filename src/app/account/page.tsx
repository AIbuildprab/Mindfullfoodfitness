import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <section className="min-h-[70vh] bg-[#0E0E0E] px-5 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="mt-2 text-sm text-[#9A9A9A]">Signed in as {user.email}. Settings are coming soon.</p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[#3a3a3a] px-5 text-sm font-semibold hover:border-gold hover:text-gold-2">
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
