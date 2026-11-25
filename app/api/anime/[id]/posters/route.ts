import { NextResponse } from "next/server";
import { getAnimePosters } from "@/lib/artwork/sources";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id, 10);
    if (!animeId || isNaN(animeId)) {
      return NextResponse.json({ error: "Valid anime ID required" }, { status: 400 });
    }

    const posters = await getAnimePosters(animeId);
    if (!posters) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json({ posters });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posters" },
      { status: 500 }
    );
  }
}
