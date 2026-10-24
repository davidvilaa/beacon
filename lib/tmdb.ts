import { isExcludedTmdbMedia } from "@/config/content-filters";

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getPosterUrl(
  path: string | null,
  size: "w92" | "w185" | "w342" | "w500" | "original" = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

async function fetchFromTmdb<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();

  const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
  const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
  const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  if (!url.searchParams.has("language")) {
    url.searchParams.set("language", "en-US");
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  } else if (rawKey) {
    url.searchParams.set("api_key", rawKey);
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`TMDB error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<Movie>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/search/movie", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (movie) => !isExcludedTmdbMedia(movie)
  );

  return {
    ...data,
    results: filtered,
  };
}

export interface TvShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
}

export interface MultiSearchItem {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
}

export async function searchTv(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<TvShow>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<TvShow>>("/search/tv", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (tv) => !isExcludedTmdbMedia(tv)
  );

  return {
    ...data,
    results: filtered,
  };
}

export async function searchMulti(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<MultiSearchItem>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<MultiSearchItem>>("/search/multi", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (item) => item.media_type !== "person" && !isExcludedTmdbMedia(item)
  );

  return {
    ...data,
    results: filtered,
  };
}

export interface MovieCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MovieCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string | null;
}

export interface MovieImage {
  file_path: string;
  vote_average: number;
  vote_count?: number;
  aspect_ratio?: number;
  iso_639_1?: string | null;
  width?: number;
  height?: number;
}

export interface MovieReleaseDateItem {
  certification: string;
  descriptors: string[];
  iso_639_1?: string;
  note?: string;
  release_date: string;
  type: number;
}

export interface MovieCountryRelease {
  iso_3166_1: string;
  release_dates: MovieReleaseDateItem[];
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface AlternativeTitleItem {
  iso_3166_1: string;
  title: string;
  type: string;
}

export interface MovieCollectionItem {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

export interface MovieDetails extends Movie {
  tagline: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  status: string;
  budget?: number;
  revenue?: number;
  original_language?: string;
  production_companies?: ProductionCompany[];
  credits?: {
    cast: MovieCast[];
    crew: MovieCrew[];
  };
  images?: {
    backdrops: MovieImage[];
    posters: MovieImage[];
  };
  release_dates?: {
    results: MovieCountryRelease[];
  };
  alternative_titles?: {
    titles: AlternativeTitleItem[];
  };
  belongs_to_collection?: MovieCollectionItem | null;
  collection?: CollectionDetails | null;
}

export interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  department?: string;
  jobs?: string[];
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  media_type: "movie" | "tv";
  popularity: number;
  genre_ids?: number[];
  overview?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  known_for_department: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  also_known_as?: string[];
  external_ids?: {
    imdb_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
    facebook_id?: string | null;
    wikidata_id?: string | null;
  };
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
}

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
    const valid = (data.posters || []).filter(
      (p) =>
        Boolean(p.file_path) &&
        (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
    );
    const sorted = [...valid].sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    const best = sorted[0]?.file_path || null;
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
    append_to_response: "credits,images,release_dates,alternative_titles",
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
              const valid = data.images.posters.filter(
                (p) =>
                  Boolean(p.file_path) &&
                  (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
              );
              const sorted = [...valid].sort((a, b) => {
                const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
                if (countDiff !== 0) return countDiff;
                return (b.vote_average ?? 0) - (a.vote_average ?? 0);
              });
              return {
                ...part,
                poster_path: sorted[0]?.file_path || part.poster_path,
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

export interface CompanyWorkCredit {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  media_type: "movie" | "tv";
  overview?: string;
  genre_ids?: number[];
}

export interface CompanyDetails {
  id: number;
  name: string;
  description?: string;
  headquarters?: string;
  homepage?: string;
  logo_path: string | null;
  origin_country?: string;
  parent_company?: {
    id: number;
    name: string;
    logo_path: string | null;
  } | null;
  works?: CompanyWorkCredit[];
}

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

export interface TvEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TvSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episode_count: number;
  vote_average?: number;
}

export interface TvSeasonDetails extends TvSeasonSummary {
  episodes: TvEpisode[];
  credits?: {
    cast: MovieCast[];
    crew: MovieCrew[];
  };
  images?: {
    posters: MovieImage[];
  };
}

export interface TvDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  tagline: string | null;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  original_language?: string;
  created_by?: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  networks?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  production_companies?: ProductionCompany[];
  seasons: TvSeasonSummary[];
  credits?: {
    cast: MovieCast[];
    crew: MovieCrew[];
  };
  aggregate_credits?: {
    cast: (MovieCast & { roles?: { character: string; episode_count: number }[] })[];
    crew: MovieCrew[];
  };
  images?: {
    backdrops: MovieImage[];
    posters: MovieImage[];
  };
  initialSeason?: TvSeasonDetails;
}

export async function getTvDetails(
  id: string | number,
  initialSeasonNumber: number = 1
): Promise<TvDetails> {
  const data = await fetchFromTmdb<TvDetails>(`/tv/${id}`, {
    append_to_response: "images,credits,aggregate_credits,external_ids",
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
    append_to_response: "credits,images",
  });
  return season;
}
