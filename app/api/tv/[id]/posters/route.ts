import { NextResponse } from "next/server";
import { getTvPosters } from "@/lib/artwork/sources";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "TV ID is required" }, { status: 400 });
    }

    const season = new URL(request.url).searchParams.get("season");

    const posters = await getTvPosters(id, season);
    return NextResponse.json({ posters });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posters" },
      { status: 500 }
    );
  }
}
