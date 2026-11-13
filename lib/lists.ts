import { createClient } from "@/lib/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

export interface RawListItemRef {
  media_type: string;
  media_id: number;
}

export interface CachedMediaMeta {
  title: string;
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

  const map = new Map<string, CachedMediaMeta>();

  const [moviesRes, seriesRes] = await Promise.all([
    movieIds.length > 0
      ? supabase.from("movies").select("id, title, poster_path, backdrop_path").in("id", movieIds)
      : Promise.resolve({
          data: [] as { id: number; title: string; poster_path: string | null; backdrop_path: string | null }[],
        }),
    seriesIds.length > 0
      ? supabase.from("series").select("id, name, poster_path, backdrop_path").in("id", seriesIds)
      : Promise.resolve({
          data: [] as { id: number; name: string; poster_path: string | null; backdrop_path: string | null }[],
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
      posterPath: s.poster_path,
      backdropPath: s.backdrop_path,
    });
  }

  return map;
}
