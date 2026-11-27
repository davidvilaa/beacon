import { cache } from "react";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { gameStatusToShared } from "@/lib/media/status";
import { getIgdbImageUrl } from "@/lib/providers/igdb/client";
import { getAnimeTitle, getAnimePosterUrl, getAnimeBackdropUrl, stripHtml } from "@/lib/providers/anilist/client";
import { getMovieDetail } from "@/lib/details/movie";
import { getTvDetail } from "@/lib/details/tv";
import { getAnimeDetail } from "@/lib/details/anime";
import { getGameDetail } from "@/lib/details/game";
import {
  isReviewMediaType,
  type ReviewMediaType,
  type ReviewRecord,
  type TmdbMeta,
} from "@/lib/details/review-types";
import { seasonTitle } from "@/lib/media/seasons";

export interface ReviewPageData {
  review: ReviewRecord | null;
  tmdbMeta: TmdbMeta | null;
  currentUserId: string | null;
}

async function loadMediaData(record: ReviewRecord): Promise<any> {
  if (record.media_type === "movie") return getMovieDetail(String(record.media_id));
  if (record.media_type === "anime") return getAnimeDetail(record.media_id);
  if (record.media_type === "game") return getGameDetail(record.media_id);
  return getTvDetail(String(record.media_id), record.season_number || 1);
}

export const loadReviewPage = cache(async function loadReviewPage(
  typeHint: string,
  id: string,
  username: string
): Promise<ReviewPageData> {
  await connection();
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const currentUserId = (claims?.claims?.sub as string | undefined) ?? null;

  let record: ReviewRecord | null = null;
  const typesToTry: ReviewMediaType[] = isReviewMediaType(typeHint) ? [typeHint] : [];

  if (typesToTry.includes("movie")) {
    const { data: movieData } = await supabase
      .from("user_movies")
      .select(`
        id,
        user_id,
        movie_id,
        status,
        is_favorite,
        rating,
        review,
        has_spoilers,
        custom_poster_path,
        custom_backdrop_path,
        watched_date,
        created_at,
        updated_at,
        users (
          id,
          username,
          avatar_url
        ),
        movies (
          id,
          title,
          overview,
          poster_path,
          backdrop_path
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (movieData) {
      const m = movieData as any;
      record = {
        id: m.id,
        user_id: m.user_id,
        media_id: m.movie_id,
        media_type: "movie",
        title: m.movies?.title || "Movie",
        overview: m.movies?.overview || null,
        poster_path: m.movies?.poster_path || null,
        backdrop_path: m.movies?.backdrop_path || null,
        custom_poster_path: m.custom_poster_path || null,
        custom_backdrop_path: m.custom_backdrop_path || null,
        status: m.status,
        is_favorite: Boolean(m.is_favorite),
        rating: m.rating ? Number(m.rating) : null,
        review: m.review || null,
        has_spoilers: Boolean(m.has_spoilers),
        watched_date: m.watched_date || null,
        start_date: null,
        end_date: null,
        created_at: m.created_at,
        updated_at: m.updated_at,
        users: m.users || null,
      };
    }
  }

  if (!record && typesToTry.includes("tv")) {
    const { data: seriesData } = await supabase
      .from("user_series")
      .select(`
        id,
        user_id,
        series_id,
        season_number,
        status,
        is_favorite,
        rating,
        review,
        has_spoilers,
        custom_poster_path,
        custom_backdrop_path,
        last_watched_episode,
        start_date,
        end_date,
        created_at,
        updated_at,
        users (
          id,
          username,
          avatar_url
        ),
        series (
          id,
          name,
          overview,
          poster_path,
          backdrop_path,
          number_of_seasons,
          number_of_episodes
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (seriesData) {
      const s = seriesData as any;
      record = {
        id: s.id,
        user_id: s.user_id,
        media_id: s.series_id,
        media_type: "tv",
        title: s.series?.name || "Series",
        overview: s.series?.overview || null,
        poster_path: s.series?.poster_path || null,
        backdrop_path: s.series?.backdrop_path || null,
        custom_poster_path: s.custom_poster_path || null,
        custom_backdrop_path: s.custom_backdrop_path || null,
        status: s.status,
        is_favorite: Boolean(s.is_favorite),
        rating: s.rating ? Number(s.rating) : null,
        review: s.review || null,
        has_spoilers: Boolean(s.has_spoilers),
        watched_date: null,
        start_date: s.start_date || null,
        end_date: s.end_date || null,
        season_number: s.season_number || 1,
        last_watched_episode: s.last_watched_episode || 0,
        created_at: s.created_at,
        updated_at: s.updated_at,
        users: s.users || null,
      };
    }
  }

  if (!record && typesToTry.includes("anime")) {
    const { data: animeData } = await supabase
      .from("user_animes")
      .select(`
        id,
        user_id,
        anime_id,
        status,
        is_favorite,
        rating,
        review,
        has_spoilers,
        custom_poster_path,
        custom_backdrop_path,
        last_watched_episode,
        start_date,
        end_date,
        created_at,
        updated_at,
        users (
          id,
          username,
          avatar_url
        ),
        animes (
          id,
          title,
          overview,
          poster_path,
          backdrop_path,
          episodes
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (animeData) {
      const a = animeData as any;
      const rawTitle = a.animes?.title;
      const animeTitleStr =
        typeof rawTitle === "object" && rawTitle !== null
          ? getAnimeTitle(rawTitle)
          : typeof rawTitle === "string"
          ? rawTitle
          : "Anime";

      record = {
        id: a.id,
        user_id: a.user_id,
        media_id: a.anime_id,
        media_type: "anime",
        title: animeTitleStr,
        overview: a.animes?.overview || null,
        poster_path: a.animes?.poster_path || null,
        backdrop_path: a.animes?.backdrop_path || null,
        custom_poster_path: a.custom_poster_path || null,
        custom_backdrop_path: a.custom_backdrop_path || null,
        status: a.status,
        is_favorite: Boolean(a.is_favorite),
        rating: a.rating ? Number(a.rating) : null,
        review: a.review || null,
        has_spoilers: Boolean(a.has_spoilers),
        watched_date: null,
        start_date: a.start_date || null,
        end_date: a.end_date || null,
        last_watched_episode: a.last_watched_episode || 0,
        created_at: a.created_at,
        updated_at: a.updated_at,
        users: a.users || null,
      };
    }
  }

  if (!record && typesToTry.includes("game")) {
    const { data: gameData } = await supabase
      .from("user_games")
      .select(`
        id,
        user_id,
        game_id,
        status,
        is_favorite,
        rating,
        review,
        has_spoilers,
        custom_poster_path,
        custom_backdrop_path,
        start_date,
        end_date,
        created_at,
        updated_at,
        users (
          id,
          username,
          avatar_url
        ),
        games (
          id,
          name,
          summary,
          cover_url,
          backdrop_url
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (gameData) {
      const g = gameData as any;
      record = {
        id: g.id,
        user_id: g.user_id,
        media_id: g.game_id,
        media_type: "game",
        title: g.games?.name || "Game",
        overview: g.games?.summary || null,
        poster_path: g.games?.cover_url || null,
        backdrop_path: g.games?.backdrop_url || null,
        custom_poster_path: g.custom_poster_path || null,
        custom_backdrop_path: g.custom_backdrop_path || null,
        status: gameStatusToShared(g.status),
        is_favorite: Boolean(g.is_favorite),
        rating: g.rating ? Number(g.rating) : null,
        review: g.review || null,
        has_spoilers: Boolean(g.has_spoilers),
        watched_date: null,
        start_date: g.start_date || null,
        end_date: g.end_date || null,
        created_at: g.created_at,
        updated_at: g.updated_at,
        users: g.users || null,
      };
    }
  }

  if (record && record.users?.username?.toLowerCase() !== username.toLowerCase()) {
    record = null;
  }

  if (!record) {
    return { review: null, tmdbMeta: null, currentUserId };
  }

  let tmdbMeta: TmdbMeta | null = null;
  const tmdb = await loadMediaData(record).catch(() => null);

  if (tmdb) {

    const isAnime = record.media_type === "anime";
    const titleStr = isAnime
      ? getAnimeTitle(tmdb.title)
      : typeof tmdb.title === "object" && tmdb.title
      ? getAnimeTitle(tmdb.title)
      : tmdb.title || tmdb.name || "";

    const originalTitleStr = isAnime
      ? tmdb.title?.romaji || tmdb.title?.native || titleStr
      : tmdb.original_title || tmdb.original_name || "";

    const animeReleaseDate = tmdb.startDate?.year
      ? `${tmdb.startDate.year}-${String(tmdb.startDate.month || 1).padStart(2, "0")}-${String(tmdb.startDate.day || 1).padStart(2, "0")}`
      : "";

    const gameReleaseDate =
      typeof tmdb.first_release_date === "number"
        ? new Date(tmdb.first_release_date * 1000).toISOString().split("T")[0]
        : "";

    const date =
      tmdb.release_date || tmdb.first_air_date || animeReleaseDate || gameReleaseDate || "";

    const genres = Array.isArray(tmdb.genres)
      ? tmdb.genres
          .map((g: any) => (typeof g === "string" ? g : g?.name))
          .filter(Boolean)
      : [];

    const seasonSummary = Array.isArray(tmdb.seasons)
      ? tmdb.seasons.find(
          (s: any) => s.season_number === (record.season_number || 1)
        )
      : null;

    const animePoster = tmdb.coverImage ? getAnimePosterUrl(tmdb) : null;
    const gamePoster =
      record.media_type === "game" ? getIgdbImageUrl(tmdb.cover?.image_id, "1080p") : null;
    const seasonPoster =
      tmdb.initialSeason?.poster_path ||
      seasonSummary?.poster_path ||
      tmdb.poster_path ||
      animePoster ||
      gamePoster;

    const animeBackdrop =
      tmdb.bannerImage || tmdb.coverImage ? getAnimeBackdropUrl(tmdb) : null;
    const backdropPath = tmdb.backdrop_path || animeBackdrop;

    const overviewText =
      tmdb.overview ||
      (tmdb.description ? stripHtml(tmdb.description) : "") ||
      tmdb.summary ||
      "";

    const seasonCount = Array.isArray(tmdb.seasons)
      ? tmdb.seasons.filter((s: { season_number: number }) => s.season_number > 0).length
      : 0;
    const displayTitle =
      record.media_type === "tv"
        ? seasonTitle(titleStr, seasonSummary || { season_number: record.season_number || 1 }, seasonCount)
        : titleStr;

    tmdbMeta = {
      title: displayTitle,
      original_title: originalTitleStr,
      release_date: date,
      runtime:
        tmdb.runtime ||
        tmdb.duration ||
        (Array.isArray(tmdb.episode_run_time) && tmdb.episode_run_time.length > 0
          ? tmdb.episode_run_time[0]
          : undefined),
      episodesCount: tmdb.number_of_episodes || tmdb.episodes,
      genres,
      tagline: tmdb.tagline || "",
      overview: overviewText,
      backdrop_path: backdropPath,
      poster_path: seasonPoster,
    };
  }

  return { review: record, tmdbMeta, currentUserId };
});
