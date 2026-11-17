export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AnimeCoverImage {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface AnimeFuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AnimeStudioNode {
  id: number;
  name: string;
  isAnimationStudio?: boolean;
}

export interface AnimeCharacterNode {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    large: string | null;
    medium: string | null;
  } | null;
}

export interface AnimeVoiceActorNode {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    large: string | null;
    medium: string | null;
  } | null;
  languageV2?: string;
}

export interface AnimeCharacterEdge {
  role: string;
  node: AnimeCharacterNode;
  voiceActors?: AnimeVoiceActorNode[];
}

export interface AnimeRelationEdge {
  relationType: string;
  node: {
    id: number;
    title: {
      romaji: string;
      english: string | null;
    };
    format: string | null;
    coverImage: {
      extraLarge?: string | null;
      large?: string | null;
      medium?: string | null;
    } | null;
  };
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  description: string | null;
  coverImage: AnimeCoverImage | null;
  bannerImage: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: AnimeFuzzyDate | null;
  endDate: AnimeFuzzyDate | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  tagline?: string | null;
  studios?: {
    nodes: AnimeStudioNode[];
  } | null;
  trailer?: {
    id: string | null;
    site: string | null;
  } | null;
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  characters?: {
    edges: AnimeCharacterEdge[];
  } | null;
  relations?: {
    edges: AnimeRelationEdge[];
  } | null;
}

export interface AniListSearchResponse {
  data?: {
    Page?: {
      pageInfo?: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
      media?: AnimeMedia[];
    };
  };
  errors?: any[];
}

export interface AniListMediaResponse {
  data?: {
    Media?: AnimeMedia | null;
  };
  errors?: any[];
}

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

export async function searchAnime(
  query: string,
  page: number = 1,
  perPage: number = 10,
  sort: string = "POPULARITY_DESC"
): Promise<{
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    perPage: number;
  };
  results: AnimeMedia[];
}> {
  const searchQuery = `
    query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(search: $search, type: ANIME, format_not_in: [MOVIE, MUSIC], sort: $sort) {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          format
          status
          episodes
          duration
          season
          seasonYear
          startDate {
            year
            month
            day
          }
          averageScore
          popularity
          genres
          studios(isMain: true) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `;

  let mediaSort = ["POPULARITY_DESC"];
  if (sort === "newest" || sort === "START_DATE_DESC") {
    mediaSort = ["START_DATE_DESC", "POPULARITY_DESC"];
  } else if (sort === "oldest" || sort === "START_DATE") {
    mediaSort = ["START_DATE", "POPULARITY_DESC"];
  } else if (sort === "score" || sort === "SCORE_DESC") {
    mediaSort = ["SCORE_DESC", "POPULARITY_DESC"];
  }

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: mediaSort,
  };

  if (query.trim()) {
    variables.search = query.trim();
  }

  const data = await fetchAniList<AniListSearchResponse>(searchQuery, variables);
  const pageData = data.data?.Page;

  return {
    pageInfo: pageData?.pageInfo || {
      total: 0,
      currentPage: page,
      lastPage: 1,
      hasNextPage: false,
      perPage,
    },
    results: pageData?.media || [],
  };
}

export async function getAnimeById(id: number): Promise<AnimeMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        format
        status
        episodes
        duration
        season
        seasonYear
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        averageScore
        popularity
        genres
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        trailer {
          id
          site
        }
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
        characters(page: 1, perPage: 24, sort: [ROLE, RELEVANCE, ID]) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
            }
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              format
              coverImage {
                extraLarge
                large
                medium
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList<AniListMediaResponse>(query, { id });
    return data.data?.Media || null;
  } catch {
    return null;
  }
}

export async function getPopularAnime(
  page: number = 1,
  perPage: number = 10
): Promise<AnimeMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, format_not_in: [MOVIE, MUSIC], sort: [POPULARITY_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          format
          status
          episodes
          averageScore
          popularity
          genres
        }
      }
    }
  `;

  const data = await fetchAniList<AniListSearchResponse>(query, { page, perPage });
  return data.data?.Page?.media || [];
}
