# Prompt for Cursor: finish the Supabase sign-up setup

Paste everything below the line into Cursor (it has Supabase access).

---

You are working in the Next.js 16 repo `Mindfullfoodfitness` (branch `Dev`). Client sign-up and sign-in are built in code but the Supabase project is not yet set up to match. Use your Supabase access to finish the backend side. Do not change the design or copy of any page.

## How the app uses Supabase
- Env vars (already in `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only the public key is used. Never put a service-role key in the repo or in client code.
- `src/lib/auth.ts`:
  - `signUp({ firstName, lastName, email, password })` calls `supabase.auth.signUp` with `options.data = { first_name, last_name }` and `emailRedirectTo = <origin>/auth/callback?next=/dashboard`.
  - `signIn(email, password)` uses `signInWithPassword`.
- `src/app/auth/callback/route.ts` exchanges the email-confirmation `code` for a session, then redirects to `/dashboard` (or `/login?error=confirm` on failure).
- `src/app/dashboard/page.tsx` redirects to `/login?next=/dashboard` when there is no user, then reads `profiles` (`first_name, last_name, plan`) for `user.id` with `.maybeSingle()`.
- `src/proxy.ts` and `src/lib/supabase/proxy.ts` refresh the session on every request.

## Tasks
1. **Database.** Apply `supabase/profiles.sql` to the project (or the equivalent as a proper migration if the repo uses `supabase/migrations`). It creates `public.profiles` (id, first_name, last_name, plan, created_at), enables RLS with "read own" and "update own" policies, adds a `handle_new_user` trigger on `auth.users` that fills the profile from `raw_user_meta_data`, and backfills existing users. Review it first and fix anything that is wrong for this project. Do not let users edit their own `plan`: tighten the update policy or use a column-level grant so only `first_name` and `last_name` can be changed by the user.
2. **Auth settings.**
   - Site URL: the production domain (ask me if unknown), plus `http://localhost:3000` for development.
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `<production domain>/auth/callback`.
   - Email provider: password sign-in on, minimum password length 8. Tell me whether "Confirm email" is currently on, and leave it on unless I say otherwise.
   - Confirm the confirmation-email template links to `{{ .ConfirmationURL }}`, so it lands on `/auth/callback`.
3. **Verify end to end** against a throwaway account, then delete that account and its profile row:
   - Sign up through `http://localhost:3000/signup` (First name, Last name, Email, Password, Confirm password).
   - Confirm the user appears in `auth.users` with `first_name` and `last_name` in metadata, and a matching row exists in `public.profiles`.
   - Confirm the email link ends on `/dashboard`, the dashboard greets the person by name, and signing out and back in works.
   - Confirm a signed-in user cannot read another user's profile.
4. **Report back** with: what you changed, the exact settings values, whether "Confirm email" is on, anything that failed, and anything in the app code that needs changing. Do not edit app code unless a task above is blocked without it, and tell me what you changed.

## Rules
- Do not commit or push. Leave changes in the working tree.
- Do not create real client accounts or send emails to real people; use a throwaway address that you control.
- Never print or store secrets.
