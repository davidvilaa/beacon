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
  original_language?: string;
  origin_country?: string[];
}

export interface MultiSearchItem {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: any[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  original_language?: string;
  origin_country?: string[];
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

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
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
  videos?: {
    results: TmdbVideo[];
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
  media_type: "movie" | "tv" | "anime";
  popularity: number;
  genre_ids?: number[];
  overview?: string;
}

export interface PersonDetails {
  id: number | string;
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
  media_type: "movie" | "tv" | "anime";
  overview?: string;
  genre_ids?: number[];
}

export interface CompanyDetails {
  id: number | string;
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
  videos?: {
    results: TmdbVideo[];
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
  videos?: {
    results: TmdbVideo[];
  };
  initialSeason?: TvSeasonDetails;
}
