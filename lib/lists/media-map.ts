import { createClient } from "@/lib/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

export interface RawListItemRef {
  media_type: string;
  media_id: number;
}

export interface CachedMediaMeta {
  title: string;
  seasonCount?: number;
  posterPath: string | null;
  backdropPath: string | null;
}

export async function fetchCachedMediaMap(
  supabase: BrowserSupabaseClient,
  items: RawListItemRef[]
): Promise<Map<string, CachedMediaMeta>> {
  const movieIds = Array.from(
    new Set(items.filter((i) => i.media_type === "movie").map((i) => i.media_id))
  );
  const seriesIds = Array.from(
    new Set(items.filter((i) => i.media_type === "tv").map((i) => i.media_id))
  );
  const animeIds = Array.from(
    new Set(items.filter((i) => i.media_type === "anime").map((i) => i.media_id))
  );
  const gameIds = Array.from(
    new Set(items.filter((i) => i.media_type === "game").map((i) => i.media_id))
  );

  const map = new Map<string, CachedMediaMeta>();

  const [moviesRes, seriesRes, animesRes, gamesRes] = await Promise.all([
    movieIds.length > 0
      ? supabase.from("movies").select("id, title, poster_path, backdrop_path").in("id", movieIds)
      : Promise.resolve({
          data: [] as { id: number; title: string; poster_path: string | null; backdrop_path: string | null }[],
        }),
    seriesIds.length > 0
      ? supabase.from("series").select("id, name, poster_path, backdrop_path, number_of_seasons").in("id", seriesIds)
      : Promise.resolve({
          data: [] as { id: number; name: string; poster_path: string | null; backdrop_path: string | null; number_of_seasons: number | null }[],
        }),
    animeIds.length > 0
      ? supabase.from("animes").select("id, title, poster_path, backdrop_path").in("id", animeIds)
      : Promise.resolve({
          data: [] as { id: number; title: string; poster_path: string | null; backdrop_path: string | null }[],
        }),
    gameIds.length > 0
      ? supabase.from("games").select("id, name, cover_url, backdrop_url").in("id", gameIds)
      : Promise.resolve({
          data: [] as { id: number; name: string; cover_url: string | null; backdrop_url: string | null }[],
        }),
  ]);

  for (const m of moviesRes.data || []) {
    map.set(`movie-${m.id}`, {
      title: m.title,
      posterPath: m.poster_path,
      backdropPath: m.backdrop_path,
    });
  }
  for (const s of seriesRes.data || []) {
    map.set(`tv-${s.id}`, {
      title: s.name,
      seasonCount: s.number_of_seasons ?? 0,
      posterPath: s.poster_path,
      backdropPath: s.backdrop_path,
    });
  }
  for (const a of animesRes.data || []) {
    const rawTitle = a.title as any;
    const titleStr =
      typeof rawTitle === "object" && rawTitle !== null
        ? rawTitle.english || rawTitle.romaji || rawTitle.native || "Anime"
        : String(rawTitle || "Anime");
    map.set(`anime-${a.id}`, {
      title: titleStr,
      posterPath: a.poster_path,
      backdropPath: a.backdrop_path,
    });
  }
  for (const g of (gamesRes.data as any) || []) {
    map.set(`game-${g.id}`, {
      title: g.name,
      posterPath: g.cover_url,
      backdropPath: g.backdrop_url,
    });
  }

  return map;
}
