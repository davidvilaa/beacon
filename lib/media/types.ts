export type MediaType = "movie" | "tv" | "anime" | "game";

export const MEDIA_TYPES: MediaType[] = ["movie", "tv", "anime", "game"];

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  air_date?: string | null;
  runtime?: number | null;
  overview?: string | null;
  still_path?: string | null;
}
