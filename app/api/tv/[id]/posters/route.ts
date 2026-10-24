import { NextResponse } from "next/server";
import { MovieImage } from "@/lib/tmdb";
import sharp from "sharp";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface PosterFingerprint {
  dHash: string;
  aHash: string;
  rgb: [number, number, number];
}

async function getPosterFingerprint(filePath: string): Promise<PosterFingerprint | null> {
  try {
    const res = await fetch(`https://image.tmdb.org/t/p/w92${filePath}`, {
      signal: AbortSignal.timeout(3500),
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "TV ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");

    const token = process.env.TMDB_ACCESS_TOKEN?.trim();
    const apiKey = process.env.TMDB_API_KEY?.trim();

    const isJwt = (val?: string) => Boolean(val && (val.startsWith("ey") || val.length > 50));
    const bearerToken = isJwt(token) ? token : isJwt(apiKey) ? apiKey : null;
    const rawKey = !isJwt(apiKey) && apiKey ? apiKey : !isJwt(token) && token ? token : null;

    const headers: HeadersInit = { Accept: "application/json" };
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const seasonUrl = season
      ? new URL(`${TMDB_BASE_URL}/tv/${id}/season/${season}/images`)
      : null;
    const tvUrl = new URL(`${TMDB_BASE_URL}/tv/${id}/images`);

    if (rawKey) {
      if (seasonUrl) seasonUrl.searchParams.set("api_key", rawKey);
      tvUrl.searchParams.set("api_key", rawKey);
    }

    const [seasonRes, tvRes] = await Promise.all([
      seasonUrl
        ? fetch(seasonUrl.toString(), { headers, next: { revalidate: 3600 } }).catch(() => null)
        : null,
      fetch(tvUrl.toString(), { headers, next: { revalidate: 3600 } }).catch(() => null),
    ]);

    const seasonData = seasonRes && seasonRes.ok ? await seasonRes.json() : null;
    const tvData = tvRes && tvRes.ok ? await tvRes.json() : null;

    const validSeason = (seasonData?.posters || []).filter(
      (p: MovieImage) =>
        Boolean(p.file_path) &&
        (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
    );
    const sortedSeason = [...validSeason].sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    const validTv = (tvData?.posters || []).filter(
      (p: MovieImage) =>
        Boolean(p.file_path) &&
        (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
    );
    const sortedTv = [...validTv].sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    const combined = [...sortedSeason, ...sortedTv];
    const seen = new Set<string>();
    const prioritized = combined.filter((p) => {
      if (!p.file_path || seen.has(p.file_path)) return false;
      seen.add(p.file_path);
      return true;
    });

    const candidates = prioritized.slice(0, 45);
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
      if (!isDup) {
        keptFps.push(item.fp);
        unique.push(item.poster);
      }

      if (unique.length >= 30) break;
    }

    return NextResponse.json({ posters: unique });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch posters" },
      { status: 500 }
    );
  }
}
