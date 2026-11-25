import { isExcludedTmdbMedia } from "@/lib/providers/tmdb/filters";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import { getBestMoviePoster } from "@/lib/providers/tmdb/movies";
import type { CompanyDetails, CompanyWorkCredit, Movie, TmdbPaginatedResponse } from "@/lib/providers/tmdb/types";

export async function getCompanyDetails(
  id: string | number
): Promise<CompanyDetails> {
  const company = await fetchFromTmdb<CompanyDetails>(`/company/${id}`);

  const [moviesPage1, moviesPage2, moviesPage3, tvPage1] = await Promise.all([
    fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/discover/movie", {
      with_companies: String(id),
      page: 1,
      include_adult: "false",
      sort_by: "popularity.desc",
    }).catch(() => ({ results: [] as Movie[] } as TmdbPaginatedResponse<Movie>)),
    fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/discover/movie", {
      with_companies: String(id),
      page: 2,
      include_adult: "false",
      sort_by: "popularity.desc",
    }).catch(() => ({ results: [] as Movie[] } as TmdbPaginatedResponse<Movie>)),
    fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/discover/movie", {
      with_companies: String(id),
      page: 3,
      include_adult: "false",
      sort_by: "popularity.desc",
    }).catch(() => ({ results: [] as Movie[] } as TmdbPaginatedResponse<Movie>)),
    fetchFromTmdb<TmdbPaginatedResponse<any>>("/discover/tv", {
      with_companies: String(id),
      page: 1,
      include_adult: "false",
      sort_by: "popularity.desc",
    }).catch(() => ({ results: [] as any[] } as TmdbPaginatedResponse<any>)),
  ]);

  const rawMovies: CompanyWorkCredit[] = [
    ...(moviesPage1.results || []),
    ...(moviesPage2.results || []),
    ...(moviesPage3.results || []),
  ].map((m) => ({
    ...m,
    media_type: "movie" as const,
  }));

  const rawTv: CompanyWorkCredit[] = (tvPage1.results || []).map((t) => ({
    ...t,
    media_type: "tv" as const,
  }));

  const combined = [...rawMovies, ...rawTv];
  const uniqueWorks = Array.from(
    new Map(combined.map((item) => [`${item.media_type}-${item.id}`, item])).values()
  ).filter((item) => !isExcludedTmdbMedia(item));

  const targetMovies = uniqueWorks
    .filter((w) => w.media_type === "movie" && w.poster_path)
    .slice(0, 40);

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

  const enrichedWorks = uniqueWorks.map((work) => {
    if (work.media_type === "movie" && movieMap.has(work.id)) {
      return { ...work, poster_path: movieMap.get(work.id)! };
    }
    return work;
  });

  company.works = enrichedWorks;
  return company;
}

export async function getCompanyTopWorks(
  id: string | number
): Promise<string[]> {
  try {
    const data = await fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/discover/movie", {
      with_companies: String(id),
      page: 1,
      include_adult: "false",
      sort_by: "popularity.desc",
    });
    return (data.results || []).slice(0, 4).map((m) => m.title).filter(Boolean);
  } catch {
    return [];
  }
}
