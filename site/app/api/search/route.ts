import { NextRequest, NextResponse } from "next/server";
import { searchSkills } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const result = await searchSkills({
      query: searchParams.get("q") || "",
      category: searchParams.get("category") || undefined,
      source: searchParams.get("source") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: Math.min(parseInt(searchParams.get("limit") || "20", 10), 100),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
