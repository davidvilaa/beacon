import { NextResponse } from "next/server";
import { searchMovies, searchTv, searchMulti, getBestMoviePoster } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const moduleType = searchParams.get("module") || "";
    const uiPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

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
      }));
      totalResults = data.total_results || 0;
    } else if (moduleType === "movies") {
      const data = await searchMovies(query, tmdbPage);
      rawResults = (data.results || []).map((m) => ({
        ...m,
        moduleType: "movies",
        media_type: "movie",
      }));
      totalResults = data.total_results || 0;
    } else if (moduleType && moduleType !== "movies" && moduleType !== "series") {
      rawResults = [];
      totalResults = 0;
    } else {
      const data = await searchMulti(query, tmdbPage);
      rawResults = (data.results || []).map((item) => ({
        id: item.id,
        title: item.title || item.name || "",
        original_title: item.original_title || item.original_name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
        vote_count: item.vote_count,
        popularity: item.popularity,
        genre_ids: item.genre_ids,
        moduleType: item.media_type === "tv" ? "series" : "movies",
        media_type: item.media_type,
      }));
      totalResults = data.total_results || 0;
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
