import { seasonHref, seasonTitle } from "@/lib/media/seasons";
import { LOG_CONFIG, type LogMediaType, type LogStatus } from "@/lib/media/log";

export type ProfileSort = "recent" | "rating_desc" | "rating_asc" | "title_asc" | "title_desc";

export const PROFILE_SORTS: { id: ProfileSort; label: string }[] = [
  { id: "recent", label: "Recently added" },
  { id: "rating_desc", label: "Highest rating" },
  { id: "rating_asc", label: "Lowest rating" },
  { id: "title_asc", label: "Title (A-Z)" },
  { id: "title_desc", label: "Title (Z-A)" },
];

export const PROFILE_PAGE_SIZE = 40;

export interface ProfileMediaConfig {
  mediaType: LogMediaType;
  tabId: string;
  relation: string;
  titleColumn: string;
  posterColumn: string;
  fallbackTitle: string;
  favoritesTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  statusOrder: LogStatus[];
}

const WATCH_ORDER: LogStatus[] = ["watching", "watched", "paused", "dropped", "watchlist"];

export const PROFILE_MEDIA_CONFIG: Record<LogMediaType, ProfileMediaConfig> = {
  movie: {
    mediaType: "movie",
    tabId: "movies",
    relation: "movies",
    titleColumn: "title",
    posterColumn: "poster_path",
    fallbackTitle: "Movie",
    favoritesTitle: "Favorite movies",
    emptyTitle: "No movies found",
    emptyDescription: "No movies match your selected filters. Try changing or clearing your filters.",
    statusOrder: ["watched", "watchlist"],
  },
  tv: {
    mediaType: "tv",
    tabId: "series",
    relation: "series",
    titleColumn: "name",
    posterColumn: "poster_path",
    fallbackTitle: "Series",
    favoritesTitle: "Favorite series",
    emptyTitle: "No series found",
    emptyDescription: "No series match your selected filters. Try changing or clearing your filters.",
    statusOrder: WATCH_ORDER,
  },
  anime: {
    mediaType: "anime",
    tabId: "anime",
    relation: "animes",
    titleColumn: "title",
    posterColumn: "poster_path",
    fallbackTitle: "Anime",
    favoritesTitle: "Favorite anime",
    emptyTitle: "No anime found",
    emptyDescription: "No anime match your selected filters. Try changing or clearing your filters.",
    statusOrder: WATCH_ORDER,
  },
  game: {
    mediaType: "game",
    tabId: "games",
    relation: "games",
    titleColumn: "name",
    posterColumn: "cover_url",
    fallbackTitle: "Game",
    favoritesTitle: "Favorite games",
    emptyTitle: "No games found",
    emptyDescription: "No games match your selected filters. Try changing or clearing your filters.",
    statusOrder: WATCH_ORDER,
  },
};

export interface ProfileLogRow {
  id: string;
  status: string | null;
  rating: number | string | null;
  review: string | null;
  has_spoilers: boolean | null;
  custom_poster_path: string | null;
  season_number?: number | null;
  [key: string]: unknown;
}

export function profileSelect(mediaType: LogMediaType): string {
  const config = PROFILE_MEDIA_CONFIG[mediaType];
  const log = LOG_CONFIG[mediaType];
  const columns = [
    "id",
    log.idColumn,
    "status",
    "rating",
    "review",
    "has_spoilers",
    "custom_poster_path",
    ...(log.bySeason ? ["season_number"] : []),
    `${config.relation}(${config.titleColumn}, ${config.posterColumn}${log.bySeason ? ", number_of_seasons" : ""})`,
  ];
  return columns.join(", ");
}

export function statusFilterOptions(mediaType: LogMediaType): { id: string; status: LogStatus; label: string }[] {
  const config = PROFILE_MEDIA_CONFIG[mediaType];
  const log = LOG_CONFIG[mediaType];
  return config.statusOrder.map((status) => ({
    id: log.toDbStatus(status) as string,
    status,
    label: log.statusLabels[status] || status,
  }));
}

export interface ProfileCardItem {
  key: string;
  mediaId: number;
  entryLogId: string;
  title: string;
  posterPath: string | null;
  href: string;
  rating: number | null;
  review: string | null;
  hasSpoilers: boolean;
  seasonNumber?: number;
}

export function rowToCard(mediaType: LogMediaType, row: ProfileLogRow): ProfileCardItem {
  const config = PROFILE_MEDIA_CONFIG[mediaType];
  const log = LOG_CONFIG[mediaType];
  const media = (row[config.relation] || null) as Record<string, string | null> | null;
  const mediaId = Number(row[log.idColumn]);
  const season = log.bySeason ? row.season_number || 1 : undefined;

  return {
    key: season ? `${mediaId}-${season}` : String(mediaId),
    mediaId,
    entryLogId: row.id,
    title: season
      ? seasonTitle(
          media?.[config.titleColumn] || config.fallbackTitle,
          { season_number: season },
          Number(media?.number_of_seasons ?? 0)
        )
      : media?.[config.titleColumn] || config.fallbackTitle,
    posterPath: row.custom_poster_path || media?.[config.posterColumn] || null,
    href: season ? seasonHref(mediaId, season) : `/${mediaType}/${mediaId}`,
    rating: row.rating ? Number(row.rating) : null,
    review: row.review,
    hasSpoilers: Boolean(row.has_spoilers),
    seasonNumber: season,
  };
}
