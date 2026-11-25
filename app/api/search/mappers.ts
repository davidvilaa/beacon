import type { MultiSearchItem } from "@/lib/tmdb";
import {
  getAnimeTitle,
  getAnimePosterUrl,
  getAnimeBackdropUrl,
  stripHtml,
  type AnimeMedia,
} from "@/lib/anilist";
import { getIgdbImageUrl, type IGDBSearchItem } from "@/lib/igdb";
import type { CachedMediaMeta, RawListItemRef } from "@/lib/lists";

export interface SearchUserRow {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface SearchListItemRow {
  id: string;
  media_type: string;
  media_id: number;
  custom_poster_path: string | null;
  position: number;
  created_at: string;
}

export interface SearchListRow {
  id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  is_numbered: boolean | null;
  created_at: string;
  updated_at: string;
  users: { username: string } | { username: string }[] | null;
  list_items: SearchListItemRow[] | null;
}

export interface SearchCompanyRow {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

const LIST_PREVIEW_SIZE = 5;

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function toIsoDate(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return "";
  return `${year}-${String(month || 1).padStart(2, "0")}-${String(day || 1).padStart(2, "0")}`;
}

export function mapUser(user: SearchUserRow, popularity?: number) {
  return {
    id: user.id,
    title: user.username,
    username: user.username,
    overview: user.bio || "",
    poster_path: user.avatar_url,
    media_type: "user",
    moduleType: "user",
    popularity,
    href: `/profile/${encodeURIComponent(user.username)}`,
  };
}

function sortListItems(items: SearchListItemRow[]): SearchListItemRow[] {
  return [...items].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function collectListPreviewRefs(lists: SearchListRow[]): RawListItemRef[] {
  return lists.flatMap((list) =>
    sortListItems(list.list_items || [])
      .slice(0, LIST_PREVIEW_SIZE)
      .map((item) => ({ media_type: item.media_type, media_id: item.media_id }))
  );
}

export function mapList(
  list: SearchListRow,
  mediaMap: Map<string, CachedMediaMeta>,
  popularity?: number
) {
  const owner = Array.isArray(list.users) ? list.users[0] : list.users;
  const previewPosters = sortListItems(list.list_items || [])
    .slice(0, LIST_PREVIEW_SIZE)
    .map(
      (item) =>
        item.custom_poster_path ||
        mediaMap.get(`${item.media_type}-${item.media_id}`)?.posterPath ||
        null
    );

  return {
    id: list.id,
    title: list.title,
    author: owner?.username || null,
    description: list.description || "",
    overview: list.description || "",
    isPrivate: list.is_private,
    isNumbered: Boolean(list.is_numbered),
    itemCount: (list.list_items || []).length,
    updatedAt: list.updated_at,
    created_at: list.created_at,
    previewPosters,
    media_type: "list",
    moduleType: "list",
    popularity,
    href: `/lists/${list.id}`,
  };
}

export function mapCompany(company: SearchCompanyRow, popularity: number) {
  return {
    id: company.id,
    title: company.name,
    overview: company.origin_country ? `Country: ${company.origin_country}` : "",
    poster_path: company.logo_path,
    media_type: "company",
    moduleType: "company",
    popularity,
    href: `/company/${company.id}`,
  };
}

function knownForSummary(knownFor: { title?: string; name?: string }[] | undefined): string {
  return (knownFor || [])
    .map((k) => k.title || k.name)
    .filter(Boolean)
    .slice(0, 4)
    .join(" • ");
}

export function mapTmdbItem(item: MultiSearchItem) {
  const isPerson = item.media_type === "person";
  const isTv = item.media_type === "tv";
  const famous = isPerson ? knownForSummary(item.known_for) : "";

  return {
    id: item.id,
    title: item.title || item.name || "",
    original_title: item.original_title || item.original_name,
    famous_works: famous,
    overview: isPerson
      ? famous || (item.known_for_department ? `Known for ${item.known_for_department}` : "")
      : item.overview,
    poster_path: isPerson ? item.profile_path : item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date || item.first_air_date,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity || 0,
    genre_ids: item.genre_ids,
    moduleType: isPerson ? "person" : isTv ? "series" : "movies",
    media_type: item.media_type,
    href: isPerson ? `/person/${item.id}` : isTv ? `/tv/${item.id}` : `/movie/${item.id}`,
  };
}

export function mapPerson(person: MultiSearchItem) {
  const famous = knownForSummary(person.known_for);
  return {
    id: person.id,
    title: person.name,
    original_title: person.original_name,
    famous_works: famous,
    overview:
      famous || (person.known_for_department ? `Known for ${person.known_for_department}` : ""),
    poster_path: person.profile_path,
    media_type: "person",
    moduleType: "person",
    popularity: person.popularity || 0,
    href: `/person/${person.id}`,
  };
}

export function mapAnime(anime: AnimeMedia) {
  const title = getAnimeTitle(anime.title);
  return {
    id: anime.id,
    title,
    original_title: anime.title.romaji || anime.title.native || title,
    overview: stripHtml(anime.description),
    poster_path: getAnimePosterUrl(anime),
    backdrop_path: getAnimeBackdropUrl(anime),
    release_date: toIsoDate(anime.startDate?.year, anime.startDate?.month, anime.startDate?.day),
    vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
    vote_count: anime.popularity || 0,
    popularity: anime.popularity || 0,
    genre_ids: [],
    moduleType: "anime",
    media_type: "anime",
    href: `/anime/${anime.id}`,
  };
}

export function mapGame(game: IGDBSearchItem) {
  return {
    id: game.id,
    title: game.name,
    original_title: game.name,
    overview: game.summary || "",
    poster_path: getIgdbImageUrl(game.cover?.image_id, "1080p"),
    backdrop_path: null,
    release_date: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
      : "",
    vote_average: game.rating ? game.rating / 10 : 0,
    vote_count: 0,
    popularity: game.total_rating || game.rating || 0,
    genre_ids: [],
    moduleType: "games",
    media_type: "game",
    href: `/game/${game.id}`,
  };
}
