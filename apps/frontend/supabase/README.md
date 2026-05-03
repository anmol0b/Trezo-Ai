# Waitlist Setup

This frontend stores waitlist signups through the server route at `app/api/waitlist/route.ts`.

## 1. Create the table

Open the Supabase SQL editor and run:

- `apps/frontend/supabase/waitlist_signups.sql`

That creates:

- `public.waitlist_signups`
- a case-insensitive unique index on email
- row level security enabled

## 2. Add environment variables

For local development, copy the values into `apps/frontend/.env.local`.

Required:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Optional fallback:

- `SUPABASE_SERVICE_ROLE_KEY`

The route helper reads `SUPABASE_SECRET_KEY` first, then falls back to `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Add the same variables in Vercel

In your Vercel project settings, add the same server-side environment variables so the deployed route can insert rows.

## 4. Test the flow

Submit the form on the coming-soon page.

Expected behavior:

- new email: stored in `waitlist_signups`
- duplicate email: friendly success-style message, no duplicate row
- invalid email: inline validation error from the API response
