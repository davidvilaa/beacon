import { NextResponse } from "next/server";
import {
  searchMovies,
  searchTv,
  searchMulti,
  searchPerson,
  searchCompany,
  getBestMoviePoster,
} from "@/lib/tmdb";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const moduleType = searchParams.get("filter") || searchParams.get("module") || "";
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
      const { data: users, count } = await supabase
        .from("users")
        .select("id, username, avatar_url, bio", { count: "exact" })
        .ilike("username", `%${query.trim()}%`)
        .range(fromIndex, toIndex);

      return NextResponse.json({
        page: uiPage,
        results: (users || []).map((u: any) => ({
          id: u.id,
          title: u.username,
          overview: u.bio || "Beacon user",
          poster_path: u.avatar_url,
          media_type: "user",
          moduleType: "users",
          username: u.username,
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
      const { data: lists, count } = await supabase
        .from("lists")
        .select(`
          id,
          title,
          description,
          is_private,
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
            custom_poster_path
          )
        `, { count: "exact" })
        .eq("is_private", false)
        .ilike("title", `%${query.trim()}%`)
        .order("updated_at", { ascending: false })
        .range(fromIndex, toIndex);

      const mappedLists = (lists || []).map((l: any) => {
        const rawOwner = Array.isArray(l.users) ? l.users[0] : l.users;
        const firstItem = (l.list_items || [])[0];
        return {
          id: l.id,
          title: l.title,
          overview: l.description || (rawOwner?.username ? `List by ${rawOwner.username}` : "User list"),
          poster_path: firstItem?.custom_poster_path || null,
          media_type: "list",
          moduleType: "lists",
          itemCount: (l.list_items || []).length,
          author: rawOwner?.username || null,
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
      totalResults = data.total_results || 0;
    } else if (moduleType === "movies") {
      const data = await searchMovies(query, tmdbPage);
      rawResults = (data.results || []).map((m) => ({
        ...m,
        moduleType: "movies",
        media_type: "movie",
        href: `/movie/${m.id}`,
      }));
      totalResults = data.total_results || 0;
    } else if (moduleType === "people") {
      const data = await searchPerson(query, tmdbPage);
      rawResults = (data.results || []).map((p: any) => ({
        id: p.id,
        title: p.name,
        original_title: p.original_name,
        overview: p.known_for_department
          ? `Known for ${p.known_for_department}${
              Array.isArray(p.known_for) && p.known_for.length > 0
                ? ` • ${p.known_for
                    .map((k: any) => k.title || k.name)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(", ")}`
                : ""
            }`
          : "",
        poster_path: p.profile_path,
        media_type: "person",
        moduleType: "people",
        href: `/person/${p.id}`,
      }));
      totalResults = data.total_results || 0;
    } else if (moduleType === "companies") {
      const data = await searchCompany(query, tmdbPage);
      rawResults = (data.results || []).map((c: any) => ({
        id: c.id,
        title: c.name,
        overview: c.origin_country ? `Country: ${c.origin_country}` : "",
        poster_path: c.logo_path,
        media_type: "company",
        moduleType: "companies",
        href: `/company/${c.id}`,
      }));
      totalResults = data.total_results || 0;
    } else if (
      moduleType &&
      moduleType !== "movies" &&
      moduleType !== "series" &&
      moduleType !== "people" &&
      moduleType !== "companies" &&
      moduleType !== "users" &&
      moduleType !== "lists"
    ) {
      rawResults = [];
      totalResults = 0;
    } else {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const [multiData, usersRes, listsRes, companyData] = await Promise.all([
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
                list_items (
                  custom_poster_path
                )
              `)
              .eq("is_private", false)
              .ilike("title", `%${query.trim()}%`)
              .limit(3)
          : Promise.resolve({ data: [] }),
        uiPage === 1
          ? searchCompany(query, 1)
          : Promise.resolve({ results: [], total_results: 0 }),
      ]);

      const prependItems: any[] = [];

      (usersRes.data || []).forEach((u: any) => {
        prependItems.push({
          id: u.id,
          title: u.username,
          overview: u.bio || "Beacon user",
          poster_path: u.avatar_url,
          media_type: "user",
          moduleType: "users",
          username: u.username,
          href: `/profile/${encodeURIComponent(u.username)}`,
        });
      });

      (listsRes.data || []).forEach((l: any) => {
        const firstItem = (l.list_items || [])[0];
        prependItems.push({
          id: l.id,
          title: l.title,
          overview: l.description || "User list",
          poster_path: firstItem?.custom_poster_path || null,
          media_type: "list",
          moduleType: "lists",
          href: `/lists/${l.id}`,
        });
      });

      (companyData.results || []).slice(0, 2).forEach((c: any) => {
        prependItems.push({
          id: c.id,
          title: c.name,
          overview: c.origin_country ? `Country: ${c.origin_country}` : "",
          poster_path: c.logo_path,
          media_type: "company",
          moduleType: "companies",
          href: `/company/${c.id}`,
        });
      });

      const tmdbItems = (multiData.results || []).map((item) => {
        const isPerson = item.media_type === "person";
        const isTv = item.media_type === "tv";
        return {
          id: item.id,
          title: item.title || item.name || "",
          original_title: item.original_title || item.original_name,
          overview: isPerson
            ? item.known_for_department
              ? `Known for ${item.known_for_department}`
              : ""
            : item.overview,
          poster_path: isPerson ? item.profile_path : item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          popularity: item.popularity,
          genre_ids: item.genre_ids,
          moduleType: isPerson ? "people" : isTv ? "series" : "movies",
          media_type: item.media_type,
          href: isPerson
            ? `/person/${item.id}`
            : isTv
            ? `/tv/${item.id}`
            : `/movie/${item.id}`,
        };
      });

      rawResults = [...prependItems, ...tmdbItems];
      totalResults = (multiData.total_results || 0) + prependItems.length;
    }

    const startIndex = ((uiPage - 1) % 2) * 10;
    const sliced = rawResults.slice(startIndex, startIndex + 10);

    const results = await Promise.all(
      sliced.map(async (item) => {
        let poster = item.poster_path;
        if (item.media_type === "movie" && item.id) {
          const best = await getBestMoviePoster(item.id);
          if (best) {
            poster = best;
          }
        }
        return {
          ...item,
          poster_path: poster,
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
