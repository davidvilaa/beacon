import sharp from "sharp";
import type { MovieImage } from "@/lib/providers/tmdb/types";
import type { ArtworkKind } from "@/lib/artwork/pick";

interface Fingerprint {
  dHash: string;
  aHash: string;
  rgb: [number, number, number];
}

const THUMBNAILS: Record<ArtworkKind, { size: string; timeoutMs: number }> = {
  poster: { size: "w92", timeoutMs: 2000 },
  backdrop: { size: "w300", timeoutMs: 2500 },
};

const MAX_CANDIDATES = 100;
const DEFAULT_LIMIT = 80;

async function getFingerprint(filePath: string, kind: ArtworkKind): Promise<Fingerprint | null> {
  try {
    const { size, timeoutMs } = THUMBNAILS[kind];
    const url = filePath.startsWith("http")
      ? filePath
      : `https://image.tmdb.org/t/p/${size}${filePath}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
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

    return { dHash, aHash, rgb: [rgb1x1[0], rgb1x1[1], rgb1x1[2]] };
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

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
}

function isDuplicate(f1: Fingerprint, f2: Fingerprint): boolean {
  const dDist = hammingDistance(f1.dHash, f2.dHash);
  const aDist = hammingDistance(f1.aHash, f2.aHash);
  const cDist = colorDistance(f1.rgb, f2.rgb);
  return dDist <= 12 || (dDist <= 16 && aDist <= 12) || (dDist <= 16 && cDist <= 30);
}

export async function dedupeImages(
  images: MovieImage[],
  kind: ArtworkKind,
  options: { keepPath?: string | null; limit?: number } = {}
): Promise<MovieImage[]> {
  const { keepPath = null, limit = DEFAULT_LIMIT } = options;
  const candidates = images.slice(0, MAX_CANDIDATES);
  const fingerprints = await Promise.all(
    candidates.map(async (image) => ({ image, fp: await getFingerprint(image.file_path, kind) }))
  );

  const unique: MovieImage[] = [];
  const kept: Fingerprint[] = [];

  for (const { image, fp } of fingerprints) {
    if (!fp) {
      unique.push(image);
    } else if (image.file_path === keepPath || !kept.some((k) => isDuplicate(k, fp))) {
      kept.push(fp);
      unique.push(image);
    }

    if (unique.length >= limit) break;
  }

  return unique;
}
