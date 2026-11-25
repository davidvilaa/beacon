import { NextResponse } from "next/server";
import { getGameArtworks } from "@/lib/providers/igdb/games";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id, 10);
    if (!gameId || isNaN(gameId)) {
      return NextResponse.json({ error: "Valid Game ID is required" }, { status: 400 });
    }

    const { backdrops } = await getGameArtworks(gameId);
    return NextResponse.json({
      backdrops: backdrops.map((b) => ({ file_path: b })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch game backdrops" },
      { status: 500 }
    );
  }
}
