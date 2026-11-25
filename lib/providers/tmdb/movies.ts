import { pickBestPoster } from "@/lib/artwork/pick";
import { isExcludedTmdbMedia } from "@/lib/providers/tmdb/filters";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import type { CollectionDetails, MovieDetails, MovieImage } from "@/lib/providers/tmdb/types";

const posterCache = new Map<number, string>();

export async function getBestMoviePoster(
  movieId: number | string
): Promise<string | null> {
  const numId = typeof movieId === "number" ? movieId : parseInt(movieId, 10);
  if (numId && posterCache.has(numId)) {
    return posterCache.get(numId)!;
  }

  try {
    const data = await fetchFromTmdb<{ posters?: MovieImage[] }>(
      `/movie/${movieId}/images`,
      { include_image_language: "en,null" }
    );
    const best = pickBestPoster(data.posters);
    if (numId && best) {
      if (posterCache.size > 2000) {
        posterCache.clear();
      }
      posterCache.set(numId, best);
    }
    return best;
  } catch {
    return null;
  }
}

export async function getCollectionDetails(
  id: string | number
): Promise<CollectionDetails | null> {
  try {
    return await fetchFromTmdb<CollectionDetails>(`/collection/${id}`);
  } catch {
    return null;
  }
}

export async function getMovieDetails(
  id: string | number
): Promise<MovieDetails> {
  const data = await fetchFromTmdb<MovieDetails>(`/movie/${id}`, {
    append_to_response: "credits,images,release_dates,alternative_titles,videos",
    include_image_language: "en,null",
  });

  if (data?.belongs_to_collection?.id) {
    try {
      const coll = await getCollectionDetails(data.belongs_to_collection.id);
      if (coll?.parts) {
        const sortedParts = coll.parts
          .filter((credit) => !isExcludedTmdbMedia(credit))
          .sort((a, b) =>
            (a.release_date || "9999").localeCompare(b.release_date || "9999")
          );

        const enrichedParts = await Promise.all(
          sortedParts.map(async (part) => {
            if (part.id === data.id && data.images?.posters) {
              return {
                ...part,
                poster_path: pickBestPoster(data.images.posters) || part.poster_path,
              };
            }

            const bestPoster = await getBestMoviePoster(part.id);
            return {
              ...part,
              poster_path: bestPoster || part.poster_path,
            };
          })
        );

        coll.parts = enrichedParts;
        data.collection = coll;
      }
    } catch {
      data.collection = null;
    }
  }

  return data;
}
