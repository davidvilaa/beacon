import { NextResponse } from "next/server";
import { getTrendingMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get("timeWindow") === "week" ? "week" : "day";
    const movies = await getTrendingMovies(timeWindow);

    return NextResponse.json({ results: movies });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch trending movies" },
      { status: 500 }
    );
  }
}
