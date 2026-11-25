import { fetchFromTmdb } from "@/lib/providers/tmdb/client";

const animeTaglineCache = new Map<number, string | null>();

export async function getAnimeTmdbTagline(
  animeId: number,
  titles: (string | null | undefined)[],
  isMovie: boolean
): Promise<string | null> {
  if (animeTaglineCache.has(animeId)) {
    return animeTaglineCache.get(animeId) || null;
  }

  const queries = titles.filter(Boolean) as string[];

  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    try {
      const endpoint = isMovie ? "/search/movie" : "/search/tv";
      const searchRes = await fetchFromTmdb<{ results?: { id: number }[] }>(endpoint, {
        query: cleanQuery,
      });

      if (searchRes.results && searchRes.results.length > 0) {
        const tmdbId = searchRes.results[0].id;
        const detailsEndpoint = isMovie ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
        const details = await fetchFromTmdb<{ tagline?: string }>(detailsEndpoint);
        const tagline = details.tagline?.trim() || null;
        animeTaglineCache.set(animeId, tagline);
        return tagline;
      }
    } catch {
    }
  }

  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    try {
      const multiRes = await fetchFromTmdb<{
        results?: { id: number; media_type: string }[];
      }>("/search/multi", { query: cleanQuery });

      const filtered = (multiRes.results || []).filter(
        (r) => r.media_type === "tv" || r.media_type === "movie"
      );
      if (filtered.length > 0) {
        const item = filtered[0];
        const detailsEndpoint = `/${item.media_type}/${item.id}`;
        const details = await fetchFromTmdb<{ tagline?: string }>(detailsEndpoint);
        const tagline = details.tagline?.trim() || null;
        animeTaglineCache.set(animeId, tagline);
        return tagline;
      }
    } catch {
    }
  }

  animeTaglineCache.set(animeId, null);
  return null;
}
