import { NextResponse } from "next/server";
import { getPersonDetails } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Person ID is required" }, { status: 400 });
    }

    const data = await getPersonDetails(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch person details" },
      { status: 500 }
    );
  }
}
