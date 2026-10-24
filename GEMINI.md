# Project Guidelines & Preferences

## Design Rules
- **No Neon Effects**: Do NOT add neon, glow, or colored drop-shadow effects (e.g. `shadow-[0_0_..._#a8dadc]`, `shadow-[...rgba(168,218,220,...)]`, `drop-shadow`) anywhere in the application UI (buttons, tab indicators, borders, cards, search bars, inputs, etc.). Use solid colors and clean borders only.
- **Logo Exception**: The ONLY element permitted to have a glow / neon effect is the BEACON logo in `components/ui/Logo.tsx`.

## Layout Rules
- **Container Max-Width**: Use `max-w-7xl` (`1280px`) as the standard maximum content width for all main application pages and layouts (e.g. `w-full max-w-7xl mx-auto px-6`), providing an expansive, modern desktop layout.

## Coding Rules
- **No Comments**: Strictly do NOT add comments (`//` or `/*`) in the code. Maintain a zero-comments policy across all code modifications.
- **Dev Server**: Do NOT execute `npm run dev`. The developer runs and controls the development server manually.
- **Git Commits**: Always commit all changes to the repository after completing each task, feature, or cleanup.

## Database Schema (Supabase)
Full DDL script is located in `supabase/schema.sql`.

- **`public.users`**:
  - `id`: uuid primary key (references auth.users)
  - `username`: text unique
  - `avatar_url`: text
  - `bio`: text default ''
  - `social_links`: jsonb default '[]'

- **`public.movies`**:
  - `id`: bigint primary key (TMDB movie ID)
  - `title`: text not null
  - `overview`: text
  - `poster_path`: text
  - `backdrop_path`: text
  - `created_at`, `updated_at`: timestamptz

- **`public.series`**:
  - `id`: bigint primary key (TMDB series ID)
  - `name`: text not null
  - `overview`: text
  - `poster_path`: text
  - `backdrop_path`: text
  - `number_of_seasons`, `number_of_episodes`: integer default 0
  - `status`: text
  - `created_at`, `updated_at`: timestamptz

- **`public.user_movies`**:
  - `id`: uuid primary key default gen_random_uuid()
  - `user_id`: uuid references public.users(id) on delete cascade
  - `movie_id`: bigint references public.movies(id) on delete cascade
  - `status`: text ('watched', 'watchlist')
  - `is_favorite`: boolean default false
  - `favorite_order`: smallint (1 to 4 for profile favorite slots)
  - `rating`: numeric(2, 1) (0.5 to 5.0)
  - `review`: text
  - `has_spoilers`: boolean default false
  - `custom_poster_path`, `custom_backdrop_path`: text
  - `watched_date`: date
  - `created_at`, `updated_at`: timestamptz
  - Unique constraint: `(user_id, movie_id)`
  - Partial unique index: `(user_id, favorite_order) where favorite_order is not null`

- **`public.user_series`**:
  - `id`: uuid primary key default gen_random_uuid()
  - `user_id`: uuid references public.users(id) on delete cascade
  - `series_id`: bigint references public.series(id) on delete cascade
  - `season_number`: integer not null default 1
  - `status`: text ('watching', 'watched', 'paused', 'dropped', 'watchlist')
  - `is_favorite`: boolean default false
  - `favorite_order`: smallint (1 to 4 for profile favorite slots)
  - `rating`: numeric(2, 1) (0.5 to 5.0)
  - `review`: text
  - `has_spoilers`: boolean default false
  - `custom_poster_path`, `custom_backdrop_path`: text
  - `last_watched_episode`: integer default 0
  - `watched_date`: date
  - `created_at`, `updated_at`: timestamptz
  - Unique constraint: `(user_id, series_id, season_number)`
  - Partial unique index: `(user_id, favorite_order) where favorite_order is not null`
