import { cacheLife } from "next/cache";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import type { TvSeasonSummary } from "@/lib/providers/tmdb/types";
import { regularSeasons, seasonHref, seasonTitle } from "@/lib/media/seasons";

const EXPAND_BATCH = 10;

async function getShowSeasons(tvId: number): Promise<TvSeasonSummary[]> {
  "use cache";
  cacheLife("hours");
  try {
    const data = await fetchFromTmdb<{ seasons?: TvSeasonSummary[] }>(`/tv/${tvId}`);
    return regularSeasons(data.seasons);
  } catch {
    return [];
  }
}

interface ShowItem {
  id: number | string;
  title?: string;
  media_type?: string;
  poster_path?: string | null;
  overview?: string | null;
  release_date?: string | null;
  [key: string]: unknown;
}

function expandShow<T extends ShowItem>(item: T, seasons: TvSeasonSummary[], sortBy: string): T[] {
  if (seasons.length === 0) return [item];

  const ordered = sortBy === "newest" ? [...seasons].reverse() : seasons;
  const showName = item.title || "";

  return ordered.map((season) => ({
    ...item,
    title: seasonTitle(showName, season, seasons.length),
    season_number: season.season_number,
    poster_path: season.poster_path || item.poster_path || null,
    overview: season.overview || item.overview || "",
    release_date: season.air_date || item.release_date || "",
    href: seasonHref(item.id, season.season_number),
  }));
}

export async function expandSeasons<T extends ShowItem>(
  ranked: T[],
  offset: number,
  limit: number,
  sortBy: string
): Promise<{ page: T[]; hasMore: boolean }> {
  const target = offset + limit;
  const expanded: T[] = [];
  let index = 0;

  while (index < ranked.length && expanded.length <= target) {
    const batch = ranked.slice(index, index + EXPAND_BATCH);
    index += batch.length;
    const seasonLists = await Promise.all(
      batch.map((item) =>
        item.media_type === "tv" ? getShowSeasons(Number(item.id)) : Promise.resolve(null)
      )
    );
    batch.forEach((item, i) => {
      const seasons = seasonLists[i];
      if (seasons) expanded.push(...expandShow(item, seasons, sortBy));
      else expanded.push(item);
    });
  }

  return {
    page: expanded.slice(offset, target),
    hasMore: expanded.length > target || index < ranked.length,
  };
}
