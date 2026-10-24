import { NextResponse } from "next/server";
import { searchMovies, getBestMoviePoster } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const uiPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const tmdbPage = Math.floor((uiPage - 1) / 2) + 1;
    const data = await searchMovies(query, tmdbPage);

    const startIndex = ((uiPage - 1) % 2) * 10;
    const rawResults = data.results || [];
    const sliced = rawResults.slice(startIndex, startIndex + 10);

    const results = await Promise.all(
      sliced.map(async (movie) => {
        let poster = movie.poster_path;
        if (movie.id) {
          const best = await getBestMoviePoster(movie.id);
          if (best) {
            poster = best;
          }
        }
        return {
          ...movie,
          poster_path: poster,
          moduleType: "movies",
        };
      })
    );

    const totalPages = Math.min(Math.ceil((data.total_results || 0) / 10), 1000);

    return NextResponse.json({
      page: uiPage,
      results,
      total_pages: totalPages,
      total_results: data.total_results || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to search movies" },
      { status: 500 }
    );
  }
}
