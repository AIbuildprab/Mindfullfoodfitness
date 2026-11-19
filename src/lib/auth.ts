"use client";

import { createClient } from "@/lib/supabase/client";

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "not-live" | "invalid" | "network" };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { ok: false, reason: "not-live" };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, reason: "invalid" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export type SignUpResult =
  | { ok: true; needsConfirmation: boolean }
  | { ok: false; reason: "not-live" | "invalid" | "network"; message?: string };

export async function signUp(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { ok: false, reason: "not-live" };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) return { ok: false, reason: "invalid", message: error.message };
    return { ok: true, needsConfirmation: !data.session };
  } catch {
    return { ok: false, reason: "network" };
  }
}
