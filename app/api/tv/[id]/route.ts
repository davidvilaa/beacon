import { NextResponse } from "next/server";
import { getTvDetails } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "TV ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get("season") || "1", 10) || 1;

    const data = await getTvDetails(id, season);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch TV details" },
      { status: 500 }
    );
  }
}
