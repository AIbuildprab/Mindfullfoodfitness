import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, plan, role")
    .eq("id", user.id)
    .maybeSingle();

  // The personal trainer has their own workspace.
  if (profile?.role === "personal_trainer") redirect("/coach");

  const name = profile?.first_name || user.email?.split("@")[0] || "there";

  return <ClientDashboard userId={user.id} name={name} />;
}
