import { gameStatusToShared, sharedStatusToGame } from "@/lib/media-utils";

export type LogMediaType = "movie" | "tv" | "anime" | "game";
export type LogStatus = "watched" | "watching" | "paused" | "dropped" | "watchlist";

export interface MediaLogState {
  exists: boolean;
  status: LogStatus | null;
  isFavorite: boolean;
  rating: number;
  review: string;
  hasSpoilers: boolean;
  watchedDate: string;
  startDate: string;
  endDate: string;
  lastWatchedEpisode: number;
  hoursPlayed: number;
  customPoster: string | null;
  customBackdrop: string | null;
}

export interface LogConfig {
  table: string;
  idColumn: string;
  conflict: string;
  dateMode: "single" | "range";
  tracksEpisodes: boolean;
  tracksHours: boolean;
  bySeason: boolean;
  pluralLabel: string;
  completedToast: string;
  statusLabels: Partial<Record<LogStatus, string>>;
  toDbStatus: (status: LogStatus | null) => string | null;
  fromDbStatus: (status: string | null | undefined) => LogStatus | null;
}

const WATCH_LABELS: Record<LogStatus, string> = {
  watched: "Watched",
  watching: "Watching",
  paused: "Paused",
  dropped: "Dropped",
  watchlist: "Watchlist",
};

const GAME_LABELS: Record<LogStatus, string> = {
  watched: "Completed",
  watching: "Playing",
  paused: "Paused",
  dropped: "Dropped",
  watchlist: "Backlog",
};

const identityStatus = (status: string | null | undefined) => (status as LogStatus) || null;

export const LOG_CONFIG: Record<LogMediaType, LogConfig> = {
  movie: {
    table: "user_movies",
    idColumn: "movie_id",
    conflict: "user_id,movie_id",
    dateMode: "single",
    tracksEpisodes: false,
    tracksHours: false,
    bySeason: false,
    pluralLabel: "movies",
    completedToast: "Marked as Watched",
    statusLabels: { watched: WATCH_LABELS.watched, watchlist: WATCH_LABELS.watchlist },
    toDbStatus: (status) => status,
    fromDbStatus: identityStatus,
  },
  tv: {
    table: "user_series",
    idColumn: "series_id",
    conflict: "user_id,series_id,season_number",
    dateMode: "range",
    tracksEpisodes: true,
    tracksHours: false,
    bySeason: true,
    pluralLabel: "series",
    completedToast: "Season completed",
    statusLabels: WATCH_LABELS,
    toDbStatus: (status) => status,
    fromDbStatus: identityStatus,
  },
  anime: {
    table: "user_animes",
    idColumn: "anime_id",
    conflict: "user_id,anime_id",
    dateMode: "range",
    tracksEpisodes: true,
    tracksHours: false,
    bySeason: false,
    pluralLabel: "anime",
    completedToast: "Anime completed",
    statusLabels: WATCH_LABELS,
    toDbStatus: (status) => status,
    fromDbStatus: identityStatus,
  },
  game: {
    table: "user_games",
    idColumn: "game_id",
    conflict: "user_id,game_id",
    dateMode: "range",
    tracksEpisodes: false,
    tracksHours: true,
    bySeason: false,
    pluralLabel: "games",
    completedToast: "Marked as Completed",
    statusLabels: GAME_LABELS,
    toDbStatus: (status) => (status ? sharedStatusToGame(status) : null),
    fromDbStatus: (status) => gameStatusToShared(status),
  },
};

export const EMPTY_LOG: MediaLogState = {
  exists: false,
  status: null,
  isFavorite: false,
  rating: 0,
  review: "",
  hasSpoilers: false,
  watchedDate: "",
  startDate: "",
  endDate: "",
  lastWatchedEpisode: 0,
  hoursPlayed: 0,
  customPoster: null,
  customBackdrop: null,
};

export interface MediaLogRow {
  status?: string | null;
  is_favorite?: boolean | null;
  rating?: number | string | null;
  review?: string | null;
  has_spoilers?: boolean | null;
  watched_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  last_watched_episode?: number | null;
  hours_played?: number | string | null;
  custom_poster_path?: string | null;
  custom_backdrop_path?: string | null;
}

export function rowToLog(mediaType: LogMediaType, row: MediaLogRow | null): MediaLogState {
  if (!row) return EMPTY_LOG;
  return {
    exists: true,
    status: LOG_CONFIG[mediaType].fromDbStatus(row.status),
    isFavorite: Boolean(row.is_favorite),
    rating: row.rating ? Number(row.rating) : 0,
    review: row.review || "",
    hasSpoilers: Boolean(row.has_spoilers),
    watchedDate: row.watched_date || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    lastWatchedEpisode: row.last_watched_episode || 0,
    hoursPlayed: row.hours_played ? Number(row.hours_played) : 0,
    customPoster: row.custom_poster_path || null,
    customBackdrop: row.custom_backdrop_path || null,
  };
}

export function hasLogContent(log: MediaLogState): boolean {
  return Boolean(log.status || log.isFavorite || log.rating > 0 || log.review.trim());
}

export function logToRow(
  mediaType: LogMediaType,
  log: MediaLogState,
  includeArtwork: boolean
): Record<string, unknown> {
  const config = LOG_CONFIG[mediaType];
  const row: Record<string, unknown> = {
    status: config.toDbStatus(log.status),
    is_favorite: log.isFavorite,
    rating: log.rating > 0 ? log.rating : null,
    review: log.review.trim() || null,
    has_spoilers: log.hasSpoilers,
  };

  if (config.dateMode === "single") {
    row.watched_date = log.watchedDate || null;
  } else {
    row.start_date = log.startDate || null;
    row.end_date = log.endDate || null;
  }

  if (config.tracksEpisodes) row.last_watched_episode = log.lastWatchedEpisode;
  if (config.tracksHours) row.hours_played = log.hoursPlayed;

  if (includeArtwork) {
    row.custom_poster_path = log.customPoster;
    row.custom_backdrop_path = log.customBackdrop;
  }

  return row;
}

export function statusToast(mediaType: LogMediaType, status: LogStatus): string {
  const label = LOG_CONFIG[mediaType].statusLabels[status] || status;
  return status === "watchlist" ? `Added to ${label}` : `Marked as ${label}`;
}

export function favoriteLimitToast(mediaType: LogMediaType): string {
  return `You can only have up to 5 favorite ${LOG_CONFIG[mediaType].pluralLabel}`;
}
