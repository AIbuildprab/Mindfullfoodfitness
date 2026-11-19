// Frontend-only auth seam. The dashboard build replaces `signIn` with a real
// call (NextAuth/Supabase/etc.) without touching the UI components.
export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "not-live" | "invalid" | "network" };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  void email;
  void password;
  return { ok: false, reason: "not-live" };
}
