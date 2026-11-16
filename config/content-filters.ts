export interface TmdbExclusionItem {
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
  original_language?: string;
  origin_country?: string[];
  name?: string;
  title?: string;
  first_air_date?: string;
}

const ASIAN_ANIMATION_LANGUAGES = ["ja", "zh", "ko", "yue", "cn"];
const ASIAN_ANIMATION_COUNTRIES = ["JP", "CN", "KR", "TW", "HK"];

export const CONTENT_FILTERS = {
  tmdb: {
    excludedGenreIds: [
      10767,
      10763,
      10764,
      10766,
      10762,
      10402,
      10770,
    ],
    excludeAnimeFromTv: true,
  },
  games: {
    excludedCategoryIds: [] as number[],
    excludedGenreIds: [] as number[],
  },
  anime: {
    excludedGenres: [] as string[],
  },
};

export function isExcludedTmdbMedia(item: TmdbExclusionItem): boolean {
  const ids: number[] = [];

  if (Array.isArray(item.genre_ids)) {
    ids.push(...item.genre_ids);
  }

  if (Array.isArray(item.genres)) {
    item.genres.forEach((g) => {
      if (typeof g.id === "number") ids.push(g.id);
    });
  }

  if (ids.length > 0) {
    const isGenreExcluded = ids.some((id) =>
      CONTENT_FILTERS.tmdb.excludedGenreIds.includes(id)
    );
    if (isGenreExcluded) return true;
  }

  if (CONTENT_FILTERS.tmdb.excludeAnimeFromTv && ids.includes(16)) {
    const isTv =
      item.media_type === "tv" ||
      Boolean(item.first_air_date) ||
      (Boolean(item.name) && !Boolean(item.title));

    if (isTv) {
      const lang = (item.original_language || "").toLowerCase().trim();
      const countries = Array.isArray(item.origin_country)
        ? item.origin_country.map((c) => String(c).toUpperCase().trim())
        : [];

      const isAsian =
        ASIAN_ANIMATION_LANGUAGES.includes(lang) ||
        countries.some((c) => ASIAN_ANIMATION_COUNTRIES.includes(c));

      if (isAsian) return true;
    }
  }

  return false;
}
