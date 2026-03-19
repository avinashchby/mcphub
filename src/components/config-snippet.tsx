"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ClientType } from "@/lib/types";

interface ConfigTab {
  client_type: ClientType | string;
  label: string;
  config: Record<string, unknown>;
}

interface ConfigSnippetProps {
  /** Explicit list of config tabs to display. */
  configs: ConfigTab[];
}

const CLIENT_ORDER: Array<ClientType> = [
  "claude_desktop",
  "claude_code",
  "cursor",
  "windsurf",
  "vscode",
];

const CLIENT_LABELS: Record<string, string> = {
  claude_desktop: "Claude Desktop",
  claude_code: "Claude Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  vscode: "VS Code",
};

/** Recursively renders a JSON value with CSS-based syntax highlighting. */
function JsonValue({ value, indent = 0 }: { value: unknown; indent?: number }) {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (value === null) {
    return <span className="text-amber-400">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-amber-400">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-amber-400">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-green-400">&quot;{value}&quot;</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-foreground">[]</span>;
    return (
      <>
        <span className="text-foreground">{"["}</span>
        {"\n"}
        {value.map((item, i) => (
          <React.Fragment key={i}>
            {padInner}
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
    if (entries.length === 0) return <span className="text-foreground">{"{}"}</span>;
    return (
      <>
        <span className="text-foreground">{"{"}</span>
        {"\n"}
        {entries.map(([k, v], i) => (
          <React.Fragment key={k}>
            {padInner}
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

/** Copy-to-clipboard button with brief "Copied!" feedback. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
        copied
          ? "bg-green-500/15 text-green-400 border border-green-500/30"
          : "bg-[hsl(0_0%_15%)] text-muted-foreground hover:text-foreground border border-[hsl(0_0%_20%)]"
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

/**
 * Tabbed config snippet panel showing formatted, highlighted JSON
 * for each client type with a copy button.
 */
export function ConfigSnippet({ configs }: ConfigSnippetProps) {
  // Sort configs by canonical CLIENT_ORDER, then append extras.
  const sorted = [...configs].sort((a, b) => {
    const ai = CLIENT_ORDER.indexOf(a.client_type as ClientType);
    const bi = CLIENT_ORDER.indexOf(b.client_type as ClientType);
    const an = ai === -1 ? 999 : ai;
    const bn = bi === -1 ? 999 : bi;
    return an - bn;
  });

  const defaultTab = sorted[0]?.client_type ?? "";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="flex-wrap h-auto gap-1">
        {sorted.map((tab) => (
          <TabsTrigger key={tab.client_type} value={tab.client_type}>
            {CLIENT_LABELS[tab.client_type] ?? tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {sorted.map((tab) => {
        const jsonText = JSON.stringify(tab.config, null, 2);
        return (
          <TabsContent key={tab.client_type} value={tab.client_type}>
            <div className="relative rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)] overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(0_0%_12%)]">
                <span className="text-xs text-muted-foreground font-mono">
                  {CLIENT_LABELS[tab.client_type] ?? tab.label} config
                </span>
                <CopyButton text={jsonText} />
              </div>
              {/* Code block */}
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed font-mono">
                <code>
                  <JsonValue value={tab.config} />
                </code>
              </pre>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
