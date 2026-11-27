import { fetchAniList } from "@/lib/providers/anilist/client";
import type { AniListMediaResponse, AniListSearchResponse, AnimeMedia } from "@/lib/providers/anilist/types";

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
              startDate {
                year
                month
                day
              }
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
  } catch (error) {
    if (error instanceof Error && /error 404|not found/i.test(error.message)) return null;
    throw error;
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
