"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { ClientType } from "@/lib/types";

interface ServerEntry {
  id: number;
  name: string;
  slug: string;
  npm_package: string | null;
  install_command: string;
  transport: string;
  short_description: string;
}

interface Props {
  servers: ServerEntry[];
}

interface ClientOption {
  value: ClientType;
  label: string;
  icon: string;
  filePath: string;
}

const CLIENT_OPTIONS: ClientOption[] = [
  {
    value: "claude_desktop",
    label: "Claude Desktop",
    icon: "🖥️",
    filePath: "~/Library/Application Support/Claude/claude_desktop_config.json",
  },
  {
    value: "claude_code",
    label: "Claude Code",
    icon: "⌨️",
    filePath: "~/.claude.json",
  },
  {
    value: "cursor",
    label: "Cursor",
    icon: "🔵",
    filePath: "~/.cursor/mcp.json",
  },
  {
    value: "windsurf",
    label: "Windsurf",
    icon: "🌊",
    filePath: "~/.windsurf/mcp.json",
  },
  {
    value: "vscode",
    label: "VS Code",
    icon: "🟦",
    filePath: ".vscode/settings.json",
  },
];

/** Build the server block for a given install_command, matching config-generator logic. */
function buildServerBlock(
  server: Pick<ServerEntry, "slug" | "npm_package" | "install_command">
): Record<string, unknown> {
  const cmd = server.install_command;
  if (cmd.startsWith("npx")) {
    const parts = cmd.split(" ").slice(1);
    return { command: "npx", args: ["-y", ...parts] };
  }
  if (cmd.startsWith("uvx")) {
    const parts = cmd.split(" ").slice(1);
    return { command: "uvx", args: parts };
  }
  if (cmd.startsWith("docker")) {
    return {
      command: "docker",
      args: ["run", "-i", "--rm", cmd.split(" ").pop() ?? ""],
    };
  }
  return {
    command: "npx",
    args: [
      "-y",
      server.npm_package ?? `@modelcontextprotocol/server-${server.slug}`,
    ],
  };
}

/** Generate the merged config object for the chosen client and servers. */
function generateConfig(
  servers: ServerEntry[],
  client: ClientType
): Record<string, unknown> {
  if (client === "vscode") {
    return {
      "mcp.servers": servers.map((s) => {
        const block = buildServerBlock(s);
        return { type: "stdio", id: s.slug, name: s.name, ...block };
      }),
    };
  }

  const mcpServers: Record<string, unknown> = {};
  for (const s of servers) {
    const block = buildServerBlock(s);
    mcpServers[s.slug] =
      client === "cursor" ? { ...block, disabled: false } : block;
  }
  return { mcpServers };
}

/** @public Configure page interactive content. */
export default function ConfigureContent({ servers }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [client, setClient] = useState<ClientType>("claude_desktop");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return servers;
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q)
    );
  }, [search, servers]);

  function toggleServer(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((s) => s.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const selectedServers = servers.filter((s) => selected.has(s.id));
  const configJson =
    selectedServers.length > 0
      ? JSON.stringify(generateConfig(selectedServers, client), null, 2)
      : "";

  const activeClient = CLIENT_OPTIONS.find((c) => c.value === client)!;

  async function handleCopy() {
    if (!configJson) return;
    await navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!configJson) return;
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mcp-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: server selection + client picker */}
      <div className="flex flex-col gap-6">
        {/* Server selection card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Select Servers</CardTitle>
                <CardDescription>
                  Choose which MCP servers to include
                </CardDescription>
              </div>
              {selected.size > 0 && (
                <Badge>{selected.size} selected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Search */}
            <Input
              placeholder="Search servers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Select / Clear all */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={filtered.length === 0}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={selected.size === 0}
              >
                Clear All
              </Button>
            </div>

            {/* Server list */}
            <div className="overflow-y-auto max-h-[420px] flex flex-col gap-1 pr-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No servers match your search.
                </p>
              )}
              {filtered.map((server) => {
                const isChecked = selected.has(server.id);
                return (
                  <label
                    key={server.id}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      isChecked
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-primary"
                      checked={isChecked}
                      onChange={() => toggleServer(server.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {server.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {server.short_description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Client picker card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Target Client</CardTitle>
            <CardDescription>
              Choose the application you are configuring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CLIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setClient(opt.value)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                    client === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column: output panel */}
      <div className="flex flex-col gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Generated Config</CardTitle>
                <CardDescription>
                  {activeClient.icon} Save to:{" "}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {activeClient.filePath}
                  </code>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!configJson}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!configJson}
                >
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {configJson ? (
              <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-x-auto overflow-y-auto max-h-[520px] whitespace-pre leading-relaxed">
                {configJson}
              </pre>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm text-muted-foreground font-medium">
                  No servers selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Select at least one server to generate a config
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
