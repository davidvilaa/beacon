import type { AnimeCoverImage, AnimeTitle } from "@/lib/providers/anilist/types";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

export async function fetchAniList<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const res = await fetch(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AniList error ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`AniList GraphQL error: ${json.errors[0]?.message || "Unknown error"}`);
  }

  return json as T;
}

export function getAnimeTitle(
  title?: AnimeTitle | null,
  fallback: string = "Untitled"
): string {
  if (!title) return fallback;
  return title.english?.trim() || title.romaji?.trim() || title.native?.trim() || fallback;
}

export function getAnimePosterUrl(
  media?: { coverImage?: AnimeCoverImage | null } | null
): string | null {
  if (!media?.coverImage) return null;
  return (
    media.coverImage.extraLarge ||
    media.coverImage.large ||
    media.coverImage.medium ||
    null
  );
}

export function getAnimeBackdropUrl(
  media?: { bannerImage?: string | null; coverImage?: AnimeCoverImage | null } | null
): string | null {
  if (!media) return null;
  return (
    media.bannerImage ||
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    null
  );
}

export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function cleanAniListDescription(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = stripHtml(input);
  return cleaned
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/~![\s\S]*?!~/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
