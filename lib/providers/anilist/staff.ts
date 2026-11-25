import { fetchAniList } from "@/lib/providers/anilist/client";
import type { AniListStaff } from "@/lib/providers/anilist/types";

const STAFF_DETAIL_FIELDS = `
  id
  name {
    full
    native
    userPreferred
    alternative
  }
  image {
    large
    medium
  }
  description
  gender
  dateOfBirth {
    year
    month
    day
  }
  p1: characterMedia(page: 1, perPage: 25, sort: [POPULARITY_DESC]) {
    edges {
      characters {
        id
        name {
          full
        }
      }
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
  p2: characterMedia(page: 2, perPage: 25, sort: [POPULARITY_DESC]) {
    edges {
      characters {
        id
        name {
          full
        }
      }
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
  staffMedia(page: 1, perPage: 25, sort: [POPULARITY_DESC]) {
    edges {
      staffRole
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

export async function getStaffDetails(id: number): Promise<AniListStaff | null> {
  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        ${STAFF_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await fetchAniList<{ data?: { Staff?: any } }>(query, { id });
    const s = data.data?.Staff;
    if (!s) return null;
    return {
      ...s,
      characterMedia: {
        edges: [...(s.p1?.edges || []), ...(s.p2?.edges || [])],
      },
    };
  } catch {
    return null;
  }
}

export async function searchStaffByName(search: string): Promise<AniListStaff | null> {
  if (!search.trim()) return null;
  const query = `
    query ($search: String) {
      Staff(search: $search) {
        ${STAFF_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await fetchAniList<{ data?: { Staff?: any } }>(query, { search: search.trim() });
    const s = data.data?.Staff;
    if (!s) return null;
    return {
      ...s,
      characterMedia: {
        edges: [...(s.p1?.edges || []), ...(s.p2?.edges || [])],
      },
    };
  } catch {
    return null;
  }
}
