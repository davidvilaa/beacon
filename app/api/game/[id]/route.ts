import { NextResponse } from "next/server";
import { getGameDetails } from "@/lib/providers/igdb/games";

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

    const data = await getGameDetails(gameId);
    if (!data) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch game details" },
      { status: 500 }
    );
  }
}
