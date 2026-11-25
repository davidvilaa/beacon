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
    startDate?: AnimeFuzzyDate | null;
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

export interface AniListStaffCharacterMediaEdge {
  characters?: {
    id: number;
    name: {
      full: string;
      native?: string | null;
    };
  }[];
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage?: string | null;
    format?: string | null;
    episodes?: number | null;
    startDate?: AnimeFuzzyDate | null;
    popularity?: number | null;
    averageScore?: number | null;
  };
}

export interface AniListStaffMediaEdge {
  staffRole: string;
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage?: string | null;
    format?: string | null;
    episodes?: number | null;
    startDate?: AnimeFuzzyDate | null;
    popularity?: number | null;
    averageScore?: number | null;
  };
}

export interface AniListStaff {
  id: number;
  name: {
    full: string;
    native: string | null;
    userPreferred?: string | null;
    alternative?: string[];
  };
  image: {
    large: string | null;
    medium: string | null;
  } | null;
  description: string | null;
  gender?: string | null;
  dateOfBirth?: AnimeFuzzyDate | null;
  characterMedia?: {
    edges?: AniListStaffCharacterMediaEdge[];
  };
  staffMedia?: {
    edges?: AniListStaffMediaEdge[];
  };
}

export interface AniListStudioMediaEdge {
  isMainStudio?: boolean;
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage?: string | null;
    format?: string | null;
    episodes?: number | null;
    startDate?: AnimeFuzzyDate | null;
    popularity?: number | null;
    averageScore?: number | null;
  };
}

export interface AniListStudio {
  id: number;
  name: string;
  isAnimationStudio?: boolean;
  siteUrl?: string | null;
  media?: {
    edges?: AniListStudioMediaEdge[];
  };
}
