import type { Metadata } from "next";
import { getAllServers } from "@/lib/db";
import { PlaygroundContent } from "@/components/playground-content";

export const metadata: Metadata = {
  title: "MCP Playground — mcphub",
  description: "Test MCP server tools interactively in your browser.",
};

/** Playground page — passes a lightweight server list to the client component. */
export default function PlaygroundPage() {
  const { data: servers } = getAllServers({ limit: 100, sort: "name" });

  const slimServers = servers.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    short_description: s.short_description,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">MCP Playground</h1>
        <p className="text-muted-foreground">
          Test MCP server tools in your browser. Select a server, pick a tool, and
          inspect the mock request and response.
        </p>
      </div>

      <PlaygroundContent servers={slimServers} />
    </div>
  );
}
