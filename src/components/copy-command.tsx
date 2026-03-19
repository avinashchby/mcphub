"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyCommandProps {
  /** The install command string to display and copy. */
  command: string;
  /** Optional additional className for the container. */
  className?: string;
}

/**
 * Displays an install command in a styled code block with a copy-to-clipboard button.
 * Designed for use in hero sections and sidebars.
 */
export function CopyCommand({ command, className }: CopyCommandProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)] px-3 py-2",
        className
      )}
    >
      <code className="flex-1 truncate font-mono text-sm text-muted-foreground">
        {command}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied!" : "Copy command"}
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
          copied
            ? "bg-green-500/15 text-green-400 border border-green-500/30"
            : "bg-[hsl(0_0%_12%)] text-muted-foreground hover:text-foreground border border-[hsl(0_0%_18%)]"
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
    </div>
  );
}
