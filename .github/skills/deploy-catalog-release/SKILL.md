---
name: deploy-catalog-release
description: 'Validate, sync, commit, and push a new or updated Township catalog (or other pending changes) so Vercel auto-deploys it. Use when the user asks to deploy, ship, release, or push catalog changes to git.'
argument-hint: 'Optionally name the catalog version being released; otherwise deploys whatever catalog/data changes are currently pending.'
user-invocable: true
---

# Deploy Catalog Release

Take a new or updated catalog (and any other pending changes) from working tree to a deployed
production site.

## Repository Context

- Catalog files: `src/data/catalog/*.json`, registered in `src/lib/catalog.ts`.
- `npm run sync-catalog` pushes `src/data/catalog/*.json` and `src/data/roster.json` into
  Supabase; it needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Nothing from previous months is
  deleted.
- The site is deployed on Vercel and auto-deploys on every push to `main` — there is no separate
  manual deploy step once the push lands.

## Procedure

1. Run `git status` and review what's pending. Confirm the catalog changes are wired up: a new
   catalog file is imported in `CATALOG_FILES` in `src/lib/catalog.ts`, and
   `CURRENT_CATALOG_VERSION` points at it if it should be active.
2. Validate the catalog JSON and the project: run `npm run build` (runs `tsc -b` then
   `vite build`). Fix any errors before continuing — do not push a build that fails.
3. Run `npm run sync-catalog` to push the catalog/roster data into Supabase. This must happen
   before or alongside the git push; the deployed app reads catalog structure from Supabase, not
   just from the bundled JSON.
4. Stage only the relevant files (catalog JSON, `src/lib/catalog.ts`, `src/data/roster.json`, and
   any other files genuinely part of this change) — avoid a blanket `git add -A`.
5. Commit with a message describing the release (e.g. the collection name/version).
6. Push to `main`. This is what triggers the Vercel auto-deploy, so only do it when the user has
   actually asked to deploy/ship/push — confirm first if that intent is ambiguous.
7. Report what was synced (category/card counts from the sync-catalog output) and that the push
   landed, noting Vercel will auto-deploy from it.

## Important Rules

- Never push before `npm run sync-catalog` has succeeded for a new/changed catalog — a deployed
  app pointing at catalog data that isn't in Supabase yet will be broken for users.
- Never skip the build/typecheck step to save time; catalog JSON errors surface there.
- Don't force-push or amend existing commits to get a release out.

## Output Checklist

Before finishing, verify:

- `npm run build` succeeded.
- `npm run sync-catalog` ran and reported the expected version, category, and card counts.
- Only the intended files were committed.
- The push to `main` succeeded (or, if it was held back for confirmation, say so explicitly).
