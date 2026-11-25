import { isExcludedTmdbMedia } from "@/lib/providers/tmdb/filters";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import { getBestMoviePoster } from "@/lib/providers/tmdb/movies";
import type { PersonCredit, PersonDetails } from "@/lib/providers/tmdb/types";

export async function getPersonDetails(
  id: string | number
): Promise<PersonDetails> {
  const data = await fetchFromTmdb<PersonDetails>(`/person/${id}`, {
    append_to_response: "combined_credits,external_ids",
  });

  if (data?.combined_credits) {
    const cast = (data.combined_credits.cast || []).filter(
      (credit) => !isExcludedTmdbMedia(credit)
    );
    const crew = (data.combined_credits.crew || []).filter(
      (credit) => !isExcludedTmdbMedia(credit)
    );

    const allCredits = [...cast, ...crew];
    const uniqueMovies = Array.from(
      new Map(
        allCredits
          .filter((c) => c.media_type === "movie" && c.id && c.poster_path)
          .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
          .map((c) => [c.id, c])
      ).values()
    );

    const targetMovies = uniqueMovies.slice(0, 40);
    const movieMap = new Map<number, string>();
    const batchSize = 10;

    for (let i = 0; i < targetMovies.length; i += batchSize) {
      const chunk = targetMovies.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (movie) => {
          const best = await getBestMoviePoster(movie.id);
          if (best) {
            movieMap.set(movie.id, best);
          }
        })
      );
    }

    const enrichCredit = (c: PersonCredit) => {
      if (c.media_type === "movie" && movieMap.has(c.id)) {
        return { ...c, poster_path: movieMap.get(c.id)! };
      }
      return c;
    };

    data.combined_credits = {
      cast: cast.map(enrichCredit),
      crew: crew.map(enrichCredit),
    };
  }

  return data;
}
