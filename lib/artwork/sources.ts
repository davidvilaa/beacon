import { cacheLife } from "next/cache";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import type { MovieImage } from "@/lib/providers/tmdb/types";
import { getAnimeById } from "@/lib/providers/anilist/media";
import type { AnimeMedia } from "@/lib/providers/anilist/types";
import { dedupeImages } from "@/lib/artwork/dedupe";
import {
  filterByAspect,
  sortByLanguageThenVotes,
  sortByVotes,
  uniqueByPath,
} from "@/lib/artwork/pick";

interface TmdbImageSet {
  poster_path?: string | null;
  backdrop_path?: string | null;
  images?: { posters?: MovieImage[]; backdrops?: MovieImage[] };
}

interface TmdbImagesResponse {
  posters?: MovieImage[];
  backdrops?: MovieImage[];
}

interface TmdbSearchResult {
  id: number;
  media_type?: string;
}

interface TmdbSeasonSummary {
  season_number: number;
  name?: string;
  air_date?: string | null;
}

async function tryTmdb<T>(
  endpoint: string,
  params: Record<string, string | number | null | undefined> = {}
): Promise<T | null> {
  try {
    return await fetchFromTmdb<T>(endpoint, { language: null, ...params });
  } catch {
    return null;
  }
}

function getTmdbImageSet(type: "movie" | "tv", id: string) {
  return fetchFromTmdb<TmdbImageSet>(`/${type}/${id}`, {
    append_to_response: "images",
    include_image_language: "en,null",
  });
}

export async function getMoviePosters(id: string): Promise<MovieImage[]> {
  "use cache";
  cacheLife("days");
  const data = await getTmdbImageSet("movie", id);
  const sorted = sortByVotes(filterByAspect(data.images?.posters || [], "poster"));
  return dedupeImages(sorted, "poster", { keepPath: data.poster_path });
}

export async function getMovieBackdrops(id: string): Promise<MovieImage[]> {
  "use cache";
  cacheLife("days");
  const data = await getTmdbImageSet("movie", id);
  const sorted = sortByLanguageThenVotes(filterByAspect(data.images?.backdrops || [], "backdrop"));
  return dedupeImages(sorted, "backdrop", { keepPath: data.backdrop_path });
}

export async function getTvBackdrops(id: string): Promise<MovieImage[]> {
  "use cache";
  cacheLife("days");
  const data = await getTmdbImageSet("tv", id);
  const sorted = sortByLanguageThenVotes(filterByAspect(data.images?.backdrops || [], "backdrop"));
  return dedupeImages(sorted, "backdrop", { keepPath: data.backdrop_path });
}

export async function getTvPosters(id: string, season: string | null): Promise<MovieImage[]> {
  "use cache";
  cacheLife("days");
  const [seasonData, tvData] = await Promise.all([
    season ? tryTmdb<TmdbImagesResponse>(`/tv/${id}/season/${season}/images`) : null,
    tryTmdb<TmdbImagesResponse>(`/tv/${id}/images`),
  ]);
  const prioritized = uniqueByPath([
    ...sortByVotes(filterByAspect(seasonData?.posters || [], "poster")),
    ...sortByVotes(filterByAspect(tvData?.posters || [], "poster")),
  ]);
  return dedupeImages(prioritized, "poster");
}

async function findTmdbEntry(
  queries: string[],
  isMovie: boolean
): Promise<{ id: number; mediaType: "movie" | "tv" } | null> {
  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    const direct = await tryTmdb<{ results?: TmdbSearchResult[] }>(
      isMovie ? "/search/movie" : "/search/tv",
      { query: cleanQuery }
    );
    if (direct?.results?.length) {
      return { id: direct.results[0].id, mediaType: isMovie ? "movie" : "tv" };
    }

    const multi = await tryTmdb<{ results?: TmdbSearchResult[] }>("/search/multi", {
      query: cleanQuery,
    });
    const match = (multi?.results || []).find(
      (r) => r.media_type === "tv" || r.media_type === "movie"
    );
    if (match) {
      return { id: match.id, mediaType: match.media_type as "movie" | "tv" };
    }
  }

  return null;
}

function getAnimeQueries(anime: AnimeMedia): string[] {
  return [anime.title.english, anime.title.romaji, anime.title.native].filter(Boolean) as string[];
}

function matchAnimeSeason(anime: AnimeMedia, seasons: TmdbSeasonSummary[]): number | null {
  const aniTitle = `${anime.title.english || ""} ${anime.title.romaji || ""}`.toLowerCase();
  const aniYearMonth =
    anime.startDate?.year && anime.startDate?.month
      ? `${anime.startDate.year}-${String(anime.startDate.month).padStart(2, "0")}`
      : "";

  if (aniYearMonth) {
    const dateMatch = seasons.find((s) => s.air_date && s.air_date.startsWith(aniYearMonth));
    if (dateMatch) return dateMatch.season_number;
  }

  const numMatch =
    aniTitle.match(/(\d+)(?:st|nd|rd|th)?\s*season/) || aniTitle.match(/season\s*(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const byNumber = seasons.find((s) => s.season_number === num);
    if (byNumber) return byNumber.season_number;
  }

  for (const s of seasons) {
    const clean = (s.name || "")
      .replace(/season\s*\d+/i, "")
      .replace(/arc/i, "")
      .trim()
      .toLowerCase();
    if (clean.length > 3 && aniTitle.includes(clean)) {
      return s.season_number;
    }
  }

  return null;
}

function anilistArtwork(path: string, kind: "poster" | "backdrop"): MovieImage {
  return kind === "poster"
    ? { file_path: path, aspect_ratio: 0.7, height: 1000, width: 700, iso_639_1: null, vote_average: 10, vote_count: 9999 }
    : { file_path: path, aspect_ratio: 1.77, height: 1080, width: 1920, iso_639_1: null, vote_average: 10, vote_count: 9999 };
}

export interface AnimeArtworkCandidates {
  posters: MovieImage[];
  backdrops: MovieImage[];
  posterKeep: string | null;
  backdropKeep: string | null;
}

export async function getAnimeArtworkCandidates(animeId: number): Promise<AnimeArtworkCandidates | null> {
  "use cache";
  cacheLife("days");
  const anime = await getAnimeById(animeId);
  if (!anime) return null;

  const anilistCover = anime.coverImage?.extraLarge || anime.coverImage?.large || null;
  const initialPosters = anilistCover ? [anilistArtwork(anilistCover, "poster")] : [];
  const initialBackdrops = anime.bannerImage ? [anilistArtwork(anime.bannerImage, "backdrop")] : [];

  let tmdbPosters: MovieImage[] = [];
  let tmdbBackdrops: MovieImage[] = [];
  const entry = await findTmdbEntry(getAnimeQueries(anime), anime.format === "MOVIE");

  if (entry) {
    const images = await tryTmdb<TmdbImagesResponse>(`/${entry.mediaType}/${entry.id}/images`);
    tmdbPosters = filterByAspect(images?.posters || [], "poster");
    tmdbBackdrops = filterByAspect(images?.backdrops || [], "backdrop");

    if (entry.mediaType === "tv") {
      const show = await tryTmdb<{ seasons?: TmdbSeasonSummary[] }>(`/tv/${entry.id}`);
      const seasons = (show?.seasons || []).filter((s) => s.season_number > 0);
      const matchedSeason = seasons.length > 1 ? matchAnimeSeason(anime, seasons) : null;

      if (matchedSeason) {
        const seasonImages = await tryTmdb<TmdbImagesResponse>(
          `/tv/${entry.id}/season/${matchedSeason}/images`
        );
        const seasonPosters = filterByAspect(seasonImages?.posters || [], "poster");
        if (seasonPosters.length > 0) {
          tmdbPosters = [...seasonPosters, ...tmdbPosters];
        }
      }
    }
  }

  return {
    posters: sortByVotes([...initialPosters, ...tmdbPosters]),
    backdrops: sortByVotes([...initialBackdrops, ...tmdbBackdrops]),
    posterKeep: anilistCover,
    backdropKeep: anime.bannerImage || null,
  };
}

export async function getAnimePosters(animeId: number): Promise<MovieImage[] | null> {
  "use cache";
  cacheLife("days");
  const candidates = await getAnimeArtworkCandidates(animeId);
  if (!candidates) return null;
  return dedupeImages(candidates.posters, "poster", { keepPath: candidates.posterKeep });
}

export async function getAnimeBackdrops(animeId: number): Promise<MovieImage[] | null> {
  "use cache";
  cacheLife("days");
  const candidates = await getAnimeArtworkCandidates(animeId);
  if (!candidates) return null;
  return dedupeImages(candidates.backdrops, "backdrop", { keepPath: candidates.backdropKeep });
}
