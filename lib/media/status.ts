export type GameStatus = "playing" | "completed" | "paused" | "dropped" | "backlog";

type SharedStatus = "watching" | "watched" | "paused" | "dropped" | "watchlist";

const GAME_TO_SHARED: Record<GameStatus, SharedStatus> = {
  playing: "watching",
  completed: "watched",
  paused: "paused",
  dropped: "dropped",
  backlog: "watchlist",
};

const SHARED_TO_GAME: Record<SharedStatus, GameStatus> = {
  watching: "playing",
  watched: "completed",
  paused: "paused",
  dropped: "dropped",
  watchlist: "backlog",
};

export function gameStatusToShared(status: string | null | undefined): SharedStatus | null {
  if (!status) return null;
  return GAME_TO_SHARED[status as GameStatus] ?? null;
}

export function sharedStatusToGame(status: SharedStatus): GameStatus {
  return SHARED_TO_GAME[status];
}
