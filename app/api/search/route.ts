import { NextResponse } from "next/server";
import { getCompanyTopWorks } from "@/lib/providers/tmdb/companies";
import { getBestMoviePoster } from "@/lib/providers/tmdb/movies";
import { searchMovies, searchTv, searchMulti, searchPerson, searchCompany } from "@/lib/providers/tmdb/search";
import { searchAnime } from "@/lib/providers/anilist/media";
import { searchGames } from "@/lib/providers/igdb/games";
import { fetchCachedMediaMap } from "@/lib/lists/media-map";
import { createAnonClient } from "@/lib/supabase/server";
import {
  escapeLike,
  mapUser,
  mapList,
  mapCompany,
  mapTmdbItem,
  mapPerson,
  mapAnime,
  mapGame,
  collectListPreviewRefs,
  type SearchUserRow,
  type SearchListRow,
  type SearchCompanyRow,
} from "@/app/api/search/mappers";
import { sortByScore } from "@/app/api/search/ranking";

const ALL_TMDB_PAGES = 3;
const ALL_POOL_PER_SOURCE = 20;

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

function sortItems(items: any[], sortBy: string, query: string): any[] {
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
  return sortByScore(items, query);
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

    const likePattern = `%${escapeLike(query.trim())}%`;

    if (moduleType === "users") {
      const supabase = createAnonClient();
      const fromIndex = (uiPage - 1) * 10;
      const toIndex = fromIndex + 9;

      let usersQuery = supabase
        .from("users")
        .select("id, username, avatar_url, bio", { count: "exact" })
        .ilike("username", likePattern);

      if (sortBy === "oldest") {
        usersQuery = usersQuery.order("username", { ascending: false });
      } else {
        usersQuery = usersQuery.order("username", { ascending: true });
      }

      const { data: users, count } = await usersQuery.range(fromIndex, toIndex);

      return NextResponse.json({
        page: uiPage,
        results: ((users || []) as SearchUserRow[]).map((u) => mapUser(u)),
        total_pages: Math.ceil((count || 0) / 10),
        total_results: count || 0,
      });
    }

    if (moduleType === "lists") {
      const supabase = createAnonClient();
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
        .ilike("title", likePattern);

      if (sortBy === "newest") {
        listsQuery = listsQuery.order("updated_at", { ascending: false });
      } else if (sortBy === "oldest") {
        listsQuery = listsQuery.order("created_at", { ascending: true });
      } else {
        listsQuery = listsQuery.order("updated_at", { ascending: false });
      }

      const { data: lists, count } = await listsQuery.range(fromIndex, toIndex);

      const listRows = (lists || []) as unknown as SearchListRow[];
      const mediaMap = await fetchCachedMediaMap(supabase as any, collectListPreviewRefs(listRows));
      const mappedLists = listRows.map((l) => mapList(l, mediaMap));

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
    let pageOffset = ((uiPage - 1) % 2) * 10;

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
      rawResults = sortItems(rawResults, sortBy, query);
      totalResults = data.total_results || 0;
    } else if (moduleType === "movies") {
      const data = await searchMovies(query, tmdbPage);
      rawResults = (data.results || []).map((m) => ({
        ...m,
        moduleType: "movies",
        media_type: "movie",
        href: `/movie/${m.id}`,
      }));
      rawResults = sortItems(rawResults, sortBy, query);
      totalResults = data.total_results || 0;
    } else if (moduleType === "people") {
      const data = await searchPerson(query, tmdbPage);
      rawResults = (data.results || []).map((p: any) => mapPerson(p));
      rawResults = sortItems(rawResults, sortBy, query);
      totalResults = data.total_results || 0;
    } else if (moduleType === "companies") {
      const data = await searchCompany(query, tmdbPage);
      rawResults = (data.results || []).map((c: any) => mapCompany(c, 1));
      totalResults = data.total_results || 0;
    } else if (moduleType === "anime") {
      const animeData = await searchAnime(query, uiPage, 10, sortBy);
      const results = sortItems((animeData.results || []).map(mapAnime), sortBy, query);

      return NextResponse.json({
        page: uiPage,
        results,
        total_pages: Math.min(Math.ceil((animeData.pageInfo?.total || 0) / 10), 1000),
        total_results: animeData.pageInfo?.total || 0,
      });
    } else if (moduleType === "games") {
      const gamesData = await searchGames(query, uiPage, 10, sortBy);
      const results = sortItems((gamesData.results || []).map(mapGame), sortBy, query);

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
      const supabase = createAnonClient();

      const [multiPages, usersRes, listsRes, companyData, animeData, gamesData] = await Promise.all([
        Promise.all(Array.from({ length: ALL_TMDB_PAGES }, (_, i) => searchMulti(query, i + 1))),
        supabase
            .from("users")
            .select("id, username, avatar_url, bio")
            .ilike("username", likePattern)
            .limit(3),
        supabase
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
            .ilike("title", likePattern)
            .limit(3),
        searchCompany(query, 1),
        searchAnime(query, 1, ALL_POOL_PER_SOURCE, sortBy),
        searchGames(query, 1, ALL_POOL_PER_SOURCE, sortBy),
      ]);

      const userItems = ((usersRes.data || []) as SearchUserRow[]).map((u) =>
        mapUser(u)
      );

      const listRows = (listsRes.data || []) as unknown as SearchListRow[];
      const listMediaMap = await fetchCachedMediaMap(
        supabase as any,
        collectListPreviewRefs(listRows)
      );
      const listItems = listRows.map((l) =>
        mapList(l, listMediaMap)
      );

      const companyItems = ((companyData.results || []) as SearchCompanyRow[])
        .slice(0, 2)
        .map((c) => mapCompany(c, 0));

      const seenTmdb = new Set<string>();
      const tmdbItems = multiPages
        .flatMap((page) => page.results || [])
        .filter((item) => {
          const key = `${item.media_type}-${item.id}`;
          if (seenTmdb.has(key)) return false;
          seenTmdb.add(key);
          return true;
        })
        .map(mapTmdbItem);
      const animeItems = (animeData.results || []).map(mapAnime);
      const gameItems = (gamesData.results || []).map(mapGame);

      const allCandidates = [
        ...userItems,
        ...listItems,
        ...companyItems,
        ...animeItems,
        ...gameItems,
        ...tmdbItems,
      ];

      rawResults = sortItems(allCandidates, sortBy, query);
      totalResults = allCandidates.length;
      pageOffset = (uiPage - 1) * 10;
    }

    const sliced = rawResults.slice(pageOffset, pageOffset + 10);

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
