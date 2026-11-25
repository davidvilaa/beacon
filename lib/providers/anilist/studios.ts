import { fetchAniList } from "@/lib/providers/anilist/client";
import type { AniListStudio } from "@/lib/providers/anilist/types";

const STUDIO_DETAIL_FIELDS = `
  id
  name
  isAnimationStudio
  siteUrl
  p1: media(page: 1, perPage: 25, sort: [POPULARITY_DESC]) {
    edges {
      isMainStudio
      node {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        bannerImage
        format
        episodes
        startDate {
          year
          month
          day
        }
        popularity
        averageScore
      }
    }
  }
  p2: media(page: 2, perPage: 25, sort: [POPULARITY_DESC]) {
    edges {
      isMainStudio
      node {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        bannerImage
        format
        episodes
        startDate {
          year
          month
          day
        }
        popularity
        averageScore
      }
    }
  }
`;

export async function getStudioDetails(id: number): Promise<AniListStudio | null> {
  const query = `
    query ($id: Int) {
      Studio(id: $id) {
        ${STUDIO_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await fetchAniList<{ data?: { Studio?: any } }>(query, { id });
    const s = data.data?.Studio;
    if (!s) return null;
    const allEdges = [...(s.p1?.edges || []), ...(s.p2?.edges || [])];
    const seen = new Set<number>();
    const uniqueEdges = allEdges.filter((e: any) => {
      if (!e.node?.id || seen.has(e.node.id)) return false;
      seen.add(e.node.id);
      return true;
    });
    return {
      ...s,
      media: {
        edges: uniqueEdges,
      },
    };
  } catch {
    return null;
  }
}

export async function searchStudioByName(search: string): Promise<AniListStudio | null> {
  if (!search.trim()) return null;
  const query = `
    query ($search: String) {
      Studio(search: $search) {
        ${STUDIO_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await fetchAniList<{ data?: { Studio?: any } }>(query, { search: search.trim() });
    const s = data.data?.Studio;
    if (!s) return null;
    const allEdges = [...(s.p1?.edges || []), ...(s.p2?.edges || [])];
    const seen = new Set<number>();
    const uniqueEdges = allEdges.filter((e: any) => {
      if (!e.node?.id || seen.has(e.node.id)) return false;
      seen.add(e.node.id);
      return true;
    });
    return {
      ...s,
      media: {
        edges: uniqueEdges,
      },
    };
  } catch {
    return null;
  }
}
