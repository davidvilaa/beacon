export interface TmdbExclusionItem {
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
}

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

  return false;
}
