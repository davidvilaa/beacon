import { cacheLife } from "next/cache";
import { getCompanyDetails } from "@/lib/providers/tmdb/companies";
import { searchCompany } from "@/lib/providers/tmdb/search";
import type { CompanyDetails, CompanyWorkCredit } from "@/lib/providers/tmdb/types";
import { getStudioDetails, searchStudioByName } from "@/lib/providers/anilist/studios";
import type { AniListStudio } from "@/lib/providers/anilist/types";

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

async function loadCompanyDetail(id: string): Promise<CompanyDetails | null> {
  try {
    if (!id) {
      return null;
    }

    const isAniList = id.startsWith("al-") || id.startsWith("anilist-");

    if (isAniList) {
      const studioId = parseInt(id.replace(/^(al|anilist)-/, ""), 10);
      if (isNaN(studioId)) {
        return null;
      }

      const studio = await getStudioDetails(studioId);
      if (!studio) {
        return null;
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

      return responseData;
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

          return responseData;
        }
      }
      return null;
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

    return tmdbDetails;
  } catch (error) {
    throw error;
  }
}

export async function getCompanyDetail(id: string): Promise<CompanyDetails | null> {
  "use cache";
  cacheLife("hours");
  return loadCompanyDetail(id);
}
