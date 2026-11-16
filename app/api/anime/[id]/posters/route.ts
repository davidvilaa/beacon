import { NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";
import { MovieImage } from "@/lib/tmdb";
import sharp from "sharp";

const animePosterCache = new Map<string, { posters: MovieImage[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;

interface PosterFingerprint {
  dHash: string;
  aHash: string;
  rgb: [number, number, number];
}

async function getPosterFingerprint(filePath: string): Promise<PosterFingerprint | null> {
  try {
    const url = filePath.startsWith("http")
      ? filePath
      : `https://image.tmdb.org/t/p/w92${filePath}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    const [gray9x8, rgb1x1] = await Promise.all([
      sharp(buf).grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer(),
      sharp(buf).resize(1, 1, { fit: "fill" }).raw().toBuffer(),
    ]);

    let sum = 0;
    for (let i = 0; i < 72; i++) sum += gray9x8[i];
    const avg = sum / 72;

    let dHash = "";
    let aHash = "";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const idx = r * 9 + c;
        dHash += gray9x8[idx] > gray9x8[idx + 1] ? "1" : "0";
        aHash += gray9x8[idx] >= avg ? "1" : "0";
      }
    }

    return {
      dHash,
      aHash,
      rgb: [rgb1x1[0], rgb1x1[1], rgb1x1[2]],
    };
  } catch {
    return null;
  }
}

function hammingDistance(s1: string, s2: string): number {
  let dist = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) dist++;
  }
  return dist;
}

function colorDistance(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
  );
}

function isPosterDuplicate(
  f1: PosterFingerprint,
  f2: PosterFingerprint
): boolean {
  const dDist = hammingDistance(f1.dHash, f2.dHash);
  const aDist = hammingDistance(f1.aHash, f2.aHash);
  const cDist = colorDistance(f1.rgb, f2.rgb);
  return dDist <= 12 || (dDist <= 16 && aDist <= 12) || (dDist <= 16 && cDist <= 30);
}

async function findTmdbEntry(
  queries: string[],
  isMovie: boolean
): Promise<{ id: number; mediaType: "movie" | "tv" } | null> {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();
  const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
  const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
  const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

  const headers: HeadersInit = { Accept: "application/json" };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

  for (const query of queries) {
    const cleanQuery = query.trim();
    if (!cleanQuery) continue;

    const endpoint = isMovie ? "/search/movie" : "/search/tv";
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set("query", cleanQuery);
    if (rawKey) url.searchParams.set("api_key", rawKey);

    const res = await fetch(url.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return { id: data.results[0].id, mediaType: isMovie ? "movie" : "tv" };
      }
    }

    const multiUrl = new URL(`https://api.themoviedb.org/3/search/multi`);
    multiUrl.searchParams.set("query", cleanQuery);
    if (rawKey) multiUrl.searchParams.set("api_key", rawKey);

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
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id, 10);
    if (!animeId || isNaN(animeId)) {
      return NextResponse.json({ error: "Valid anime ID required" }, { status: 400 });
    }

    const cached = animePosterCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ posters: cached.posters });
    }

    const anime = await getAnimeById(animeId);
    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    const initialPosters: MovieImage[] = [];
    const anilistCover =
      anime.coverImage?.extraLarge || anime.coverImage?.large || null;

    if (anilistCover) {
      initialPosters.push({
        file_path: anilistCover,
        aspect_ratio: 0.7,
        height: 1000,
        width: 700,
        iso_639_1: null,
        vote_average: 10,
        vote_count: 9999,
      });
    }

    const queries = [
      anime.title.english,
      anime.title.romaji,
      anime.title.native,
    ].filter(Boolean) as string[];

    const tmdbEntry = await findTmdbEntry(queries, anime.format === "MOVIE");

    let tmdbPosters: MovieImage[] = [];
    if (tmdbEntry) {
      const token = process.env.TMDB_ACCESS_TOKEN?.trim();
      const apiKey = process.env.TMDB_API_KEY?.trim();
      const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
      const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
      const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

      const headers: HeadersInit = { Accept: "application/json" };
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

      const imagesUrl = new URL(
        `https://api.themoviedb.org/3/${tmdbEntry.mediaType}/${tmdbEntry.id}/images`
      );
      if (rawKey) imagesUrl.searchParams.set("api_key", rawKey);

      const imgRes = await fetch(imagesUrl.toString(), { headers });
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        tmdbPosters = (imgData.posters || []).filter(
          (p: MovieImage) =>
            Boolean(p.file_path) &&
            (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
        );
      }
    }

    const combined = [...initialPosters, ...tmdbPosters];
    const sorted = [...combined].sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    const candidates = sorted.slice(0, 30);
    const fingerprints = await Promise.all(
      candidates.map(async (p) => {
        const fp = await getPosterFingerprint(p.file_path);
        return { poster: p, fp };
      })
    );

    const unique: MovieImage[] = [];
    const keptFps: PosterFingerprint[] = [];

    for (const item of fingerprints) {
      if (!item.fp) {
        unique.push(item.poster);
        continue;
      }

      const isDup = keptFps.some((k) => isPosterDuplicate(k, item.fp!));
      if (!isDup || item.poster.file_path === anilistCover) {
        keptFps.push(item.fp);
        unique.push(item.poster);
      }

      if (unique.length >= 25) break;
    }

    animePosterCache.set(id, { posters: unique, timestamp: Date.now() });
    return NextResponse.json({ posters: unique });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch posters" },
      { status: 500 }
    );
  }
}
