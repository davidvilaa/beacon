export interface SeasonLike {
  season_number: number;
  name?: string | null;
}

export function regularSeasons<T extends SeasonLike>(seasons: T[] | undefined | null): T[] {
  return (seasons || [])
    .filter((season) => season.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);
}

export function seasonHref(tvId: number | string, seasonNumber: number): string {
  return `/tv/${tvId}/season/${seasonNumber}`;
}

export function seasonTitle(
  showName: string,
  season: SeasonLike | null | undefined,
  seasonCount: number
): string {
  if (!season || seasonCount <= 1) return showName;
  const name = season.name?.trim() || `Season ${season.season_number}`;
  return name.toLowerCase().includes(showName.toLowerCase()) ? name : `${showName} ${name}`;
}
