import { NextRequest, NextResponse } from "next/server";
import {
  insertServer,
  insertCategory,
  linkServerCategory,
  insertServerConfig,
  getServerBySlug,
} from "@/lib/db";
import { fetchRepoMeta, parseGitHubUrl } from "@/lib/github";
import { generateConfigForServer } from "@/lib/config-generator";
import type { SubmitServerPayload } from "@/lib/types";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = body as Partial<SubmitServerPayload>;

    if (!payload.github_url || typeof payload.github_url !== "string") {
      return NextResponse.json(
        { error: "github_url is required" },
        { status: 400 }
      );
    }

    if (!GITHUB_URL_REGEX.test(payload.github_url)) {
      return NextResponse.json(
        { error: "github_url must be a valid GitHub repository URL" },
        { status: 400 }
      );
    }

    const categories: string[] = Array.isArray(payload.categories)
      ? payload.categories.filter((c): c is string => typeof c === "string")
      : [];

    const description =
      typeof payload.description === "string" ? payload.description : "";

    const parsed = parseGitHubUrl(payload.github_url);
    const repoName = parsed?.repo ?? payload.github_url.split("/").pop() ?? "unknown";

    // Attempt to enrich with GitHub metadata; fall back to manual data on failure.
    const meta = await fetchRepoMeta(payload.github_url);

    const name = meta?.name ?? repoName;
    const resolvedDescription =
      description || meta?.description || `MCP server for ${name}`;
    const shortDescription =
      resolvedDescription.length > 120
        ? resolvedDescription.slice(0, 117) + "..."
        : resolvedDescription;

    const baseSlug = slugify(name);
    // Ensure unique slug by appending a short numeric suffix when a collision exists.
    let slug = baseSlug;
    let attempt = 0;
    while (getServerBySlug(slug) !== null) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const serverId = insertServer({
      name,
      slug,
      description: resolvedDescription,
      short_description: shortDescription,
      github_url: payload.github_url,
      npm_package: null,
      stars: meta?.stars ?? 0,
      language: meta?.language ?? "Unknown",
      transport: "stdio",
      auth_type: "none",
      security_score: 50,
      install_command: "",
      logo_url: meta?.avatar_url ?? null,
      is_official: false,
      is_featured: false,
    });

    // Link submitted categories; create them if they don't already exist.
    for (const categorySlug of categories) {
      const categoryId = insertCategory({
        name: categorySlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: categorySlug,
        description: "",
        icon: "folder",
      });
      linkServerCategory(serverId, categoryId);
    }

    // Generate and persist client configs for the new server.
    const serverRow = getServerBySlug(slug);
    if (serverRow) {
      const configs = generateConfigForServer(serverRow);
      for (const cfg of configs) {
        insertServerConfig({
          server_id: serverId,
          client_type: cfg.client_type,
          config_json: JSON.stringify(cfg.config),
        });
      }
    }

    const created = getServerBySlug(slug);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
