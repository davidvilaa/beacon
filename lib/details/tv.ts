import { cacheLife } from "next/cache";
import { getTvDetails } from "@/lib/providers/tmdb/tv";
import type { TvDetails } from "@/lib/providers/tmdb/types";
import { isNotFoundError } from "@/lib/details/errors";

export async function getTvDetail(id: string, season: number): Promise<TvDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await getTvDetails(id, season);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export function resolveSeason(tv: TvDetails, requested: number): number {
  const regular = (tv.seasons || []).filter((s) => s.season_number > 0);
  return regular.some((s) => s.season_number === requested)
    ? requested
    : regular[0]?.season_number ?? 1;
}
