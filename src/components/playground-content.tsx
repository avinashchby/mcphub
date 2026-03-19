"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Server, Tool } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaygroundServer {
  id: number;
  name: string;
  slug: string;
  short_description: string;
}

interface PlaygroundContentProps {
  /** Lightweight server list fetched server-side. */
  servers: PlaygroundServer[];
}

interface ServerWithTools extends PlaygroundServer {
  tools: Tool[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parses input_schema — accepts both JSON strings and plain objects. */
function parseSchema(raw: string): Record<string, unknown> | null {
  if (!raw || raw === "{}") return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extracts property names + types from a JSON Schema object's properties. */
function schemaToFields(schema: Record<string, unknown>): { name: string; type: string; required: boolean }[] {
  const props = (schema.properties ?? {}) as Record<string, { type?: string }>;
  const required = (schema.required ?? []) as string[];
  return Object.entries(props).map(([name, def]) => ({
    name,
    type: def.type ?? "string",
    required: required.includes(name),
  }));
}

/** Builds a mock request payload from field values. */
function buildRequest(toolName: string, params: Record<string, string>) {
  return {
    method: "tools/call",
    params: {
      name: toolName,
      arguments: Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "")
      ),
    },
  };
}

/** Produces a plausible mock response for a given tool call. */
function buildMockResponse(toolName: string, params: Record<string, string>) {
  return {
    result: {
      content: [
        {
          type: "text",
          text: `Mock response from ${toolName}. Arguments received: ${JSON.stringify(params)}`,
        },
      ],
      isError: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders JSON with minimal syntax highlighting. */
function JsonBlock({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2);
  return (
    <pre className="overflow-x-auto p-4 text-xs leading-relaxed font-[family-name:var(--font-geist-mono)] text-foreground whitespace-pre">
      {text}
    </pre>
  );
}

interface ToolInputFormProps {
  tool: Tool;
  onExecute: (params: Record<string, string>) => void;
  executing: boolean;
}

/** Dynamic form generated from a tool's input_schema. */
function ToolInputForm({ tool, onExecute, executing }: ToolInputFormProps) {
  const schema = parseSchema(tool.input_schema);
  const fields = schema ? schemaToFields(schema) : [];
  const [values, setValues] = React.useState<Record<string, string>>({});

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onExecute(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          This tool takes no parameters.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <span className="font-[family-name:var(--font-geist-mono)]">
                  {f.name}
                </span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {f.type}
                </Badge>
                {f.required && (
                  <span className="text-destructive text-[10px]">required</span>
                )}
              </label>
              <input
                type="text"
                value={values[f.name] ?? ""}
                onChange={(e) => handleChange(f.name, e.target.value)}
                placeholder={`Enter ${f.name}…`}
                className="w-full h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-[family-name:var(--font-geist-mono)]"
              />
            </div>
          ))}
        </div>
      )}
      <Button type="submit" size="sm" disabled={executing} className="w-full">
        {executing ? "Executing…" : "Execute"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ConnectButton with tooltip
// ---------------------------------------------------------------------------

function ConnectButton() {
  const [showTip, setShowTip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        onClick={() => setShowTip((p) => !p)}
        aria-label="Connect to server — coming soon"
      >
        Connect
      </Button>
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
          Coming Soon — Live MCP connections launching Q2 2025
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-border bg-popover rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Playground split-pane UI.
 * Left (40%): server selector, tool list, parameter form.
 * Right (60%): request/response viewer.
 */
export function PlaygroundContent({ servers }: PlaygroundContentProps) {
  const [selectedServerId, setSelectedServerId] = React.useState<number | null>(null);
  const [serverData, setServerData] = React.useState<ServerWithTools | null>(null);
  const [loadingServer, setLoadingServer] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const [selectedTool, setSelectedTool] = React.useState<Tool | null>(null);
  const [request, setRequest] = React.useState<unknown>(null);
  const [response, setResponse] = React.useState<unknown>(null);
  const [executing, setExecuting] = React.useState(false);

  // Fetch full server detail (including tools) when selection changes.
  React.useEffect(() => {
    if (selectedServerId === null) {
      setServerData(null);
      setSelectedTool(null);
      setRequest(null);
      setResponse(null);
      return;
    }

    const server = servers.find((s) => s.id === selectedServerId);
    if (!server) return;

    setLoadingServer(true);
    setServerError(null);
    setSelectedTool(null);
    setRequest(null);
    setResponse(null);

    fetch(`/api/servers/${server.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Server & { tools: Tool[] }) => {
        setServerData({ ...server, tools: data.tools ?? [] });
      })
      .catch((err: unknown) => {
        setServerError(err instanceof Error ? err.message : "Failed to load server");
      })
      .finally(() => setLoadingServer(false));
  }, [selectedServerId, servers]);

  // When a tool is clicked, build the initial request preview.
  function handleToolSelect(tool: Tool) {
    setSelectedTool(tool);
    setResponse(null);
    setRequest(buildRequest(tool.name, {}));
  }

  // Execute with a 500 ms mock delay.
  function handleExecute(params: Record<string, string>) {
    if (!selectedTool) return;
    const req = buildRequest(selectedTool.name, params);
    setRequest(req);
    setExecuting(true);
    setResponse(null);
    setTimeout(() => {
      setResponse(buildMockResponse(selectedTool.name, params));
      setExecuting(false);
    }, 500);
  }

  return (
    <div className="flex gap-4 min-h-[calc(100vh-14rem)]">
      {/* Left panel — 40% */}
      <div className="w-[40%] flex flex-col gap-4">
        {/* Server selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select Server</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedServerId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedServerId(val === "" ? null : Number(val));
              }}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Select an MCP server"
            >
              <option value="">— choose a server —</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {selectedServerId !== null && serverData && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {serverData.short_description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tools list */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tools</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-64 p-0">
            {loadingServer && (
              <p className="text-sm text-muted-foreground px-6 py-4">
                Loading tools…
              </p>
            )}
            {serverError && (
              <p className="text-sm text-destructive px-6 py-4">{serverError}</p>
            )}
            {!loadingServer && !serverError && !serverData && (
              <p className="text-sm text-muted-foreground px-6 py-4">
                Select a server to see its tools.
              </p>
            )}
            {!loadingServer && serverData && serverData.tools.length === 0 && (
              <p className="text-sm text-muted-foreground px-6 py-4">
                No tools registered for this server.
              </p>
            )}
            {!loadingServer && serverData && serverData.tools.length > 0 && (
              <ul className="divide-y divide-border">
                {serverData.tools.map((tool) => (
                  <li key={tool.id}>
                    <button
                      type="button"
                      onClick={() => handleToolSelect(tool)}
                      className={[
                        "w-full text-left px-6 py-3 text-sm transition-colors hover:bg-accent",
                        selectedTool?.id === tool.id
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      <span className="font-[family-name:var(--font-geist-mono)] block truncate">
                        {tool.name}
                      </span>
                      {tool.description && (
                        <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                          {tool.description}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Parameter form */}
        {selectedTool && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="font-[family-name:var(--font-geist-mono)] text-[hsl(217_91%_60%)]">
                  {selectedTool.name}
                </span>
              </CardTitle>
              {selectedTool.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedTool.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ToolInputForm
                tool={selectedTool}
                onExecute={handleExecute}
                executing={executing}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right panel — 60% */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Request / Response
          </h2>
          <ConnectButton />
        </div>

        {/* Request viewer */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Request</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-xl bg-[hsl(0_0%_6%)] border-t border-border overflow-hidden">
              {request == null ? (
                <p className="text-xs text-muted-foreground px-4 py-6">
                  Select a tool and click Execute to see the request payload.
                </p>
              ) : (
                <JsonBlock value={request} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response viewer */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Response
              {executing && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  running…
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-xl bg-[hsl(0_0%_6%)] border-t border-border overflow-hidden">
              {response == null && !executing ? (
                <p className="text-xs text-muted-foreground px-4 py-6">
                  Response will appear here after execution.
                </p>
              ) : executing ? (
                <p className="text-xs text-muted-foreground px-4 py-6 animate-pulse">
                  Executing…
                </p>
              ) : (
                <JsonBlock value={response} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
