import { NextResponse } from "next/server";
import {
  getPersonDetails,
  searchPerson,
  PersonDetails,
  PersonCredit,
} from "@/lib/tmdb";
import {
  getStaffDetails,
  searchStaffByName,
  cleanAniListDescription,
  AniListStaff,
} from "@/lib/anilist";

function formatFuzzyDate(
  date?: { year: number | null; month: number | null; day: number | null } | null
): string {
  if (!date?.year) return "";
  const m = String(date.month || 1).padStart(2, "0");
  const d = String(date.day || 1).padStart(2, "0");
  return `${date.year}-${m}-${d}`;
}

function mapAniListStaffToCredits(staff: AniListStaff): {
  cast: PersonCredit[];
  crew: PersonCredit[];
} {
  const castMap = new Map<number, PersonCredit>();
  const crewMap = new Map<number, PersonCredit>();

  const characterEdges = staff.characterMedia?.edges || [];
  for (const edge of characterEdges) {
    const node = edge.node;
    if (!node) continue;
    const charNames = (edge.characters || [])
      .map((c) => c.name.full)
      .filter(Boolean)
      .join(", ");

    if (castMap.has(node.id)) {
      const existing = castMap.get(node.id)!;
      if (charNames && existing.character && !existing.character.includes(charNames)) {
        existing.character += `, ${charNames}`;
      }
      continue;
    }

    const releaseDate = formatFuzzyDate(node.startDate);
    const voteAvg = node.averageScore
      ? Number((node.averageScore / 10).toFixed(1))
      : 0;
    const pop = node.popularity || 0;
    const poster = node.coverImage?.large || node.coverImage?.medium || null;
    const backdrop = node.bannerImage || null;
    const title =
      node.title.romaji || node.title.english || node.title.native || "Untitled";

    castMap.set(node.id, {
      id: node.id,
      title,
      character: charNames || "Voice Actor",
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

  const staffEdges = staff.staffMedia?.edges || [];
  for (const edge of staffEdges) {
    const node = edge.node;
    if (!node) continue;
    if (crewMap.has(node.id)) continue;
    const releaseDate = formatFuzzyDate(node.startDate);
    const voteAvg = node.averageScore
      ? Number((node.averageScore / 10).toFixed(1))
      : 0;
    const pop = node.popularity || 0;
    const poster = node.coverImage?.large || node.coverImage?.medium || null;
    const backdrop = node.bannerImage || null;
    const title =
      node.title.romaji || node.title.english || node.title.native || "Untitled";

    crewMap.set(node.id, {
      id: node.id,
      title,
      job: edge.staffRole || "Staff",
      department: "Anime Production",
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

  return {
    cast: Array.from(castMap.values()),
    crew: Array.from(crewMap.values()),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Person ID is required" }, { status: 400 });
    }

    const isAniList = id.startsWith("al-") || id.startsWith("anilist-");

    if (isAniList) {
      const staffId = parseInt(id.replace(/^(al|anilist)-/, ""), 10);
      if (isNaN(staffId)) {
        return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
      }

      const staff = await getStaffDetails(staffId);
      if (!staff) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      const { cast: animeCast, crew: animeCrew } = mapAniListStaffToCredits(staff);

      let tmdbDetails: PersonDetails | null = null;
      try {
        const tmdbSearch = await searchPerson(staff.name.full);
        const match =
          tmdbSearch.results?.find(
            (r: any) => r.known_for_department === "Acting"
          ) || tmdbSearch.results?.[0];
        if (match?.id) {
          tmdbDetails = await getPersonDetails(match.id);
        }
      } catch {}

      const cleanBio = cleanAniListDescription(staff.description);
      const profilePath =
        staff.image?.large ||
        staff.image?.medium ||
        tmdbDetails?.profile_path ||
        null;

      const alsoKnownAs = [
        staff.name.native,
        ...(staff.name.alternative || []),
        ...(tmdbDetails?.also_known_as || []),
      ].filter((s): s is string => Boolean(s));

      const mergedCast = [
        ...animeCast,
        ...(tmdbDetails?.combined_credits?.cast || []),
      ];
      const mergedCrew = [
        ...animeCrew,
        ...(tmdbDetails?.combined_credits?.crew || []),
      ];

      const responseData: PersonDetails = {
        id,
        name: staff.name.full,
        biography: cleanBio || tmdbDetails?.biography || "",
        birthday:
          formatFuzzyDate(staff.dateOfBirth) || tmdbDetails?.birthday || null,
        deathday: tmdbDetails?.deathday || null,
        gender:
          staff.gender === "Female"
            ? 1
            : staff.gender === "Male"
            ? 2
            : tmdbDetails?.gender || 0,
        known_for_department: tmdbDetails?.known_for_department || "Acting",
        place_of_birth: tmdbDetails?.place_of_birth || null,
        popularity: Math.max(100, tmdbDetails?.popularity || 0),
        profile_path: profilePath,
        also_known_as: Array.from(new Set(alsoKnownAs)),
        external_ids: tmdbDetails?.external_ids,
        combined_credits: {
          cast: mergedCast,
          crew: mergedCrew,
        },
      };

      return NextResponse.json(responseData);
    }

    let tmdbDetails: PersonDetails | null = null;
    try {
      tmdbDetails = await getPersonDetails(id);
    } catch {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const staff = await getStaffDetails(numId);
        if (staff) {
          const { cast: animeCast, crew: animeCrew } = mapAniListStaffToCredits(staff);
          let matchDetails: PersonDetails | null = null;
          try {
            const tmdbSearch = await searchPerson(staff.name.full);
            const match =
              tmdbSearch.results?.find(
                (r: any) => r.known_for_department === "Acting"
              ) || tmdbSearch.results?.[0];
            if (match?.id) {
              matchDetails = await getPersonDetails(match.id);
            }
          } catch {}

          const cleanBio = cleanAniListDescription(staff.description);
          const profilePath =
            staff.image?.large ||
            staff.image?.medium ||
            matchDetails?.profile_path ||
            null;

          const alsoKnownAs = [
            staff.name.native,
            ...(staff.name.alternative || []),
            ...(matchDetails?.also_known_as || []),
          ].filter((s): s is string => Boolean(s));

          const responseData: PersonDetails = {
            id,
            name: staff.name.full,
            biography: cleanBio || matchDetails?.biography || "",
            birthday:
              formatFuzzyDate(staff.dateOfBirth) || matchDetails?.birthday || null,
            deathday: matchDetails?.deathday || null,
            gender:
              staff.gender === "Female"
                ? 1
                : staff.gender === "Male"
                ? 2
                : matchDetails?.gender || 0,
            known_for_department: matchDetails?.known_for_department || "Acting",
            place_of_birth: matchDetails?.place_of_birth || null,
            popularity: Math.max(100, matchDetails?.popularity || 0),
            profile_path: profilePath,
            also_known_as: Array.from(new Set(alsoKnownAs)),
            external_ids: matchDetails?.external_ids,
            combined_credits: {
              cast: [
                ...animeCast,
                ...(matchDetails?.combined_credits?.cast || []),
              ],
              crew: [
                ...animeCrew,
                ...(matchDetails?.combined_credits?.crew || []),
              ],
            },
          };

          return NextResponse.json(responseData);
        }
      }
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    let staff: AniListStaff | null = null;
    try {
      staff = await searchStaffByName(tmdbDetails.name);
      if (!staff && tmdbDetails.also_known_as?.length) {
        for (const alt of tmdbDetails.also_known_as) {
          staff = await searchStaffByName(alt);
          if (staff) break;
        }
      }
    } catch {}

    if (staff) {
      const { cast: animeCast, crew: animeCrew } = mapAniListStaffToCredits(staff);
      const currentCast = tmdbDetails.combined_credits?.cast || [];
      const currentCrew = tmdbDetails.combined_credits?.crew || [];

      if (!tmdbDetails.biography && staff.description) {
        tmdbDetails.biography = cleanAniListDescription(staff.description);
      }
      if (
        !tmdbDetails.profile_path &&
        (staff.image?.large || staff.image?.medium)
      ) {
        tmdbDetails.profile_path = staff.image?.large || staff.image?.medium;
      }
      if (
        staff.name.native &&
        !tmdbDetails.also_known_as?.includes(staff.name.native)
      ) {
        tmdbDetails.also_known_as = [
          ...(tmdbDetails.also_known_as || []),
          staff.name.native,
        ];
      }

      tmdbDetails.combined_credits = {
        cast: [...animeCast, ...currentCast],
        crew: [...animeCrew, ...currentCrew],
      };
    }

    return NextResponse.json(tmdbDetails);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch person details" },
      { status: 500 }
    );
  }
}
