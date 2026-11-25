import { NextResponse } from "next/server";
import { getMovieBackdrops } from "@/lib/artwork/sources";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    const backdrops = await getMovieBackdrops(id);
    return NextResponse.json({ backdrops });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch backdrops" },
      { status: 500 }
    );
  }
}
