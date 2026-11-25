import { cacheLife } from "next/cache";
import { getGameArtworks, getGameDetails } from "@/lib/providers/igdb/games";
import type { IGDBGameDetail } from "@/lib/providers/igdb/types";

export async function getGameDetail(id: number): Promise<IGDBGameDetail | null> {
  "use cache";
  cacheLife("hours");
  return getGameDetails(id);
}

export async function getGameArtworkLists(id: number): Promise<{ posters: string[]; backdrops: string[] }> {
  "use cache";
  cacheLife("days");
  return getGameArtworks(id);
}
