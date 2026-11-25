import type { SupabaseClient } from "@supabase/supabase-js";
import type { MovieDetails, TvDetails } from "@/lib/tmdb";
import {
  getAnimeTitle,
  getAnimePosterUrl,
  getAnimeBackdropUrl,
  stripHtml,
  type AnimeMedia,
} from "@/lib/anilist";
import { getIgdbImageUrl, type IGDBGameDetail } from "@/lib/igdb";

export type CachedMediaType = "movie" | "tv" | "anime" | "game";

export interface MediaCacheInput {
  id: number;
  title: string;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  format?: string | null;
  status?: string | null;
  releaseDate?: string | null;
}

const CACHE_TABLES: Record<CachedMediaType, string> = {
  movie: "movies",
  tv: "series",
  anime: "animes",
  game: "games",
};

function withoutUndefined(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

function toCacheRow(mediaType: CachedMediaType, input: MediaCacheInput): Record<string, unknown> {
  switch (mediaType) {
    case "movie":
      return {
        id: input.id,
        title: input.title,
        overview: input.overview,
        poster_path: input.posterPath,
        backdrop_path: input.backdropPath,
      };
    case "tv":
      return {
        id: input.id,
        name: input.title,
        overview: input.overview,
        poster_path: input.posterPath,
        backdrop_path: input.backdropPath,
        number_of_seasons: input.numberOfSeasons,
        number_of_episodes: input.numberOfEpisodes,
      };
    case "anime":
      return {
        id: input.id,
        title: input.title,
        overview: input.overview,
        poster_path: input.posterPath,
        backdrop_path: input.backdropPath,
        format: input.format,
        episodes: input.numberOfEpisodes,
        status: input.status,
      };
    case "game":
      return {
        id: input.id,
        name: input.title,
        summary: input.overview,
        cover_url: input.posterPath,
        backdrop_url: input.backdropPath,
        first_release_date: input.releaseDate,
      };
  }
}

export async function upsertMediaCache(
  supabase: SupabaseClient,
  mediaType: CachedMediaType,
  input: MediaCacheInput
) {
  const { error } = await supabase
    .from(CACHE_TABLES[mediaType])
    .upsert(withoutUndefined(toCacheRow(mediaType, input)));
  return error;
}

export function movieCacheInput(movie: MovieDetails): MediaCacheInput {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
  };
}

export function tvCacheInput(tv: TvDetails): MediaCacheInput {
  return {
    id: tv.id,
    title: tv.name,
    overview: tv.overview,
    posterPath: tv.poster_path,
    backdropPath: tv.backdrop_path,
    numberOfSeasons: tv.number_of_seasons,
    numberOfEpisodes: tv.number_of_episodes,
  };
}

export function animeCacheInput(anime: AnimeMedia): MediaCacheInput {
  return {
    id: anime.id,
    title: getAnimeTitle(anime.title),
    overview: stripHtml(anime.description) || null,
    posterPath: getAnimePosterUrl(anime),
    backdropPath: getAnimeBackdropUrl(anime),
    format: anime.format || null,
    numberOfEpisodes: anime.episodes || 0,
    status: anime.status || null,
  };
}

export function gameCacheInput(game: IGDBGameDetail): MediaCacheInput {
  return {
    id: game.id,
    title: game.name,
    overview: game.summary || null,
    posterPath: getIgdbImageUrl(game.cover?.image_id, "1080p"),
    backdropPath: getIgdbImageUrl(
      game.artworks?.[0]?.image_id || game.screenshots?.[0]?.image_id,
      "1080p"
    ),
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString()
      : null,
  };
}

export async function upsertMediaCacheOrThrow(
  supabase: SupabaseClient,
  mediaType: CachedMediaType,
  input: MediaCacheInput
) {
  const error = await upsertMediaCache(supabase, mediaType, input);
  if (error) throw error;
}
