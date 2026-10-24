import { NextResponse } from "next/server";
import { MovieImage } from "@/lib/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

    const seasonPosters: MovieImage[] = seasonData?.posters || [];
    const tvPosters: MovieImage[] = tvData?.posters || [];

    const combined = [...seasonPosters, ...tvPosters];
    const seen = new Set<string>();
    const valid = combined.filter((p) => {
      if (!p.file_path || seen.has(p.file_path)) return false;
      seen.add(p.file_path);
      return !p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8);
    });

    const sorted = valid.sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    return NextResponse.json({ posters: sorted.slice(0, 80) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch posters" },
      { status: 500 }
    );
  }
}
