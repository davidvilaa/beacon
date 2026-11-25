export interface IGDBImage {
  id: number;
  image_id: string;
}

export interface IGDBNamedItem {
  id: number;
  name: string;
}

export interface IGDBPlatform {
  id: number;
  name: string;
  abbreviation?: string;
}

export interface IGDBCompanyItem {
  id: number;
  developer?: boolean;
  publisher?: boolean;
  company: {
    id: number;
    name: string;
    logo?: IGDBImage;
  };
}

export interface IGDBVideo {
  id: number;
  name?: string;
  video_id: string;
}

export interface IGDBRelatedGame {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: IGDBImage;
}

export interface IGDBFranchise {
  id: number;
  name: string;
  games?: IGDBRelatedGame[];
}

export interface IGDBCollection {
  id: number;
  name: string;
  games?: IGDBRelatedGame[];
}

export interface IGDBGameDetail {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  rating?: number;
  aggregated_rating?: number;
  total_rating?: number;
  cover?: IGDBImage;
  screenshots?: IGDBImage[];
  artworks?: IGDBImage[];
  genres?: IGDBNamedItem[];
  platforms?: IGDBPlatform[];
  involved_companies?: IGDBCompanyItem[];
  videos?: IGDBVideo[];
  game_modes?: IGDBNamedItem[];
  themes?: IGDBNamedItem[];
  dlcs?: IGDBRelatedGame[];
  expansions?: IGDBRelatedGame[];
  remakes?: IGDBRelatedGame[];
  remasters?: IGDBRelatedGame[];
  similar_games?: IGDBRelatedGame[];
  franchises?: IGDBFranchise[];
  collections?: IGDBCollection[];
  parent_game?: IGDBRelatedGame;
}

export interface IGDBSearchItem {
  id: number;
  name: string;
  summary?: string;
  cover?: IGDBImage;
  first_release_date?: number;
  rating?: number;
  total_rating?: number;
}

export interface IGDBSearchResponse {
  results: IGDBSearchItem[];
  total: number;
  page: number;
  limit: number;
}
