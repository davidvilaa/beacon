import { NextResponse } from "next/server";
import { getCompanyDetails } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    const data = await getCompanyDetails(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
