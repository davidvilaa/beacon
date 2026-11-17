import { NextResponse } from "next/server";
import {
  getCompanyDetails,
  searchCompany,
  CompanyDetails,
  CompanyWorkCredit,
} from "@/lib/tmdb";
import {
  getStudioDetails,
  searchStudioByName,
  AniListStudio,
} from "@/lib/anilist";

function formatFuzzyDate(
  date?: { year: number | null; month: number | null; day: number | null } | null
): string {
  if (!date?.year) return "";
  const m = String(date.month || 1).padStart(2, "0");
  const d = String(date.day || 1).padStart(2, "0");
  return `${date.year}-${m}-${d}`;
}

function mapAniListStudioToWorks(studio: AniListStudio): CompanyWorkCredit[] {
  const works: CompanyWorkCredit[] = [];
  const edges = studio.media?.edges || [];
  const seen = new Set<number>();

  for (const edge of edges) {
    const node = edge.node;
    if (!node || seen.has(node.id)) continue;
    seen.add(node.id);

    const releaseDate = formatFuzzyDate(node.startDate);
    const voteAvg = node.averageScore
      ? Number((node.averageScore / 10).toFixed(1))
      : 0;
    const pop = node.popularity || 0;
    const poster = node.coverImage?.large || node.coverImage?.medium || null;
    const backdrop = node.bannerImage || null;
    const title =
      node.title.romaji || node.title.english || node.title.native || "Untitled";

    works.push({
      id: node.id,
      title,
      poster_path: poster,
      backdrop_path: backdrop,
      release_date: releaseDate,
      first_air_date: releaseDate,
      vote_average: voteAvg,
      vote_count: pop,
      media_type: "anime",
      popularity: pop,
    });
  }

  return works;
}

function mergeStudioWorks(
  animeWorks: CompanyWorkCredit[],
  tmdbWorks: CompanyWorkCredit[]
): CompanyWorkCredit[] {
  const normalizedAnimeTitles = new Set(
    animeWorks
      .map((w) => (w.title || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
      .filter(Boolean)
  );

  const filteredTmdb = tmdbWorks.filter((w) => {
    const norm = (w.title || w.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (norm && normalizedAnimeTitles.has(norm)) return false;
    return true;
  });

  return [...animeWorks, ...filteredTmdb];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    const isAniList = id.startsWith("al-") || id.startsWith("anilist-");

    if (isAniList) {
      const studioId = parseInt(id.replace(/^(al|anilist)-/, ""), 10);
      if (isNaN(studioId)) {
        return NextResponse.json({ error: "Invalid studio ID" }, { status: 400 });
      }

      const studio = await getStudioDetails(studioId);
      if (!studio) {
        return NextResponse.json({ error: "Studio not found" }, { status: 404 });
      }

      const animeWorks = mapAniListStudioToWorks(studio);

      let tmdbDetails: CompanyDetails | null = null;
      try {
        const tmdbSearch = await searchCompany(studio.name);
        const match = tmdbSearch.results?.[0];
        if (match?.id) {
          tmdbDetails = await getCompanyDetails(match.id);
        }
      } catch {}

      const tmdbWorks = tmdbDetails?.works || [];
      const mergedWorks = mergeStudioWorks(animeWorks, tmdbWorks);

      const responseData: CompanyDetails = {
        id,
        name: studio.name,
        description: tmdbDetails?.description || "",
        headquarters: tmdbDetails?.headquarters || "Tokyo, Japan",
        homepage: studio.siteUrl || tmdbDetails?.homepage || "",
        logo_path: tmdbDetails?.logo_path || null,
        origin_country: tmdbDetails?.origin_country || "JP",
        parent_company: tmdbDetails?.parent_company || null,
        works: mergedWorks,
      };

      return NextResponse.json(responseData);
    }

    let tmdbDetails: CompanyDetails | null = null;
    try {
      tmdbDetails = await getCompanyDetails(id);
    } catch {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const studio = await getStudioDetails(numId);
        if (studio) {
          const animeWorks = mapAniListStudioToWorks(studio);
          let matchDetails: CompanyDetails | null = null;
          try {
            const tmdbSearch = await searchCompany(studio.name);
            const match = tmdbSearch.results?.[0];
            if (match?.id) {
              matchDetails = await getCompanyDetails(match.id);
            }
          } catch {}

          const tmdbWorks = matchDetails?.works || [];
          const responseData: CompanyDetails = {
            id,
            name: studio.name,
            description: matchDetails?.description || "",
            headquarters: matchDetails?.headquarters || "Tokyo, Japan",
            homepage: studio.siteUrl || matchDetails?.homepage || "",
            logo_path: matchDetails?.logo_path || null,
            origin_country: matchDetails?.origin_country || "JP",
            parent_company: matchDetails?.parent_company || null,
            works: mergeStudioWorks(animeWorks, tmdbWorks),
          };

          return NextResponse.json(responseData);
        }
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    let studio: AniListStudio | null = null;
    try {
      studio = await searchStudioByName(tmdbDetails.name);
    } catch {}

    if (studio) {
      const animeWorks = mapAniListStudioToWorks(studio);
      const currentWorks = tmdbDetails.works || [];
      if (!tmdbDetails.homepage && studio.siteUrl) {
        tmdbDetails.homepage = studio.siteUrl;
      }
      tmdbDetails.works = mergeStudioWorks(animeWorks, currentWorks);
    }

    return NextResponse.json(tmdbDetails);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
