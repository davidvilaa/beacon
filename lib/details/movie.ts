import { cacheLife } from "next/cache";
import { getMovieDetails } from "@/lib/providers/tmdb/movies";
import type { MovieDetails } from "@/lib/providers/tmdb/types";
import { isNotFoundError } from "@/lib/details/errors";

export async function getMovieDetail(id: string): Promise<MovieDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await getMovieDetails(id);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}
