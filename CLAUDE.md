@AGENTS.md

# BEACON

Media logging platform (Letterboxd / Backloggd / AniList style) for **movies, TV series, anime and video games**. Users log what they watch/play, rate (0.5–5.0), review, mark favorites, build lists and follow each other. Future modules (comics, manga, books, music) are planned but NOT in scope yet — do not scaffold them unless asked.

## Hard Rules (ALWAYS follow)

### Design
- **No neon effects**: never add neon, glow or colored drop-shadow effects (e.g. `shadow-[0_0_..._#a8dadc]`, `shadow-[...rgba(168,218,220,...)]`, `drop-shadow`) anywhere in the UI (buttons, tab indicators, borders, cards, search bars, inputs...). Solid colors and clean borders only.
- **Logo exception**: the ONLY element allowed to glow is the BEACON logo in `components/ui/Logo.tsx`.
- **Palette**: dark UI on zinc (`bg-zinc-900` / `#09090b` background, `#fafafa` foreground). Accent `#a8dadc`, accent hover `#8ec5c8`. Reuse these, don't introduce new accent colors.
- Reuse existing UI primitives in `components/ui/` (`Button`/`PrimaryButton`/`SecondaryButton`, `Select`, `Checkbox`, `DatePicker`, `Toast`, `Loading`, `MediaCard`, `ListCard`...) instead of hand-rolling new ones.

### Layout
- **Container max-width**: `max-w-7xl` (1280px) for all main pages and layouts, e.g. `w-full max-w-7xl mx-auto px-6`.

### Code
- **Zero comments**: never add comments (`//` or `/* */`) in code. Applies to every modification.
- **Dev server**: never run `npm run dev`. David runs and controls the dev server manually.
- **Git**: commit all changes after completing each task, feature or cleanup (only when a shell on David's machine is available; otherwise tell him what to commit).
- User-facing feedback goes through toasts (`useToast().addToast(message, "error" | ...)`), not `alert()`.

## Stack
- **Next.js 16** (App Router, Turbopack, `cacheComponents`, `partialPrefetching`). This is NOT the Next.js from training data — read `node_modules/next/dist/docs/` before using unfamiliar APIs. Note: middleware is `proxy.ts` (exports `proxy`), not `middleware.ts`.
- **React 19.3**, **TypeScript** strict, **Tailwind CSS v4** (CSS-first config in `app/globals.css`, no tailwind.config).
- **Supabase** (`@supabase/ssr`, browser client only: `lib/supabase/client.ts` → `createClient()`). Auth via `supabase.auth`. Storage bucket `avatars`.
- Icons: `lucide-react`, `react-icons`.
- Path alias: `@/*` → project root.
- Commands: `npm run build`, `npm run lint` (eslint 9 flat config).

## External data sources
| Module | Source | Lib | Env vars |
|---|---|---|---|
| Movies, TV, People, Companies | TMDB | `lib/tmdb.ts` | `TMDB_ACCESS_TOKEN`, `TMDB_API_KEY` |
| Anime | AniList (GraphQL) | `lib/anilist.ts` | — |
| Games | IGDB (Twitch OAuth) | `lib/igdb.ts` | `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` |

Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. All in `.env.local` (never read, print or commit it).

Content filtering (excluded TMDB genres like talk shows/news/reality/soap/kids/music/TV movie, and Asian animation removed from TV so it lives in the anime module) is centralized in `config/content-filters.ts`.

## Project structure
```
app/
  (public)/login, register           auth pages
  (protected)/                       pages with Navbar (layout.tsx)
    movie/[id] tv/[id] anime/[id] game/[id]    media detail pages (client components)
    person/[id] company/[id]         TMDB people & companies
    lists/[id] review/[id]           list & review detail
    profile/[username]/{movies,series,anime,games,lists,network}
    search, settings, profile
  (admin)/                           empty placeholder
  api/                               server routes proxying external APIs
    movies/[id], movies/search (global multi-module search incl. users/lists)
    tv/[id], tv/[id]/season/[seasonNumber]
    anime/[id]/{episodes,posters,backdrops}
    games/[id]/{posters,backdrops}
    movies|tv/[id]/{posters,backdrops}, person/[id], company/[id]
components/
  layout/Navbar.tsx
  modules/MediaLayout.tsx            shared layout for every media detail page
  modules/columns/                   MediaActionColumn (status/fav/rating), MediaInfoColumn, MediaSocialColumn
  modules/modals/                    MediaReviewModal (log/review), ListModal, CreateListModal, Artwork/BackdropPickerModal
  modules/tabs/                      Cast, Crew, Details, Episodes, Releases, MediaTabsNav
  profile/                           ProfileContext + profile tabs, FollowButton
  ui/                                design-system primitives
lib/                                 tmdb, anilist, igdb, lists (cached media lookup), media-utils
config/content-filters.ts
supabase/schema.sql                  DDL (see warnings below)
```

### Patterns
- Media detail pages are `"use client"` and share the same composition: `MediaLayout` + action/info columns + tabs + review/list/artwork modals. When adding or changing a feature for one module, check whether the other 3 modules need the same change to stay consistent.
- Media metadata is cached in Supabase (`movies`, `series`, `animes`, `games`) via `upsert` when a user logs it or adds it to a list. Lists resolve titles/artwork from this cache (`lib/lists.ts → fetchCachedMediaMap`).
- `media_type` values everywhere: `'movie' | 'tv' | 'anime' | 'game'`.
- Users can override artwork per log/list item via `custom_poster_path` / `custom_backdrop_path`.

## Database schema (Supabase)
Full DDL in `supabase/schema.sql` (create-only, mirrors the live DB). `supabase/reset.sql` holds the `drop table ... cascade` statements for every table — never run it against the live DB without David's explicit OK. When the schema changes, update BOTH `schema.sql` and this section.

- **`public.users`**
  - `id` uuid PK (references `auth.users`, on delete cascade)
  - `username` text unique (nullable in DB; the register form enforces 3–20 chars `[a-zA-Z0-9_]`)
  - `avatar_url` text
  - `bio` text default `''`
  - `social_links` jsonb default `'[]'`
  - No `created_at`/`updated_at`. RLS: select public; update only `auth.uid() = id`; no insert policy (rows are created by trigger `on_auth_user_created` → `handle_new_user()`, security definer, copying `username` and `avatar_url` from signup metadata).

- **`public.movies`** — `id` bigint PK (TMDB id), `title` text not null, `overview`, `poster_path`, `backdrop_path`, `created_at`, `updated_at`
- **`public.series`** — `id` bigint PK (TMDB id), `name` text not null, `overview`, `poster_path`, `backdrop_path`, `number_of_seasons` int default 0, `number_of_episodes` int default 0, `created_at`, `updated_at`
- **`public.animes`** — `id` bigint PK (AniList id), `title` text not null, `overview`, `poster_path`, `backdrop_path`, `format`, `episodes` int default 0, `status`, `created_at`, `updated_at`
- **`public.games`** — `id` bigint PK (IGDB id), `name` text not null, `summary`, `cover_url`, `backdrop_url`, `first_release_date` timestamptz, `created_at`, `updated_at`

  Cache tables RLS: select public; insert/update for `authenticated`.

- **`public.user_movies`** — unique `(user_id, movie_id)`
  - `id` uuid PK, `user_id` → users, `movie_id` → movies
  - `status` in `('watched','watchlist')`
  - `is_favorite` bool, `rating` numeric(2,1) 0.5–5.0, `review`, `has_spoilers` bool
  - `custom_poster_path`, `custom_backdrop_path`, `watched_date` date, `created_at`, `updated_at`

- **`public.user_series`** — unique `(user_id, series_id, season_number)` (logged **per season**)
  - `id`, `user_id`, `series_id` → series, `season_number` int not null default 1
  - `status` in `('watching','watched','paused','dropped','watchlist')`
  - `is_favorite`, `rating`, `review`, `has_spoilers`, `custom_poster_path`, `custom_backdrop_path`
  - `last_watched_episode` int default 0, `start_date`, `end_date`, `created_at`, `updated_at`

- **`public.user_animes`** — unique `(user_id, anime_id)`
  - same as user_series without `season_number`; `anime_id` → animes

- **`public.user_games`** — unique `(user_id, game_id)`
  - `status` in `('watching','watched','paused','dropped','watchlist','playing','completed','backlog')` (UI currently uses the watch-style values)
  - `is_favorite`, `rating`, `review`, `has_spoilers`, `custom_poster_path`, `custom_backdrop_path`
  - `hours_played` numeric(5,1) default 0, `platform` text, `start_date`, `end_date`, `created_at`, `updated_at`

  `user_*` RLS: select public; insert/update/delete only `auth.uid() = user_id`.

- **`public.lists`** — `id` uuid PK, `user_id`, `title` not null, `description` default `''`, `is_private` bool, `is_numbered` bool, `created_at`, `updated_at`. RLS: visible if public or owner.
- **`public.list_items`** — unique `nulls not distinct (list_id, media_type, media_id, season_number)`
  - `id`, `list_id` → lists, `media_type` in `('movie','tv','anime','game')`, `media_id` bigint
  - `season_number` int (only for tv), `position` int default 0, `notes`, `custom_poster_path`, `custom_backdrop_path`, `created_at`
  - RLS follows the parent list.
- **`public.follows`** — unique `(follower_id, following_id)`, check `follower_id <> following_id`; `id`, `follower_id`, `following_id`, `created_at`. RLS: select public; insert/delete only by follower.

- **Favorites limit**: max **5 favorites per user per media type**, enforced by triggers `check_user_{movies,series,animes,games}_favorites_limit` + client-side checks with toasts.
- `handle_updated_at()` trigger keeps `updated_at` fresh on every table that has it.
- **Storage**: bucket `avatars` (profile pictures, uploaded from `settings`).
