import { fetchFromIgdb, getIgdbImageUrl } from "@/lib/providers/igdb/client";
import type { IGDBGameDetail, IGDBSearchItem, IGDBSearchResponse } from "@/lib/providers/igdb/types";

export async function searchGames(
  query: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "popularity"
): Promise<IGDBSearchResponse> {
  const cleanQuery = query.trim();
  const offset = Math.max(0, (page - 1) * limit);

  if (!cleanQuery) {
    let orderClause = "sort rating desc;";
    if (sortBy === "newest") orderClause = "sort first_release_date desc;";
    if (sortBy === "oldest") orderClause = "sort first_release_date asc;";

    const body = `
      fields id, name, summary, cover.image_id, first_release_date, rating, total_rating;
      where cover != null & rating != null;
      ${orderClause}
      limit ${limit};
      offset ${offset};
    `;

    const results = await fetchFromIgdb<IGDBSearchItem[]>("games", body);
    return {
      results: results || [],
      total: 1000,
      page,
      limit,
    };
  }

  const escapedQuery = cleanQuery.replace(/"/g, '\\"');
  const body = `
    fields id, name, summary, cover.image_id, first_release_date, rating, total_rating;
    search "${escapedQuery}";
    limit ${limit};
    offset ${offset};
  `;

  const [results, countRes] = await Promise.all([
    fetchFromIgdb<IGDBSearchItem[]>("games", body),
    fetchFromIgdb<{ count: number }[]>("games/count", `search "${escapedQuery}";`),
  ]);

  const total = countRes?.[0]?.count ?? (results?.length || 0);

  return {
    results: results || [],
    total,
    page,
    limit,
  };
}

export async function getGameDetails(id: number): Promise<IGDBGameDetail | null> {
  const body = `
    fields id, name, summary, storyline, first_release_date, rating, aggregated_rating, total_rating,
           cover.image_id,
           screenshots.image_id,
           artworks.image_id,
           genres.name,
           platforms.name, platforms.abbreviation,
           involved_companies.developer, involved_companies.publisher, involved_companies.company.name,
           videos.name, videos.video_id,
           game_modes.name,
           themes.name,
           dlcs.name, dlcs.cover.image_id, dlcs.first_release_date,
           expansions.name, expansions.cover.image_id, expansions.first_release_date,
           remakes.name, remakes.cover.image_id, remakes.first_release_date,
           remasters.name, remasters.cover.image_id, remasters.first_release_date,
           similar_games.name, similar_games.cover.image_id, similar_games.first_release_date,
           franchises.name, franchises.games.name, franchises.games.cover.image_id, franchises.games.first_release_date,
           collections.name, collections.games.name, collections.games.cover.image_id, collections.games.first_release_date,
           parent_game.name, parent_game.cover.image_id, parent_game.first_release_date;
    where id = ${id};
    limit 1;
  `;

  const results = await fetchFromIgdb<IGDBGameDetail[]>("games", body);
  return results?.[0] || null;
}

export async function getGameArtworks(id: number): Promise<{
  posters: string[];
  backdrops: string[];
}> {
  const gameBody = `
    fields id, cover.image_id, cover.width, cover.height,
           screenshots.image_id,
           artworks.image_id, artworks.width, artworks.height;
    where id = ${id};
    limit 1;
  `;

  const [games, covers] = await Promise.all([
    fetchFromIgdb<any[]>("games", gameBody),
    fetchFromIgdb<any[]>("covers", `fields image_id, width, height; where game = ${id}; limit 20;`).catch(() => []),
  ]);

  const game = games?.[0];
  if (!game) return { posters: [], backdrops: [] };

  const posters: string[] = [];
  if (game.cover?.image_id) {
    const url = getIgdbImageUrl(game.cover.image_id, "1080p");
    if (url) posters.push(url);
  }

  for (const c of covers || []) {
    if (c.image_id) {
      const url = getIgdbImageUrl(c.image_id, "1080p");
      if (url && !posters.includes(url)) posters.push(url);
    }
  }

  for (const a of game.artworks || []) {
    if (
      a.image_id &&
      typeof a.height === "number" &&
      typeof a.width === "number" &&
      a.height > a.width
    ) {
      const url = getIgdbImageUrl(a.image_id, "1080p");
      if (url && !posters.includes(url)) posters.push(url);
    }
  }

  const backdrops: string[] = [];
  for (const s of game.screenshots || []) {
    if (s.image_id) {
      const url = getIgdbImageUrl(s.image_id, "1080p");
      if (url && !backdrops.includes(url)) backdrops.push(url);
    }
  }
  for (const a of game.artworks || []) {
    if (
      a.image_id &&
      (typeof a.width !== "number" ||
        typeof a.height !== "number" ||
        a.width >= a.height)
    ) {
      const url = getIgdbImageUrl(a.image_id, "1080p");
      if (url && !backdrops.includes(url)) backdrops.push(url);
    }
  }

  return { posters, backdrops };
}
