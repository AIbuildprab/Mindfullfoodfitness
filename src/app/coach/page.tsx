import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoachDashboard } from "@/components/dashboard/CoachDashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Coach",
  robots: { index: false },
};

// Personal-trainer workspace. Layout only for now: placeholder content, no data.
export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Clients go to their own dashboard.
  if (profile?.role !== "personal_trainer") redirect("/dashboard");

  return <CoachDashboard />;
}
