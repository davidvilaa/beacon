import { cacheLife } from "next/cache";
import { getAnimeById } from "@/lib/providers/anilist/media";
import { getAnimeTmdbTagline } from "@/lib/providers/tmdb/anime";
import type { AnimeMedia } from "@/lib/providers/anilist/types";

export async function getAnimeDetail(id: number): Promise<AnimeMedia | null> {
  "use cache";
  cacheLife("hours");
  const anime = await getAnimeById(id);
  if (!anime) return null;

  let tagline: string | null = null;
  try {
    tagline = await getAnimeTmdbTagline(
      id,
      [anime.title.english, anime.title.romaji, anime.title.native],
      anime.format === "MOVIE"
    );
  } catch {
    tagline = null;
  }

  return { ...anime, tagline };
}
