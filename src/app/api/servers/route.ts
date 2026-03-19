import { NextRequest, NextResponse } from "next/server";
import { getAllServers, searchServers } from "@/lib/db";
import type { ServerListParams } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const language = searchParams.get("language") ?? undefined;
    const transport = searchParams.get("transport") ?? undefined;
    const auth_type = searchParams.get("auth_type") ?? undefined;
    const sortRaw = searchParams.get("sort");
    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");

    const validSorts = ["stars", "newest", "security", "name"] as const;
    type Sort = (typeof validSorts)[number];
    const sort: Sort | undefined =
      sortRaw && (validSorts as readonly string[]).includes(sortRaw)
        ? (sortRaw as Sort)
        : undefined;

    const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10)) : undefined;
    const limit = limitRaw
      ? Math.min(100, Math.max(1, parseInt(limitRaw, 10)))
      : undefined;

    if (search) {
      const servers = searchServers(search);
      return NextResponse.json({
        data: servers,
        total: servers.length,
        page: 1,
        limit: servers.length,
        totalPages: 1,
      });
    }

    const params: ServerListParams = {
      category,
      language,
      transport,
      auth_type,
      sort,
      page,
      limit,
    };

    const result = getAllServers(params);
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/servers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
