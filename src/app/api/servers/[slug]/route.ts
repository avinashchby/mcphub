import { NextRequest, NextResponse } from "next/server";
import { getServerBySlug } from "@/lib/db";

interface RouteContext {
  params: { slug: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const server = getServerBySlug(slug);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json(server);
  } catch (err) {
    console.error("GET /api/servers/[slug] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
