export interface RankableItem {
  media_type?: string;
  title?: string | null;
  original_title?: string | null;
  vote_count?: number | null;
  popularity?: number | null;
}

interface FameScale {
  floor: number;
  max: number;
  trendMax: number;
  typeBoost: number;
}

const MEDIA_SCALES: Record<string, FameScale> = {
  movie: { floor: 10, max: 30000, trendMax: 1000, typeBoost: 0.08 },
  tv: { floor: 10, max: 30000, trendMax: 1000, typeBoost: 0.08 },
  anime: { floor: 500, max: 800000, trendMax: 0, typeBoost: 0.04 },
  game: { floor: 3, max: 4000, trendMax: 500, typeBoost: 0.04 },
};

const RELEVANCE_WEIGHT = 0.45;
const FAME_WEIGHT = 0.55;
const TREND_WEIGHT = 0.8;
const DISCREET_RELEVANCE_WEIGHT = 0.25;
const DISCREET_PERSON_WEIGHT = 0.1;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function titleRelevance(title: string, query: string): number {
  if (!title || !query) return 0;
  if (title === query) return 1;
  if (title.startsWith(`${query} `)) return 0.8;
  if (` ${title} `.includes(` ${query} `)) return 0.6;
  if (title.includes(query)) return 0.45;
  const words = title.split(" ");
  const matchesAll = query.split(" ").every((part) => words.some((word) => word.startsWith(part)));
  return matchesAll ? 0.4 : 0.1;
}

function relevance(item: RankableItem, query: string): number {
  const normalizedQuery = normalize(query);
  return Math.max(
    titleRelevance(normalize(item.title || ""), normalizedQuery),
    titleRelevance(normalize(item.original_title || ""), normalizedQuery)
  );
}

function fame(item: RankableItem, scale: FameScale): number {
  const votes = item.vote_count ?? 0;
  const known =
    votes > scale.floor
      ? clamp(Math.log10(votes / scale.floor) / Math.log10(scale.max / scale.floor))
      : 0;
  const trend = scale.trendMax
    ? clamp(Math.log10(1 + (item.popularity ?? 0)) / Math.log10(1 + scale.trendMax))
    : 0;
  return Math.max(known, trend * TREND_WEIGHT);
}

export function searchScore(item: RankableItem, query: string): number {
  const scale = MEDIA_SCALES[item.media_type || ""];
  const match = relevance(item, query);

  if (!scale) {
    const personBonus =
      item.media_type === "person" ? clamp(Math.log10(1 + (item.popularity ?? 0)) / 2) : 0;
    return match * DISCREET_RELEVANCE_WEIGHT + personBonus * DISCREET_PERSON_WEIGHT;
  }

  return match * RELEVANCE_WEIGHT + fame(item, scale) * FAME_WEIGHT + scale.typeBoost;
}

export function sortByScore<T extends RankableItem>(items: T[], query: string): T[] {
  return items
    .map((item) => ({ item, score: searchScore(item, query) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
