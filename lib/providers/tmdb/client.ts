import type { TmdbVideo } from "@/lib/providers/tmdb/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getPosterUrl(
  path: string | null,
  size: "w92" | "w185" | "w342" | "w500" | "original" = "w500"
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280"
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export async function fetchFromTmdb<T>(
  endpoint: string,
  params: Record<string, string | number | null | undefined> = {}
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();

  const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
  const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
  const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  if (!url.searchParams.has("language") && params.language !== null) {
    url.searchParams.set("language", "en-US");
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  } else if (rawKey) {
    url.searchParams.set("api_key", rawKey);
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`TMDB error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export function getBestTmdbTrailer(
  videos?: { results?: TmdbVideo[] } | null
): TmdbVideo | null {
  if (!videos?.results || videos.results.length === 0) return null;
  const list = videos.results;
  return (
    list.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    list.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    list.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
    list.find((v) => v.site === "YouTube") ||
    null
  );
}
