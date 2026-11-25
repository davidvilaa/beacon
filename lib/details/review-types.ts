import type { MediaType } from "@/lib/media/types";

export type ReviewMediaType = MediaType;

export const REVIEW_MEDIA_TYPES: ReviewMediaType[] = ["movie", "tv", "anime", "game"];

export const REVIEW_TABLES: Record<ReviewMediaType, string> = {
  movie: "user_movies",
  tv: "user_series",
  anime: "user_animes",
  game: "user_games",
};

export const REVIEW_TYPE_LABELS: Record<ReviewMediaType, string> = {
  movie: "Movie",
  tv: "Series",
  anime: "Anime",
  game: "Game",
};

export const STATUS_LABELS: Record<string, string> = {
  watched: "Watched",
  watching: "Watching",
  paused: "Paused",
  dropped: "Dropped",
  watchlist: "Watchlist",
};

export const GAME_STATUS_LABELS: Record<string, string> = {
  watched: "Completed",
  watching: "Playing",
  paused: "Paused",
  dropped: "Dropped",
  watchlist: "Backlog",
};

export function isReviewMediaType(value: string | null): value is ReviewMediaType {
  return REVIEW_MEDIA_TYPES.includes(value as ReviewMediaType);
}

export interface ReviewUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface ReviewRecord {
  id: string;
  user_id: string;
  media_id: number;
  media_type: ReviewMediaType;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  status: "watched" | "watching" | "paused" | "dropped" | "watchlist" | null;
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  watched_date: string | null;
  start_date: string | null;
  end_date: string | null;
  season_number?: number | null;
  last_watched_episode?: number | null;
  created_at: string;
  updated_at: string;
  users: ReviewUser | null;
}

export interface TmdbMeta {
  title?: string;
  original_title?: string;
  release_date?: string;
  runtime?: number;
  episodesCount?: number;
  genres?: string[];
  tagline?: string;
  overview?: string;
  backdrop_path?: string;
  poster_path?: string;
}
