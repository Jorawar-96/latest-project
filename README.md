# Greenline Payments

A role-based payment portal built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth, Postgres, and Storage.

## Setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the project API settings. Keep the service role key server-only.
3. Set `ADMIN_SECRET_KEY` to a long, random value. It is required to initialize or sign in to the administrator account and is never sent to the browser.
4. Run `supabase/migration.sql` in the Supabase SQL Editor. It creates the profile trigger, single-admin index, settings row, RLS policies, public QR bucket, and storage policies.
5. Install dependencies with `npm install`, then start the app with `npm run dev`.

If the app displays a Supabase setup screen, one or more values are missing or still set to the placeholders. After editing `.env.local`, restart the development server so Next.js reloads the environment.

Clients register at `/signup`; their role is assigned as `client` by the database trigger. The hidden administrator entry is `/admin-access`. The first valid administrator entry creates the single admin account. Later admin sign-ins require that account's email and password plus the secret key.

## Commands

- `npm run dev` starts the local development server.
- `npm run typecheck` checks TypeScript.
- `npm run lint` runs ESLint.
- `npm run build` creates a production build.

The admin-access limiter allows eight attempts per IP per 15-minute window in the current Node process. For horizontally scaled deployments, replace the in-memory limiter with a shared store such as Redis or a database-backed rate limiter.