import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import type { TvDetails, TvSeasonDetails } from "@/lib/providers/tmdb/types";

export async function getTvDetails(
  id: string | number,
  initialSeasonNumber: number = 1
): Promise<TvDetails> {
  const data = await fetchFromTmdb<TvDetails>(`/tv/${id}`, {
    append_to_response: "images,credits,aggregate_credits,external_ids,videos",
    include_image_language: "en,null",
  });

  const availableSeasons = (data.seasons || []).filter((s) => s.season_number > 0);
  const targetSeasonNum =
    availableSeasons.find((s) => s.season_number === initialSeasonNumber)?.season_number ??
    availableSeasons[0]?.season_number ??
    1;

  try {
    const seasonData = await getTvSeasonDetails(id, targetSeasonNum);
    data.initialSeason = seasonData;
  } catch {
    data.initialSeason = undefined;
  }

  return data;
}

export async function getTvSeasonDetails(
  tvId: string | number,
  seasonNumber: number
): Promise<TvSeasonDetails> {
  const season = await fetchFromTmdb<TvSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`, {
    append_to_response: "credits,images,videos",
  });
  return season;
}
