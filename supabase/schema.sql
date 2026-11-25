create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text null unique,
  avatar_url text null,
  bio text null default '',
  social_links jsonb null default '[]'::jsonb
);

alter table public.users enable row level security;

create policy "Perfiles visibles para todos"
  on public.users for select using (true);

create policy "Puedes actualizar tu propio perfil"
  on public.users for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Permitir subir avatares"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '-%');

create policy "Permitir actualizar avatares"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner_id = auth.uid()::text);

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

create table public.animes (
  id bigint not null primary key,
  title text not null,
  overview text null,
  poster_path text null,
  backdrop_path text null,
  format text null,
  episodes integer null default 0,
  status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.animes enable row level security;

create policy "animes_read_policy"
  on public.animes for select using (true);

create policy "animes_insert_policy"
  on public.animes for insert with check (auth.role() = 'authenticated');

create policy "animes_update_policy"
  on public.animes for update using (auth.role() = 'authenticated');

create trigger trigger_animes_updated_at
  before update on public.animes
  for each row execute function public.handle_updated_at();

create table public.games (
  id bigint not null primary key,
  name text not null,
  summary text null,
  cover_url text null,
  backdrop_url text null,
  first_release_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "games_read_policy"
  on public.games for select using (true);

create policy "games_insert_policy"
  on public.games for insert with check (auth.role() = 'authenticated');

create policy "games_update_policy"
  on public.games for update using (auth.role() = 'authenticated');

create trigger trigger_games_updated_at
  before update on public.games
  for each row execute function public.handle_updated_at();

create table public.user_movies (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  status text not null check (status in ('watched', 'watchlist')),
  is_favorite boolean not null default false,
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  watched_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_movies_user_movie_unique unique (user_id, movie_id)
);

create index idx_user_movies_user_id on public.user_movies (user_id);
create index idx_user_movies_movie_id on public.user_movies (movie_id);
create index idx_user_movies_status on public.user_movies (user_id, status);
create index idx_user_movies_favorite on public.user_movies (user_id, is_favorite);

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

create or replace function public.check_user_movies_favorites_limit()
returns trigger as $$
declare
  fav_count integer;
begin
  if new.is_favorite = true and (old is null or old.is_favorite = false) then
    perform pg_advisory_xact_lock(hashtext('favorites_movies_' || new.user_id::text));

    select count(*) into fav_count
    from public.user_movies
    where user_id = new.user_id
      and is_favorite = true
      and movie_id <> new.movie_id;

    if fav_count >= 5 then
      raise exception 'Maximum of 5 favorite movies reached';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_movies_favorites_limit
  before insert or update on public.user_movies
  for each row execute function public.check_user_movies_favorites_limit();

create table public.user_series (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  series_id bigint not null references public.series(id) on delete cascade,
  season_number integer not null default 1,
  status text not null check (status in ('watching', 'watched', 'paused', 'dropped', 'watchlist')),
  is_favorite boolean not null default false,
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  last_watched_episode integer null default 0,
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_series_user_season_unique unique (user_id, series_id, season_number)
);

create index idx_user_series_user_id on public.user_series (user_id);
create index idx_user_series_series_id on public.user_series (series_id);
create index idx_user_series_season on public.user_series (series_id, season_number);
create index idx_user_series_status on public.user_series (user_id, status);
create index idx_user_series_favorite on public.user_series (user_id, is_favorite);

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

create or replace function public.check_user_series_favorites_limit()
returns trigger as $$
declare
  fav_count integer;
begin
  if new.is_favorite = true and (old is null or old.is_favorite = false) then
    perform pg_advisory_xact_lock(hashtext('favorites_series_' || new.user_id::text));

    select count(*) into fav_count
    from public.user_series
    where user_id = new.user_id
      and is_favorite = true
      and not (series_id = new.series_id and season_number = new.season_number);

    if fav_count >= 5 then
      raise exception 'Maximum of 5 favorite series reached';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_series_favorites_limit
  before insert or update on public.user_series
  for each row execute function public.check_user_series_favorites_limit();

create table public.user_animes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  anime_id bigint not null references public.animes(id) on delete cascade,
  status text not null check (status in ('watching', 'watched', 'paused', 'dropped', 'watchlist')),
  is_favorite boolean not null default false,
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  last_watched_episode integer null default 0,
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_animes_user_anime_unique unique (user_id, anime_id)
);

create index idx_user_animes_user_id on public.user_animes (user_id);
create index idx_user_animes_anime_id on public.user_animes (anime_id);
create index idx_user_animes_status on public.user_animes (user_id, status);
create index idx_user_animes_favorite on public.user_animes (user_id, is_favorite);

alter table public.user_animes enable row level security;

create policy "user_animes_select_policy"
  on public.user_animes for select using (true);

create policy "user_animes_insert_policy"
  on public.user_animes for insert with check (auth.uid() = user_id);

create policy "user_animes_update_policy"
  on public.user_animes for update using (auth.uid() = user_id);

create policy "user_animes_delete_policy"
  on public.user_animes for delete using (auth.uid() = user_id);

create trigger trigger_user_animes_updated_at
  before update on public.user_animes
  for each row execute function public.handle_updated_at();

create or replace function public.check_user_animes_favorites_limit()
returns trigger as $$
declare
  fav_count integer;
begin
  if new.is_favorite = true and (old is null or old.is_favorite = false) then
    perform pg_advisory_xact_lock(hashtext('favorites_animes_' || new.user_id::text));

    select count(*) into fav_count
    from public.user_animes
    where user_id = new.user_id
      and is_favorite = true
      and anime_id <> new.anime_id;

    if fav_count >= 5 then
      raise exception 'Maximum of 5 favorite anime reached';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_animes_favorites_limit
  before insert or update on public.user_animes
  for each row execute function public.check_user_animes_favorites_limit();

create table public.user_games (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  game_id bigint not null references public.games(id) on delete cascade,
  status text not null check (status in ('watching', 'watched', 'paused', 'dropped', 'watchlist', 'playing', 'completed', 'backlog')),
  is_favorite boolean not null default false,
  rating numeric(2, 1) null check (rating >= 0.5 and rating <= 5.0),
  review text null,
  has_spoilers boolean not null default false,
  custom_poster_path text null,
  custom_backdrop_path text null,
  hours_played numeric(5, 1) null default 0,
  platform text null,
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_games_user_game_unique unique (user_id, game_id)
);

create index idx_user_games_user_id on public.user_games (user_id);
create index idx_user_games_game_id on public.user_games (game_id);
create index idx_user_games_status on public.user_games (user_id, status);
create index idx_user_games_favorite on public.user_games (user_id, is_favorite);

alter table public.user_games enable row level security;

create policy "user_games_select_policy"
  on public.user_games for select using (true);

create policy "user_games_insert_policy"
  on public.user_games for insert with check (auth.uid() = user_id);

create policy "user_games_update_policy"
  on public.user_games for update using (auth.uid() = user_id);

create policy "user_games_delete_policy"
  on public.user_games for delete using (auth.uid() = user_id);

create trigger trigger_user_games_updated_at
  before update on public.user_games
  for each row execute function public.handle_updated_at();

create or replace function public.check_user_games_favorites_limit()
returns trigger as $$
declare
  fav_count integer;
begin
  if new.is_favorite = true and (old is null or old.is_favorite = false) then
    perform pg_advisory_xact_lock(hashtext('favorites_games_' || new.user_id::text));

    select count(*) into fav_count
    from public.user_games
    where user_id = new.user_id
      and is_favorite = true
      and game_id <> new.game_id;

    if fav_count >= 5 then
      raise exception 'Maximum of 5 favorite games reached';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_games_favorites_limit
  before insert or update on public.user_games
  for each row execute function public.check_user_games_favorites_limit();

create table public.lists (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text null default '',
  is_private boolean not null default false,
  is_numbered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lists_user_id on public.lists (user_id);
create index idx_lists_is_private on public.lists (is_private);
create index idx_lists_updated_at on public.lists (updated_at desc);

alter table public.lists enable row level security;

create policy "lists_select_policy"
  on public.lists for select using (is_private = false or auth.uid() = user_id);

create policy "lists_insert_policy"
  on public.lists for insert with check (auth.uid() = user_id);

create policy "lists_update_policy"
  on public.lists for update using (auth.uid() = user_id);

create policy "lists_delete_policy"
  on public.lists for delete using (auth.uid() = user_id);

create trigger trigger_lists_updated_at
  before update on public.lists
  for each row execute function public.handle_updated_at();

create table public.list_items (
  id uuid not null default gen_random_uuid() primary key,
  list_id uuid not null references public.lists(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv', 'anime', 'game')),
  media_id bigint not null,
  season_number integer null,
  position integer not null default 0,
  notes text null,
  custom_poster_path text null,
  custom_backdrop_path text null,
  created_at timestamptz not null default now(),
  constraint list_items_unique unique nulls not distinct (list_id, media_type, media_id, season_number)
);

create index idx_list_items_list_id on public.list_items (list_id);
create index idx_list_items_media on public.list_items (media_type, media_id);
create index idx_list_items_season on public.list_items (media_type, media_id, season_number);
create index idx_list_items_position on public.list_items (list_id, position);

alter table public.list_items enable row level security;

create policy "list_items_select_policy"
  on public.list_items for select using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and (lists.is_private = false or lists.user_id = auth.uid())
    )
  );

create policy "list_items_insert_policy"
  on public.list_items for insert with check (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );

create policy "list_items_update_policy"
  on public.list_items for update using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );

create policy "list_items_delete_policy"
  on public.list_items for delete using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );

create table public.follows (
  id uuid not null default gen_random_uuid() primary key,
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_unique unique (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index idx_follows_follower_id on public.follows (follower_id);
create index idx_follows_following_id on public.follows (following_id);
create index idx_follows_created_at on public.follows (created_at desc);

alter table public.follows enable row level security;

create policy "follows_select_policy"
  on public.follows for select using (true);

create policy "follows_insert_policy"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "follows_delete_policy"
  on public.follows for delete using (auth.uid() = follower_id);
