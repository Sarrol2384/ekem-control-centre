# Ekem Pharmacy — Manager Control Centre

Phase 1 Foundation for the Manager Control Centre demonstration application.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS) — configured via environment variables

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your Supabase URL and anon key to .env.local
npm run dev
```

Apply SQL migrations from `supabase/migrations/` in the Supabase SQL editor (or CLI) before signing in against a live project.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — Oxlint
- `npm run typecheck` — TypeScript project build check

## Phase 1 scope

Foundation only: app shell, navigation placeholders, auth architecture, schema/RLS migrations, and DEMO DATA labelling component. Module functionality is deferred.
