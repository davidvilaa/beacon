drop table if exists public.user_movies cascade;
drop table if exists public.user_series cascade;
drop table if exists public.movies cascade;
drop table if exists public.series cascade;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.movies (
  id bigint not null primary key,
  title text not null,
  overview text null,
  poster_path text null,
  backdrop_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.movies enable row level security;

create policy "movies_read_policy"
  on public.movies for select using (true);

create policy "movies_insert_policy"
  on public.movies for insert with check (auth.role() = 'authenticated');

create policy "movies_update_policy"
  on public.movies for update using (auth.role() = 'authenticated');

create trigger trigger_movies_updated_at
  before update on public.movies
  for each row execute function public.handle_updated_at();

create table public.series (
  id bigint not null primary key,
  name text not null,
  overview text null,
  poster_path text null,
  backdrop_path text null,
  number_of_seasons integer null default 0,
  number_of_episodes integer null default 0,
  status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.series enable row level security;

create policy "series_read_policy"
  on public.series for select using (true);

create policy "series_insert_policy"
  on public.series for insert with check (auth.role() = 'authenticated');

create policy "series_update_policy"
  on public.series for update using (auth.role() = 'authenticated');

create trigger trigger_series_updated_at
  before update on public.series
  for each row execute function public.handle_updated_at();

create table public.user_movies (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  is_watched boolean not null default false,
  watched_date date null,
  is_watchlist boolean not null default false,
  is_favorite boolean not null default false,
  favorite_order smallint null check (favorite_order >= 1 and favorite_order <= 4),
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_movies_user_movie_unique unique (user_id, movie_id)
);

create unique index user_movies_user_favorite_order_idx
  on public.user_movies (user_id, favorite_order)
  where favorite_order is not null;

create index idx_user_movies_user_id on public.user_movies (user_id);
create index idx_user_movies_movie_id on public.user_movies (movie_id);

alter table public.user_movies enable row level security;

create policy "user_movies_select_policy"
  on public.user_movies for select using (true);

create policy "user_movies_insert_policy"
  on public.user_movies for insert with check (auth.uid() = user_id);

create policy "user_movies_update_policy"
  on public.user_movies for update using (auth.uid() = user_id);

create policy "user_movies_delete_policy"
  on public.user_movies for delete using (auth.uid() = user_id);

create trigger trigger_user_movies_updated_at
  before update on public.user_movies
  for each row execute function public.handle_updated_at();

create table public.user_series (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  series_id bigint not null references public.series(id) on delete cascade,
  status text not null default 'plan_to_watch' check (status in ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch')),
  is_favorite boolean not null default false,
  favorite_order smallint null check (favorite_order >= 1 and favorite_order <= 4),
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  last_watched_episode integer null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_series_user_series_unique unique (user_id, series_id)
);

create unique index user_series_user_favorite_order_idx
  on public.user_series (user_id, favorite_order)
  where favorite_order is not null;

create index idx_user_series_user_id on public.user_series (user_id);
create index idx_user_series_series_id on public.user_series (series_id);

alter table public.user_series enable row level security;

create policy "user_series_select_policy"
  on public.user_series for select using (true);

create policy "user_series_insert_policy"
  on public.user_series for insert with check (auth.uid() = user_id);

create policy "user_series_update_policy"
  on public.user_series for update using (auth.uid() = user_id);

create policy "user_series_delete_policy"
  on public.user_series for delete using (auth.uid() = user_id);

create trigger trigger_user_series_updated_at
  before update on public.user_series
  for each row execute function public.handle_updated_at();
