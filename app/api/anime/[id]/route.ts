import { NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id, 10);
    if (!animeId || isNaN(animeId)) {
      return NextResponse.json({ error: "Valid Anime ID is required" }, { status: 400 });
    }

    const data = await getAnimeById(animeId);
    if (!data) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch anime details" },
      { status: 500 }
    );
  }
}
