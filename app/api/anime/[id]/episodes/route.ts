import { NextResponse } from "next/server";
import { cacheLife } from "next/cache";
import { fetchAniList } from "@/lib/providers/anilist/client";
import { getAnimeById } from "@/lib/providers/anilist/media";
import type { Episode } from "@/lib/media/types";

function dateDiffDays(d1: string, d2: string): number {
  return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60 * 24);
}

function sliceSeasonEpisodes(allEpisodes: any[], anime: any): any[] {
  if (!anime.episodes || allEpisodes.length <= anime.episodes) {
    return allEpisodes.slice(0, anime.episodes || allEpisodes.length);
  }

  const startYear = anime.startDate?.year;
  const startMonth = anime.startDate?.month || 1;
  const startDay = anime.startDate?.day || 1;
  const startStr = startYear
    ? `${startYear}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`
    : null;

  let startIndex = 0;
  if (startStr) {
    let closestIndex = -1;
    let minDiff = Infinity;
    allEpisodes.forEach((ep: any, idx: number) => {
      if (ep.air_date) {
        const diff = dateDiffDays(ep.air_date, startStr);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = idx;
        }
      }
    });

    if (closestIndex !== -1 && minDiff <= 30) {
      startIndex = closestIndex;
    }
  }

  return allEpisodes.slice(startIndex, startIndex + anime.episodes);
}

async function loadAnimeEpisodes(animeId: number): Promise<Episode[] | null> {
  "use cache";
  cacheLife("hours");

  const anime = await getAnimeById(animeId);
  if (!anime) {
    return null;
  }

  if (anime.format === "MOVIE" || anime.episodes === 1) {
    return [];
  }

  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();
  const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
  const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
  const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

  const headers: HeadersInit = { Accept: "application/json" };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

  const rawQueries = [
    anime.title.english,
    anime.title.romaji,
    anime.title.native,
  ].filter(Boolean) as string[];

  const queries: string[] = [];
  rawQueries.forEach((t) => {
    queries.push(t);
    const cleaned = t.replace(/\s+(Season\s+\d+|\d+(st|nd|rd|th)\s+Season|Part\s+\d+|Final\s+Season).*$/i, "").trim();
    if (cleaned && cleaned !== t) {
      queries.push(cleaned);
    }
  });

  let tmdbTvId: number | null = null;
  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    const url = new URL("https://api.themoviedb.org/3/search/tv");
    url.searchParams.set("query", cleanQuery);
    if (rawKey) url.searchParams.set("api_key", rawKey);

    const res = await fetch(url.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        tmdbTvId = data.results[0].id;
        break;
      }
    }
  }

  if (!tmdbTvId) {
    for (const query of queries) {
      const cleanQuery = query.trim();
      if (!cleanQuery) continue;

      const multiUrl = new URL("https://api.themoviedb.org/3/search/multi");
      multiUrl.searchParams.set("query", cleanQuery);
      if (rawKey) multiUrl.searchParams.set("api_key", rawKey);

      const mRes = await fetch(multiUrl.toString(), { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        const tvResult = (mData.results || []).find((r: any) => r.media_type === "tv");
        if (tvResult) {
          tmdbTvId = tvResult.id;
          break;
        }
      }
    }
  }

  if (tmdbTvId) {
    const tvUrl = new URL(`https://api.themoviedb.org/3/tv/${tmdbTvId}`);
    if (rawKey) tvUrl.searchParams.set("api_key", rawKey);

    const tvRes = await fetch(tvUrl.toString(), { headers });
    if (tvRes.ok) {
      const tvData = await tvRes.json();
      const seasons = (tvData.seasons || []).filter((s: any) => s.season_number > 0);

      if (seasons.length > 0) {
        const startYear = anime.startDate?.year;
        let matchedSeason = seasons.find(
          (s: any) =>
            s.episode_count === anime.episodes &&
            startYear &&
            s.air_date?.startsWith(String(startYear))
        );

        if (!matchedSeason && startYear) {
          matchedSeason = seasons.find((s: any) =>
            s.air_date?.startsWith(String(startYear))
          );
        }

        if (!matchedSeason && anime.episodes) {
          matchedSeason = seasons.find((s: any) => s.episode_count === anime.episodes);
        }

        if (!matchedSeason) {
          matchedSeason = seasons[0];
        }

        if (matchedSeason) {
          const seasonUrl = new URL(
            `https://api.themoviedb.org/3/tv/${tmdbTvId}/season/${matchedSeason.season_number}`
          );
          if (rawKey) seasonUrl.searchParams.set("api_key", rawKey);

          const seasonRes = await fetch(seasonUrl.toString(), { headers });
          if (seasonRes.ok) {
            const seasonData = await seasonRes.json();
            if (seasonData.episodes && seasonData.episodes.length > 0) {
              const rawEpisodes = sliceSeasonEpisodes(seasonData.episodes, anime);
              const episodes: Episode[] = rawEpisodes.map((e: any, idx: number) => ({
                id: e.id,
                episode_number: idx + 1,
                name: e.name || `Episode ${idx + 1}`,
                air_date: e.air_date || null,
                runtime: e.runtime || anime.duration || null,
                overview: e.overview || null,
                still_path: e.still_path || null,
              }));

              return episodes;
            }
          }
        }
      }
    }
  }

  try {
    const anilistQuery = `
      query ($id: Int) {
        Media(id: $id) {
          streamingEpisodes {
            title
            thumbnail
          }
        }
      }
    `;
    const anilistData = await fetchAniList<{
      data?: {
        Media?: {
          streamingEpisodes?: { title?: string; thumbnail?: string }[];
        };
      };
    }>(anilistQuery, { id: animeId });

    const streamingList = anilistData.data?.Media?.streamingEpisodes;
    if (streamingList && streamingList.length > 0) {
      const targetList = anime.episodes ? streamingList.slice(0, anime.episodes) : streamingList;
      const episodes: Episode[] = targetList.map((sEp, idx) => {
        let epName = sEp.title || `Episode ${idx + 1}`;
        const epMatch = sEp.title?.match(/Episode\s+(\d+)\s*[-:]?\s*(.*)/i);
        if (epMatch) {
          epName = epMatch[2]?.trim() || `Episode ${idx + 1}`;
        }
        return {
          id: idx + 1,
          episode_number: idx + 1,
          name: epName,
          air_date: null,
          runtime: anime.duration || null,
          overview: null,
          still_path: sEp.thumbnail || null,
        };
      });

      return episodes;
    }
  } catch {
  }

  return [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id, 10);
    if (!animeId || isNaN(animeId)) {
      return NextResponse.json({ error: "Valid Anime ID is required" }, { status: 400 });
    }

    const episodes = await loadAnimeEpisodes(animeId);
    if (!episodes) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json({ episodes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}
