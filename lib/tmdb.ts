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
        coll.parts = coll.parts
          .filter((credit) => !isExcludedTmdbMedia(credit))
          .sort((a, b) =>
            (a.release_date || "9999").localeCompare(b.release_date || "9999")
          );
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
    data.combined_credits = { cast, crew };
  }

  return data;
}
