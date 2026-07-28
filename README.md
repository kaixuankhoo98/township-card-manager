# Township Card Manager

A small web app for tracking Township co-op card collections (rarity, ownership, etc.) with family.

Each co-op member picks their name and enters a shared passphrase to get in — there's no real
account system. Everyone can see who owns which card, mark cards they own, and log when they send
a card to someone else. Gold and Diamond cards can never be sent (matches the game's rules), and
any send can be undone later from the History page.

## Stack

- React + TypeScript, built with Vite, styled with Tailwind CSS
- Supabase (Postgres) for shared data — ownership and send history
- Deployed as a static site (e.g. Vercel), both on free tiers

## One-time project setup

1. Create a free [Supabase](https://supabase.com) project.
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Set the shared co-op passphrase (also in the SQL editor):
   ```sql
   insert into app_secrets (passphrase_hash) values (crypt('choose-a-passphrase', gen_salt('bf')));
   ```
4. In the Supabase dashboard, grab the Project URL and anon public key (Project Settings → API).

## Running locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from the Supabase dashboard (step 4 above)
   - `SUPABASE_SERVICE_ROLE_KEY` — also from Project Settings → API (only used by the sync script below, never sent to the browser)
3. `npm run dev` — starts the app at `http://localhost:5173`
4. `npm run sync-catalog` — pushes `src/data/catalog/*.json` and `src/data/roster.json` into Supabase (see below)

## Updating the monthly card catalog

The card list rotates roughly monthly and is maintained as a JSON file, not through an admin UI:

1. Copy the current file, e.g. `src/data/catalog/2026-07.json` → `src/data/catalog/2026-08.json`, and edit its categories/cards/rarities.
2. Add the new file to `CATALOG_FILES` and update `CURRENT_CATALOG_VERSION` in `src/lib/catalog.ts` to point at it.
3. Run `npm run sync-catalog` (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) to push the new categories/cards into Supabase. Nothing from previous months is deleted — past ownership and send history stay intact.
4. Commit the new JSON file and the updated pointer, then push — the deployed site picks it up on the next deploy.

Adding or removing a co-op member works the same way: edit `src/data/roster.json`, then run `npm run sync-catalog`.

## Deploying

1. Push this repo to GitHub (or your Git host of choice).
2. Create a new Vercel project from the repo (framework preset: Vite).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables (same values as `.env.local` — the service role key is never needed on Vercel, since the sync script only runs locally).
4. Deploy. Every push to the main branch will auto-deploy.

## Security note

There's no real per-person login — anyone who knows the shared passphrase can act as any roster
member. This is intentional: it's meant to stop outsiders who stumble on the URL from writing
data, not to stop one co-op member from impersonating another. If that's ever a problem, everyone
already knows each other, so it's a conversation, not a code fix.
