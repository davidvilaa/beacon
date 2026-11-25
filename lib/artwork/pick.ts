import type { MovieImage } from "@/lib/tmdb";

export type ArtworkKind = "poster" | "backdrop";

const ASPECT_RANGES: Record<ArtworkKind, [number, number]> = {
  poster: [0.55, 0.8],
  backdrop: [1.4, 2.2],
};

export function filterByAspect<T extends MovieImage>(images: T[], kind: ArtworkKind): T[] {
  const [min, max] = ASPECT_RANGES[kind];
  return images.filter(
    (image) =>
      Boolean(image.file_path) &&
      (!image.aspect_ratio || (image.aspect_ratio >= min && image.aspect_ratio <= max))
  );
}

export function sortByVotes<T extends MovieImage>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
    if (countDiff !== 0) return countDiff;
    return (b.vote_average ?? 0) - (a.vote_average ?? 0);
  });
}

function languageRank(image: MovieImage): number {
  if (image.iso_639_1 === "en") return 2;
  if (image.iso_639_1 === null) return 1;
  return 0;
}

export function sortByLanguageThenVotes<T extends MovieImage>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const langDiff = languageRank(b) - languageRank(a);
    if (langDiff !== 0) return langDiff;
    const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
    if (countDiff !== 0) return countDiff;
    return (b.vote_average ?? 0) - (a.vote_average ?? 0);
  });
}

export function uniqueByPath<T extends MovieImage>(images: T[]): T[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.file_path || seen.has(image.file_path)) return false;
    seen.add(image.file_path);
    return true;
  });
}

export function pickBestPoster(images: MovieImage[] | undefined | null): string | null {
  return sortByVotes(filterByAspect(images || [], "poster"))[0]?.file_path || null;
}

function randomItem<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomPath(images: MovieImage[], top = 10): string | null {
  return randomItem(images.slice(0, top))?.file_path || null;
}

export function pickRandomBackdrop(
  images: MovieImage[] | undefined | null,
  defaultPath: string | null
): string | null {
  const valid = filterByAspect(images || [], "backdrop");
  const byVotes = (list: MovieImage[]) =>
    [...list].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

  const scenic = byVotes(
    valid.filter(
      (b) =>
        b.file_path !== defaultPath &&
        (b.width ?? 0) >= 1920 &&
        (b.iso_639_1 === null || b.iso_639_1 === "en")
    )
  );
  if (scenic.length > 0) return pickRandomPath(scenic);

  const withoutDefault = byVotes(valid.filter((b) => b.file_path !== defaultPath));
  if (withoutDefault.length > 0) return pickRandomPath(withoutDefault);

  return valid[0]?.file_path || defaultPath;
}

export function pickRandomPoster(
  images: MovieImage[] | undefined | null,
  defaultPath: string | null
): string | null {
  const valid = (images || []).filter(
    (p) =>
      Boolean(p.file_path) &&
      (!p.aspect_ratio || (p.aspect_ratio >= 0.6 && p.aspect_ratio <= 0.75))
  );
  if (valid.length === 0) return defaultPath;
  return pickRandomPath(sortByLanguageThenVotesOnly(valid), 5) || defaultPath;
}

function sortByLanguageThenVotesOnly<T extends MovieImage>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const langDiff = languageRank(b) - languageRank(a);
    if (langDiff !== 0) return langDiff;
    return (b.vote_count ?? 0) - (a.vote_count ?? 0);
  });
}
