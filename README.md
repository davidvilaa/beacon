# BEACON

Media logging platform for movies, TV series, anime and video games. Log what you watch and play, rate it, review it, pick favorites, build lists and follow other users.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Supabase (auth, Postgres with RLS, storage)
- TMDB (movies, TV, people, companies), AniList (anime), IGDB (games)

## Setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `TMDB_ACCESS_TOKEN`, `TMDB_API_KEY`
   - `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`
3. Create the database by running `supabase/schema.sql` on a new Supabase project. `supabase/reset.sql` drops every table and must never be run against production.
4. Start the app with `npm run dev`.

## Scripts

- `npm run dev`: development server
- `npm run build`: production build
- `npm run lint`: ESLint
