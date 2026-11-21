import { NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";
import { fetchFromIgdb, getIgdbImageUrl } from "@/lib/igdb";

interface RawMediaImage {
  id: string;
  url: string;
  thumbnail_url: string;
  file_path?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  iso_639_1?: string | null;
  vote_average?: number;
  vote_count?: number;
  media_category: "poster" | "backdrop" | "logo" | "artwork" | "screenshot" | "cover";
  source: "tmdb" | "anilist" | "igdb";
  season_number?: number;
  season_name?: string;
}

function getTmdbAuth() {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();
  const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
  const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
  const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

  const headers: HeadersInit = { Accept: "application/json" };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

  return { headers, rawKey };
}

async function findAnimeTmdbEntry(
  queries: string[],
  isMovie: boolean
): Promise<{ id: number; mediaType: "movie" | "tv" } | null> {
  const { headers, rawKey } = getTmdbAuth();

  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    const endpoint = isMovie ? "/search/movie" : "/search/tv";
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set("query", cleanQuery);
    if (rawKey) url.searchParams.set("api_key", rawKey);

    try {
      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return { id: data.results[0].id, mediaType: isMovie ? "movie" : "tv" };
        }
      }
    } catch {}

    const multiUrl = new URL(`https://api.themoviedb.org/3/search/multi`);
    multiUrl.searchParams.set("query", cleanQuery);
    if (rawKey) multiUrl.searchParams.set("api_key", rawKey);

    try {
      const mRes = await fetch(multiUrl.toString(), { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        const filtered = (mData.results || []).filter(
          (r: any) => r.media_type === "tv" || r.media_type === "movie"
        );
        if (filtered.length > 0) {
          return { id: filtered[0].id, mediaType: filtered[0].media_type };
        }
      }
    } catch {}
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const mediaType = (searchParams.get("media_type") || searchParams.get("type") || "movie").toLowerCase();

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const { headers, rawKey } = getTmdbAuth();
    const images: RawMediaImage[] = [];

    if (mediaType === "movie") {
      const imagesUrl = new URL(`https://api.themoviedb.org/3/movie/${id}/images`);
      if (rawKey) imagesUrl.searchParams.set("api_key", rawKey);

      const res = await fetch(imagesUrl.toString(), { headers });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `TMDB error: ${errText}` }, { status: res.status });
      }

      const data = await res.json();

      (data.posters || []).forEach((p: any, idx: number) => {
        if (!p.file_path) return;
        images.push({
          id: `tmdb-poster-${idx}-${p.file_path}`,
          url: `https://image.tmdb.org/t/p/original${p.file_path}`,
          thumbnail_url: `https://image.tmdb.org/t/p/w500${p.file_path}`,
          file_path: p.file_path,
          width: p.width,
          height: p.height,
          aspect_ratio: p.aspect_ratio ? parseFloat(p.aspect_ratio.toFixed(2)) : undefined,
          iso_639_1: p.iso_639_1 ?? null,
          vote_average: p.vote_average,
          vote_count: p.vote_count,
          media_category: "poster",
          source: "tmdb",
        });
      });

      (data.backdrops || []).forEach((b: any, idx: number) => {
        if (!b.file_path) return;
        images.push({
          id: `tmdb-backdrop-${idx}-${b.file_path}`,
          url: `https://image.tmdb.org/t/p/original${b.file_path}`,
          thumbnail_url: `https://image.tmdb.org/t/p/w780${b.file_path}`,
          file_path: b.file_path,
          width: b.width,
          height: b.height,
          aspect_ratio: b.aspect_ratio ? parseFloat(b.aspect_ratio.toFixed(2)) : undefined,
          iso_639_1: b.iso_639_1 ?? null,
          vote_average: b.vote_average,
          vote_count: b.vote_count,
          media_category: "backdrop",
          source: "tmdb",
        });
      });
    } else if (mediaType === "tv" || mediaType === "series") {
      const imagesUrl = new URL(`https://api.themoviedb.org/3/tv/${id}/images`);
      if (rawKey) imagesUrl.searchParams.set("api_key", rawKey);

      const detailsUrl = new URL(`https://api.themoviedb.org/3/tv/${id}`);
      if (rawKey) detailsUrl.searchParams.set("api_key", rawKey);

      const [res, detailsRes] = await Promise.all([
        fetch(imagesUrl.toString(), { headers }),
        fetch(detailsUrl.toString(), { headers }).catch(() => null),
      ]);

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `TMDB error: ${errText}` }, { status: res.status });
      }

      const data = await res.json();
      const detailsData = detailsRes?.ok ? await detailsRes.json() : null;

      (data.posters || []).forEach((p: any, idx: number) => {
        if (!p.file_path) return;
        images.push({
          id: `tmdb-poster-${idx}-${p.file_path}`,
          url: `https://image.tmdb.org/t/p/original${p.file_path}`,
          thumbnail_url: `https://image.tmdb.org/t/p/w500${p.file_path}`,
          file_path: p.file_path,
          width: p.width,
          height: p.height,
          aspect_ratio: p.aspect_ratio ? parseFloat(p.aspect_ratio.toFixed(2)) : undefined,
          iso_639_1: p.iso_639_1 ?? null,
          vote_average: p.vote_average,
          vote_count: p.vote_count,
          media_category: "poster",
          source: "tmdb",
        });
      });

      (data.backdrops || []).forEach((b: any, idx: number) => {
        if (!b.file_path) return;
        images.push({
          id: `tmdb-backdrop-${idx}-${b.file_path}`,
          url: `https://image.tmdb.org/t/p/original${b.file_path}`,
          thumbnail_url: `https://image.tmdb.org/t/p/w780${b.file_path}`,
          file_path: b.file_path,
          width: b.width,
          height: b.height,
          aspect_ratio: b.aspect_ratio ? parseFloat(b.aspect_ratio.toFixed(2)) : undefined,
          iso_639_1: b.iso_639_1 ?? null,
          vote_average: b.vote_average,
          vote_count: b.vote_count,
          media_category: "backdrop",
          source: "tmdb",
        });
      });

      if (detailsData?.seasons && Array.isArray(detailsData.seasons)) {
        const seasons = detailsData.seasons.filter((s: any) => s.season_number >= 0);
        await Promise.all(
          seasons.map(async (s: any) => {
            try {
              const seasonImgUrl = new URL(
                `https://api.themoviedb.org/3/tv/${id}/season/${s.season_number}/images`
              );
              if (rawKey) seasonImgUrl.searchParams.set("api_key", rawKey);
              const sRes = await fetch(seasonImgUrl.toString(), { headers });
              if (sRes.ok) {
                const sData = await sRes.json();
                (sData.posters || []).forEach((p: any, sIdx: number) => {
                  if (!p.file_path) return;
                  images.push({
                    id: `tmdb-season-${s.season_number}-${sIdx}-${p.file_path}`,
                    url: `https://image.tmdb.org/t/p/original${p.file_path}`,
                    thumbnail_url: `https://image.tmdb.org/t/p/w500${p.file_path}`,
                    file_path: p.file_path,
                    width: p.width,
                    height: p.height,
                    aspect_ratio: p.aspect_ratio ? parseFloat(p.aspect_ratio.toFixed(2)) : undefined,
                    iso_639_1: p.iso_639_1 ?? null,
                    vote_average: p.vote_average,
                    vote_count: p.vote_count,
                    media_category: "poster",
                    source: "tmdb",
                    season_number: s.season_number,
                    season_name: s.name,
                  });
                });
              }
            } catch {}
          })
        );
      }
    } else if (mediaType === "anime") {
      const animeId = parseInt(id, 10);
      if (isNaN(animeId)) {
        return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
      }

      const anime = await getAnimeById(animeId);
      if (!anime) {
        return NextResponse.json({ error: "Anime not found" }, { status: 404 });
      }

      if (anime.coverImage?.extraLarge) {
        images.push({
          id: `anilist-cover-extralarge`,
          url: anime.coverImage.extraLarge,
          thumbnail_url: anime.coverImage.large || anime.coverImage.extraLarge,
          media_category: "poster",
          source: "anilist",
          width: 800,
          height: 1200,
          aspect_ratio: 0.67,
          iso_639_1: "ja",
        });
      } else if (anime.coverImage?.large) {
        images.push({
          id: `anilist-cover-large`,
          url: anime.coverImage.large,
          thumbnail_url: anime.coverImage.large,
          media_category: "poster",
          source: "anilist",
          iso_639_1: "ja",
        });
      }

      if (anime.bannerImage) {
        images.push({
          id: `anilist-banner`,
          url: anime.bannerImage,
          thumbnail_url: anime.bannerImage,
          media_category: "backdrop",
          source: "anilist",
        });
      }

      const queries = [
        anime.title.english,
        anime.title.romaji,
        anime.title.native,
      ].filter(Boolean) as string[];

      const tmdbEntry = await findAnimeTmdbEntry(queries, anime.format === "MOVIE");
      if (tmdbEntry) {
        const imagesUrl = new URL(
          `https://api.themoviedb.org/3/${tmdbEntry.mediaType}/${tmdbEntry.id}/images`
        );
        if (rawKey) imagesUrl.searchParams.set("api_key", rawKey);

        const tmdbRes = await fetch(imagesUrl.toString(), { headers });
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          (tmdbData.posters || []).forEach((p: any, idx: number) => {
            if (!p.file_path) return;
            images.push({
              id: `tmdb-anime-poster-${idx}-${p.file_path}`,
              url: `https://image.tmdb.org/t/p/original${p.file_path}`,
              thumbnail_url: `https://image.tmdb.org/t/p/w500${p.file_path}`,
              file_path: p.file_path,
              width: p.width,
              height: p.height,
              aspect_ratio: p.aspect_ratio ? parseFloat(p.aspect_ratio.toFixed(2)) : undefined,
              iso_639_1: p.iso_639_1 ?? null,
              vote_average: p.vote_average,
              vote_count: p.vote_count,
              media_category: "poster",
              source: "tmdb",
            });
          });

          (tmdbData.backdrops || []).forEach((b: any, idx: number) => {
            if (!b.file_path) return;
            images.push({
              id: `tmdb-anime-backdrop-${idx}-${b.file_path}`,
              url: `https://image.tmdb.org/t/p/original${b.file_path}`,
              thumbnail_url: `https://image.tmdb.org/t/p/w780${b.file_path}`,
              file_path: b.file_path,
              width: b.width,
              height: b.height,
              aspect_ratio: b.aspect_ratio ? parseFloat(b.aspect_ratio.toFixed(2)) : undefined,
              iso_639_1: b.iso_639_1 ?? null,
              vote_average: b.vote_average,
              vote_count: b.vote_count,
              media_category: "backdrop",
              source: "tmdb",
            });
          });
        }
      }
    } else if (mediaType === "game" || mediaType === "games") {
      const gameId = parseInt(id, 10);
      if (isNaN(gameId)) {
        return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
      }

      const [covers, artworks, screenshots] = await Promise.all([
        fetchFromIgdb<any[]>(
          "covers",
          `fields id, image_id, width, height; where game = ${gameId}; limit 50;`
        ).catch(() => []),
        fetchFromIgdb<any[]>(
          "artworks",
          `fields id, image_id, width, height; where game = ${gameId}; limit 50;`
        ).catch(() => []),
        fetchFromIgdb<any[]>(
          "screenshots",
          `fields id, image_id, width, height; where game = ${gameId}; limit 50;`
        ).catch(() => []),
      ]);

      (covers || []).forEach((c: any, idx: number) => {
        if (!c.image_id) return;
        const url = getIgdbImageUrl(c.image_id, "1080p") || `https://images.igdb.com/igdb/image/upload/t_1080p/${c.image_id}.jpg`;
        images.push({
          id: `igdb-cover-${idx}-${c.image_id}`,
          url,
          thumbnail_url: url,
          width: c.width,
          height: c.height,
          aspect_ratio: c.width && c.height ? parseFloat((c.width / c.height).toFixed(2)) : undefined,
          media_category: "poster",
          source: "igdb",
        });
      });

      (artworks || []).forEach((a: any, idx: number) => {
        if (!a.image_id) return;
        const url = getIgdbImageUrl(a.image_id, "1080p") || `https://images.igdb.com/igdb/image/upload/t_1080p/${a.image_id}.jpg`;
        const isVertical = typeof a.width === "number" && typeof a.height === "number" && a.height > a.width;
        images.push({
          id: `igdb-artwork-${idx}-${a.image_id}`,
          url,
          thumbnail_url: url,
          width: a.width,
          height: a.height,
          aspect_ratio: a.width && a.height ? parseFloat((a.width / a.height).toFixed(2)) : undefined,
          media_category: isVertical ? "poster" : "backdrop",
          source: "igdb",
        });
      });

      (screenshots || []).forEach((s: any, idx: number) => {
        if (!s.image_id) return;
        const url = getIgdbImageUrl(s.image_id, "1080p") || `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`;
        images.push({
          id: `igdb-screenshot-${idx}-${s.image_id}`,
          url,
          thumbnail_url: url,
          width: s.width,
          height: s.height,
          aspect_ratio: s.width && s.height ? parseFloat((s.width / s.height).toFixed(2)) : undefined,
          media_category: "backdrop",
          source: "igdb",
        });
      });
    }

    return NextResponse.json({
      id,
      media_type: mediaType,
      total_count: images.length,
      posters_count: images.filter((i) => i.media_category === "poster").length,
      backdrops_count: images.filter((i) => i.media_category === "backdrop").length,
      images,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch unfiltered test posters" },
      { status: 500 }
    );
  }
}
