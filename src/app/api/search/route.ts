import { NextRequest, NextResponse } from "next/server";
import { searchServers, getAllCategories } from "@/lib/db";
import type { Server, Category } from "@/lib/types";

interface SearchResponse {
  servers: Server[];
  categories: Category[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") ?? "";

    if (!q.trim()) {
      return NextResponse.json<SearchResponse>({ servers: [], categories: [] });
    }

    const servers = searchServers(q);

    const allCategories = getAllCategories();
    const lowerQ = q.toLowerCase();
    const categories = allCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQ) ||
        c.description.toLowerCase().includes(lowerQ) ||
        c.slug.toLowerCase().includes(lowerQ)
    );

    return NextResponse.json<SearchResponse>({ servers, categories });
  } catch (err) {
    console.error("GET /api/search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
