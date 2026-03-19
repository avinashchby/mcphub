"use client";

import * as React from "react";
import { Wrench } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";

/** Parses input_schema — handles both JSON strings and plain objects. */
function parseSchema(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Renders a JSON value with minimal syntax highlighting. */
function JsonValue({ value, indent = 0 }: { value: unknown; indent?: number }) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);

  if (value === null) return <span className="text-amber-400">null</span>;
  if (typeof value === "boolean")
    return <span className="text-amber-400">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-amber-400">{value}</span>;
  if (typeof value === "string")
    return <span className="text-green-400">&quot;{value}&quot;</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-foreground">[]</span>;
    return (
      <>
        <span className="text-foreground">{"["}</span>
        {"\n"}
        {value.map((item, i) => (
          <React.Fragment key={i}>
            {inner}
            <JsonValue value={item} indent={indent + 1} />
            {i < value.length - 1 ? "," : ""}
            {"\n"}
          </React.Fragment>
        ))}
        {pad}
        <span className="text-foreground">{"]"}</span>
      </>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0)
      return <span className="text-foreground">{"{}"}</span>;
    return (
      <>
        <span className="text-foreground">{"{"}</span>
        {"\n"}
        {entries.map(([k, v], i) => (
          <React.Fragment key={k}>
            {inner}
            <span className="text-[hsl(217_91%_70%)]">&quot;{k}&quot;</span>
            <span className="text-foreground">: </span>
            <JsonValue value={v} indent={indent + 1} />
            {i < entries.length - 1 ? "," : ""}
            {"\n"}
          </React.Fragment>
        ))}
        {pad}
        <span className="text-foreground">{"}"}</span>
      </>
    );
  }

  return <span className="text-foreground">{String(value)}</span>;
}

interface ToolItemProps {
  tool: Tool;
}

/** Single tool row in the accordion. */
function ToolItem({ tool }: ToolItemProps) {
  const schema = parseSchema(tool.input_schema);
  const hasSchema = schema !== null && schema !== "";

  return (
    <AccordionItem value={`tool-${tool.id}`}>
      <AccordionTrigger className="hover:no-underline group">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(217_91%_60%/0.1)] border border-[hsl(217_91%_60%/0.2)]">
            <Wrench className="h-3.5 w-3.5 text-[hsl(217_91%_60%)]" />
          </div>
          <span className="font-mono text-sm font-medium text-foreground truncate group-hover:text-[hsl(217_91%_60%)] transition-colors">
            {tool.name}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col gap-3 pl-10">
          {/* Description */}
          {tool.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          )}

          {/* Input schema */}
          {hasSchema && (
            <div className="rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)] overflow-hidden">
              <div className="px-3 py-1.5 border-b border-[hsl(0_0%_12%)]">
                <span className="text-xs text-muted-foreground font-mono">
                  input_schema
                </span>
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed font-mono">
                <code>
                  <JsonValue value={schema} />
                </code>
              </pre>
            </div>
          )}

          {!tool.description && !hasSchema && (
            <p className="text-xs text-muted-foreground italic">
              No additional details available.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface ToolsListProps {
  /** Tools to display. */
  tools: Tool[];
}

/**
 * Accordion list of MCP tools.
 * Each row shows the tool name in monospace, expands to reveal
 * description and JSON input schema.
 */
export function ToolsList({ tools }: ToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Wrench className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No tools listed for this server.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Count badge header */}
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {tools.length} tool{tools.length !== 1 ? "s" : ""}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full bg-[hsl(217_91%_60%/0.12)] border border-[hsl(217_91%_60%/0.25)]",
            "px-2 py-0.5 text-xs font-medium text-[hsl(217_91%_60%)]"
          )}
        >
          {tools.length}
        </span>
      </div>

      {/* Accordion */}
      <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] px-4">
        <Accordion type="multiple">
          {tools.map((tool) => (
            <ToolItem key={tool.id} tool={tool} />
          ))}
        </Accordion>
      </div>
    </div>
  );
}
