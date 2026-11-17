import { NextResponse } from "next/server";
import {
  searchMovies,
  searchTv,
  searchMulti,
  searchPerson,
  searchCompany,
  getBestMoviePoster,
  getCompanyTopWorks,
} from "@/lib/tmdb";
import {
  searchAnime,
  getAnimeTitle,
  getAnimePosterUrl,
  getAnimeBackdropUrl,
  stripHtml,
} from "@/lib/anilist";
import { searchGames, getIgdbImageUrl } from "@/lib/igdb";
import { fetchCachedMediaMap, RawListItemRef } from "@/lib/lists";
import { createClient } from "@supabase/supabase-js";

function normalizeModule(val: string): string {
  const v = val.toLowerCase().trim();
  if (v === "user" || v === "users") return "users";
  if (v === "list" || v === "lists") return "lists";
  if (v === "person" || v === "people") return "people";
  if (v === "company" || v === "companies") return "companies";
  if (v === "movie" || v === "movies") return "movies";
  if (v === "tv" || v === "series") return "series";
  if (v === "anime") return "anime";
  if (v === "game" || v === "games") return "games";
  return "";
}

function getItemDate(item: any): string {
  return (
    item.release_date ||
    item.first_air_date ||
    item.updated_at ||
    item.created_at ||
    ""
  );
}

function sortItems(items: any[], sortBy: string): any[] {
  if (sortBy === "newest") {
    return [...items].sort((a, b) => {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);
      if (!dateA && !dateB) return (b.popularity ?? 0) - (a.popularity ?? 0);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.localeCompare(dateA);
    });
  }
  if (sortBy === "oldest") {
    return [...items].sort((a, b) => {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);
      if (!dateA && !dateB) return (a.popularity ?? 0) - (b.popularity ?? 0);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });
  }
  return [...items].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const moduleType = normalizeModule(
      searchParams.get("filter") || searchParams.get("module") || ""
    );
    const sortBy = (
      searchParams.get("sort_by") ||
      searchParams.get("sort") ||
      "popularity"
    )
      .toLowerCase()
      .trim();
    const uiPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    if (!query.trim()) {
      return NextResponse.json({
        page: uiPage,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
    }

    if (moduleType === "users") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const fromIndex = (uiPage - 1) * 10;
      const toIndex = fromIndex + 9;

      let usersQuery = supabase
        .from("users")
        .select("id, username, avatar_url, bio", { count: "exact" })
        .ilike("username", `%${query.trim()}%`);

      if (sortBy === "oldest") {
        usersQuery = usersQuery.order("username", { ascending: false });
      } else {
        usersQuery = usersQuery.order("username", { ascending: true });
      }

      const { data: users, count } = await usersQuery.range(fromIndex, toIndex);

      return NextResponse.json({
        page: uiPage,
        results: (users || []).map((u: any) => ({
          id: u.id,
          title: u.username,
          username: u.username,
          overview: u.bio || "",
          poster_path: u.avatar_url,
          media_type: "user",
          moduleType: "user",
          href: `/profile/${encodeURIComponent(u.username)}`,
        })),
        total_pages: Math.ceil((count || 0) / 10),
        total_results: count || 0,
      });
    }

    if (moduleType === "lists") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const fromIndex = (uiPage - 1) * 10;
      const toIndex = fromIndex + 9;

      let listsQuery = supabase
        .from("lists")
        .select(
          `
          id,
          title,
          description,
          is_private,
          is_numbered,
          created_at,
          updated_at,
          users (
            id,
            username,
            avatar_url
          ),
          list_items (
            id,
            media_type,
            media_id,
            custom_poster_path,
            position,
            created_at
          )
        `,
          { count: "exact" }
        )
        .eq("is_private", false)
        .ilike("title", `%${query.trim()}%`);

      if (sortBy === "newest") {
        listsQuery = listsQuery.order("updated_at", { ascending: false });
      } else if (sortBy === "oldest") {
        listsQuery = listsQuery.order("created_at", { ascending: true });
      } else {
        listsQuery = listsQuery.order("updated_at", { ascending: false });
      }

      const { data: lists, count } = await listsQuery.range(fromIndex, toIndex);

      const previewRefs: RawListItemRef[] = [];
      const sortedItemsByList = new Map<string, any[]>();

      for (const list of lists || []) {
        const sorted = [...(list.list_items || [])].sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        sortedItemsByList.set(list.id, sorted);
        for (const item of sorted.slice(0, 5)) {
          previewRefs.push({
            media_type: item.media_type,
            media_id: item.media_id,
          });
        }
      }

      const mediaMap = await fetchCachedMediaMap(supabase as any, previewRefs);

      const mappedLists = (lists || []).map((l: any) => {
        const rawOwner = Array.isArray(l.users) ? l.users[0] : l.users;
        const sorted = sortedItemsByList.get(l.id) || [];
        const previewPosters = sorted.slice(0, 5).map((item) => {
          const cached = mediaMap.get(`${item.media_type}-${item.media_id}`);
          return item.custom_poster_path || cached?.posterPath || null;
        });

        return {
          id: l.id,
          title: l.title,
          author: rawOwner?.username || null,
          description: l.description || "",
          overview: l.description || "",
          isPrivate: l.is_private,
          isNumbered: Boolean(l.is_numbered),
          itemCount: (l.list_items || []).length,
          updatedAt: l.updated_at,
          previewPosters,
          media_type: "list",
          moduleType: "list",
          href: `/lists/${l.id}`,
        };
      });

      return NextResponse.json({
        page: uiPage,
        results: mappedLists,
        total_pages: Math.ceil((count || 0) / 10),
        total_results: count || 0,
      });
    }

    const tmdbPage = Math.floor((uiPage - 1) / 2) + 1;
    let rawResults: any[] = [];
    let totalResults = 0;

    if (moduleType === "series") {
      const data = await searchTv(query, tmdbPage);
      rawResults = (data.results || []).map((t) => ({
        id: t.id,
        title: t.name,
        original_title: t.original_name,
        overview: t.overview,
        poster_path: t.poster_path,
        backdrop_path: t.backdrop_path,
        release_date: t.first_air_date,
        vote_average: t.vote_average,
        vote_count: t.vote_count,
        popularity: t.popularity,
        genre_ids: t.genre_ids,
        moduleType: "series",
        media_type: "tv",
        href: `/tv/${t.id}`,
      }));
      rawResults = sortItems(rawResults, sortBy);
      totalResults = data.total_results || 0;
    } else if (moduleType === "movies") {
      const data = await searchMovies(query, tmdbPage);
      rawResults = (data.results || []).map((m) => ({
        ...m,
        moduleType: "movies",
        media_type: "movie",
        href: `/movie/${m.id}`,
      }));
      rawResults = sortItems(rawResults, sortBy);
      totalResults = data.total_results || 0;
    } else if (moduleType === "people") {
      const data = await searchPerson(query, tmdbPage);
      rawResults = (data.results || []).map((p: any) => {
        const famous = (p.known_for || [])
          .map((k: any) => k.title || k.name)
          .filter(Boolean)
          .slice(0, 4)
          .join(" • ");
        return {
          id: p.id,
          title: p.name,
          original_title: p.original_name,
          famous_works: famous,
          overview:
            famous ||
            (p.known_for_department ? `Known for ${p.known_for_department}` : ""),
          poster_path: p.profile_path,
          media_type: "person",
          moduleType: "person",
          popularity: p.popularity || 0,
          href: `/person/${p.id}`,
        };
      });
      rawResults = sortItems(rawResults, sortBy);
      totalResults = data.total_results || 0;
    } else if (moduleType === "companies") {
      const data = await searchCompany(query, tmdbPage);
      rawResults = (data.results || []).map((c: any) => ({
        id: c.id,
        title: c.name,
        overview: c.origin_country ? `Country: ${c.origin_country}` : "",
        poster_path: c.logo_path,
        media_type: "company",
        moduleType: "company",
        popularity: 1,
        href: `/company/${c.id}`,
      }));
      totalResults = data.total_results || 0;
    } else if (moduleType === "anime") {
      const animeData = await searchAnime(query, uiPage, 10, sortBy);
      const results = (animeData.results || []).map((a) => {
        const title = getAnimeTitle(a.title);
        const posterUrl = getAnimePosterUrl(a);
        const backdropUrl = getAnimeBackdropUrl(a);
        const releaseDate = a.startDate?.year
          ? `${a.startDate.year}-${String(a.startDate.month || 1).padStart(2, "0")}-${String(a.startDate.day || 1).padStart(2, "0")}`
          : "";
        return {
          id: a.id,
          title,
          original_title: a.title.romaji || a.title.native || title,
          overview: stripHtml(a.description),
          poster_path: posterUrl,
          backdrop_path: backdropUrl,
          release_date: releaseDate,
          vote_average: a.averageScore ? a.averageScore / 10 : 0,
          vote_count: a.popularity || 0,
          popularity: a.popularity || 0,
          genre_ids: [],
          moduleType: "anime",
          media_type: "anime",
          href: `/anime/${a.id}`,
        };
      });

      return NextResponse.json({
        page: uiPage,
        results,
        total_pages: Math.min(Math.ceil((animeData.pageInfo?.total || 0) / 10), 1000),
        total_results: animeData.pageInfo?.total || 0,
      });
    } else if (moduleType === "games") {
      const gamesData = await searchGames(query, uiPage, 10, sortBy);
      const results = (gamesData.results || []).map((g) => {
        const releaseDate = g.first_release_date
          ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
          : "";
        const coverUrl = getIgdbImageUrl(g.cover?.image_id, "cover_big");
        return {
          id: g.id,
          title: g.name,
          original_title: g.name,
          overview: g.summary || "",
          poster_path: coverUrl,
          backdrop_path: null,
          release_date: releaseDate,
          vote_average: g.rating ? g.rating / 10 : 0,
          vote_count: 0,
          popularity: g.total_rating || g.rating || 0,
          genre_ids: [],
          moduleType: "games",
          media_type: "game",
          href: `/game/${g.id}`,
        };
      });

      return NextResponse.json({
        page: uiPage,
        results,
        total_pages: Math.min(Math.ceil((gamesData.total || 0) / 10), 1000),
        total_results: gamesData.total || 0,
      });
    } else if (
      moduleType &&
      moduleType !== "movies" &&
      moduleType !== "series" &&
      moduleType !== "people" &&
      moduleType !== "companies" &&
      moduleType !== "users" &&
      moduleType !== "lists" &&
      moduleType !== "games"
    ) {
      rawResults = [];
      totalResults = 0;
    } else {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const [multiData, usersRes, listsRes, companyData, animeData, gamesData] = await Promise.all([
        searchMulti(query, tmdbPage),
        uiPage === 1
          ? supabase
              .from("users")
              .select("id, username, avatar_url, bio")
              .ilike("username", `%${query.trim()}%`)
              .limit(3)
          : Promise.resolve({ data: [] }),
        uiPage === 1
          ? supabase
              .from("lists")
              .select(`
                id,
                title,
                description,
                is_private,
                is_numbered,
                created_at,
                updated_at,
                users (
                  id,
                  username
                ),
                list_items (
                  id,
                  media_type,
                  media_id,
                  custom_poster_path,
                  position,
                  created_at
                )
              `)
              .eq("is_private", false)
              .ilike("title", `%${query.trim()}%`)
              .limit(3)
          : Promise.resolve({ data: [] }),
        uiPage === 1
          ? searchCompany(query, 1)
          : Promise.resolve({ results: [], total_results: 0 }),
        uiPage === 1
          ? searchAnime(query, 1, 3, sortBy)
          : Promise.resolve({ results: [] as any[], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 3 } }),
        uiPage === 1
          ? searchGames(query, 1, 3, sortBy)
          : Promise.resolve({ results: [], total: 0, page: 1, limit: 3 }),
      ]);

      const lowerQuery = query.trim().toLowerCase();

      const userItems = (usersRes.data || []).map((u: any) => {
        const isExact = u.username.toLowerCase() === lowerQuery;
        return {
          id: u.id,
          title: u.username,
          username: u.username,
          overview: u.bio || "",
          poster_path: u.avatar_url,
          media_type: "user",
          moduleType: "user",
          popularity: isExact ? 100 : 1,
          href: `/profile/${encodeURIComponent(u.username)}`,
        };
      });

      const listPreviewRefs: RawListItemRef[] = [];
      const listItemsMap = new Map<string, any[]>();
      for (const list of listsRes.data || []) {
        const sorted = [...(list.list_items || [])].sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        listItemsMap.set(list.id, sorted);
        for (const item of sorted.slice(0, 5)) {
          listPreviewRefs.push({
            media_type: item.media_type,
            media_id: item.media_id,
          });
        }
      }

      const listMediaMap = await fetchCachedMediaMap(
        supabase as any,
        listPreviewRefs
      );

      const listItems = (listsRes.data || []).map((l: any) => {
        const rawOwner = Array.isArray(l.users) ? l.users[0] : l.users;
        const sorted = listItemsMap.get(l.id) || [];
        const previewPosters = sorted.slice(0, 5).map((item) => {
          const cached = listMediaMap.get(`${item.media_type}-${item.media_id}`);
          return item.custom_poster_path || cached?.posterPath || null;
        });
        const isExact = l.title.toLowerCase() === lowerQuery;
        return {
          id: l.id,
          title: l.title,
          author: rawOwner?.username || null,
          description: l.description || "",
          overview: l.description || "",
          isPrivate: l.is_private,
          isNumbered: Boolean(l.is_numbered),
          itemCount: (l.list_items || []).length,
          updatedAt: l.updated_at,
          created_at: l.created_at,
          previewPosters,
          media_type: "list",
          moduleType: "list",
          popularity: isExact ? 50 : 1,
          href: `/lists/${l.id}`,
        };
      });

      const companyItems = (companyData.results || []).slice(0, 2).map((c: any) => {
        const isExact = c.name.toLowerCase() === lowerQuery;
        return {
          id: c.id,
          title: c.name,
          overview: c.origin_country ? `Country: ${c.origin_country}` : "",
          poster_path: c.logo_path,
          media_type: "company",
          moduleType: "company",
          popularity: isExact ? 100 : 0.5,
          href: `/company/${c.id}`,
        };
      });

      const tmdbItems = (multiData.results || []).map((item) => {
        const isPerson = item.media_type === "person";
        const isTv = item.media_type === "tv";
        const famous = isPerson
          ? (item.known_for || [])
              .map((k: any) => k.title || k.name)
              .filter(Boolean)
              .slice(0, 4)
              .join(" • ")
          : "";

        return {
          id: item.id,
          title: item.title || item.name || "",
          original_title: item.original_title || item.original_name,
          famous_works: famous,
          overview: isPerson
            ? famous ||
              (item.known_for_department
                ? `Known for ${item.known_for_department}`
                : "")
            : item.overview,
          poster_path: isPerson ? item.profile_path : item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          popularity: item.popularity || 0,
          genre_ids: item.genre_ids,
          moduleType: isPerson ? "person" : isTv ? "series" : "movies",
          media_type: item.media_type,
          href: isPerson
            ? `/person/${item.id}`
            : isTv
            ? `/tv/${item.id}`
            : `/movie/${item.id}`,
        };
      });

      const animeItems = (animeData.results || []).map((a: any) => {
        const title = getAnimeTitle(a.title);
        const posterUrl = getAnimePosterUrl(a);
        const backdropUrl = getAnimeBackdropUrl(a);
        const releaseDate = a.startDate?.year
          ? `${a.startDate.year}-${String(a.startDate.month || 1).padStart(2, "0")}-${String(a.startDate.day || 1).padStart(2, "0")}`
          : "";
        return {
          id: a.id,
          title,
          original_title: a.title.romaji || a.title.native || title,
          overview: stripHtml(a.description),
          poster_path: posterUrl,
          backdrop_path: backdropUrl,
          release_date: releaseDate,
          vote_average: a.averageScore ? a.averageScore / 10 : 0,
          vote_count: a.popularity || 0,
          popularity: a.popularity || 0,
          genre_ids: [],
          moduleType: "anime",
          media_type: "anime",
          href: `/anime/${a.id}`,
        };
      });

      const gameItems = (gamesData.results || []).map((g: any) => {
        const releaseDate = g.first_release_date
          ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
          : "";
        const coverUrl = getIgdbImageUrl(g.cover?.image_id, "cover_big");
        return {
          id: g.id,
          title: g.name,
          original_title: g.name,
          overview: g.summary || "",
          poster_path: coverUrl,
          backdrop_path: null,
          release_date: releaseDate,
          vote_average: g.rating ? g.rating / 10 : 0,
          vote_count: 0,
          popularity: g.total_rating || g.rating || 0,
          genre_ids: [],
          moduleType: "games",
          media_type: "game",
          href: `/game/${g.id}`,
        };
      });

      const allCandidates = [
        ...userItems,
        ...listItems,
        ...companyItems,
        ...animeItems,
        ...gameItems,
        ...tmdbItems,
      ];

      rawResults = sortItems(allCandidates, sortBy);
      totalResults = (multiData.total_results || 0) + userItems.length + listItems.length + companyItems.length + animeItems.length + gameItems.length;
    }

    const startIndex = ((uiPage - 1) % 2) * 10;
    const sliced = rawResults.slice(startIndex, startIndex + 10);

    const results = await Promise.all(
      sliced.map(async (item) => {
        let poster = item.poster_path;
        let famousWorks = item.famous_works;

        if (item.media_type === "movie" && item.id) {
          const best = await getBestMoviePoster(item.id);
          if (best) {
            poster = best;
          }
        }

        if (item.media_type === "company" && item.id && !famousWorks) {
          const works = await getCompanyTopWorks(item.id);
          famousWorks = works.join(" • ");
        }

        return {
          ...item,
          poster_path: poster,
          famous_works: famousWorks || null,
        };
      })
    );

    const totalPages = Math.min(Math.ceil(totalResults / 10), 1000);

    return NextResponse.json({
      page: uiPage,
      results,
      total_pages: totalPages,
      total_results: totalResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to search" },
      { status: 500 }
    );
  }
}
