import { NextResponse } from "next/server";
import { getTvSeasonDetails } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  try {
    const { id, seasonNumber } = await params;
    if (!id || seasonNumber === undefined) {
      return NextResponse.json(
        { error: "TV ID and Season Number are required" },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(seasonNumber, 10);
    const data = await getTvSeasonDetails(id, isNaN(seasonNum) ? 1 : seasonNum);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch season details" },
      { status: 500 }
    );
  }
}
