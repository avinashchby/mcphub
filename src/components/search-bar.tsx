"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { cn } from "@/lib/utils";
import type { Server } from "@/lib/types";

interface SearchBarProps {
  /** Placeholder text for the input. */
  placeholder?: string;
  className?: string;
  /** Called with the current query string on change (debounced 300 ms). */
  onSearch?: (query: string) => void;
  /** Hero: large centered with ⌘K hint. Compact: smaller for navbar. */
  variant?: "hero" | "compact";
  /** When provided, enables client-side fuzzy search dropdown. */
  allServers?: Server[];
}

const FUSE_OPTIONS: IFuseOptions<Server> = {
  keys: ["name", "short_description", "language"],
  threshold: 0.4,
  includeScore: true,
};

/**
 * Search bar with debounced input, optional Fuse.js dropdown,
 * keyboard navigation (↑↓ to move, Enter to navigate, Esc to close),
 * and global ⌘K shortcut.
 */
export function SearchBar({
  placeholder = "Search MCP servers…",
  className,
  onSearch,
  variant = "compact",
  allServers,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Server[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fuseRef = React.useRef<Fuse<Server> | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Build Fuse index when allServers changes.
  React.useEffect(() => {
    if (allServers && allServers.length > 0) {
      fuseRef.current = new Fuse(allServers, FUSE_OPTIONS);
    }
  }, [allServers]);

  // ⌘K global shortcut.
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click.
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch?.(val);
      if (fuseRef.current && val.trim()) {
        const hits = fuseRef.current
          .search(val.trim())
          .slice(0, 8)
          .map((r) => r.item);
        setResults(hits);
        setOpen(hits.length > 0);
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target =
        activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) {
        setOpen(false);
        router.push(`/server/${target.slug}`);
      } else if (query.trim()) {
        setOpen(false);
        router.push(`/browse?search=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  function clearQuery() {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSearch?.("");
    inputRef.current?.focus();
  }

  const isHero = variant === "hero";

  return (
    <div className={cn("relative w-full", className)}>
      {/* Input wrapper */}
      <div
        className={cn(
          "relative flex items-center rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] transition-colors",
          "focus-within:border-[hsl(217_91%_60%/0.6)] focus-within:ring-2 focus-within:ring-[hsl(217_91%_60%/0.15)]",
          isHero ? "px-5 py-3.5" : "px-3 py-2"
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-muted-foreground",
            isHero ? "h-5 w-5 mr-3" : "h-4 w-4 mr-2"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground",
            isHero ? "text-base" : "text-sm"
          )}
          aria-label="Search MCP servers"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-controls="search-results-listbox"
          autoComplete="off"
        />
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="ml-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className={isHero ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </button>
        )}
        {/* ⌘K hint — hero only, when no query */}
        {isHero && !query && (
          <span className="ml-3 hidden md:inline-flex items-center gap-0.5 text-xs text-muted-foreground select-none">
            <kbd className="rounded border border-[hsl(0_0%_20%)] px-1 py-0.5 font-mono text-[10px]">
              ⌘
            </kbd>
            <kbd className="rounded border border-[hsl(0_0%_20%)] px-1 py-0.5 font-mono text-[10px]">
              K
            </kbd>
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-results-listbox"
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] shadow-2xl shadow-black/50 overflow-hidden",
            "divide-y divide-[hsl(0_0%_12%)]"
          )}
        >
          {results.map((server, idx) => (
            <button
              key={server.id}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => {
                setOpen(false);
                router.push(`/server/${server.slug}`);
              }}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                idx === activeIndex
                  ? "bg-[hsl(217_91%_60%/0.1)]"
                  : "hover:bg-[hsl(0_0%_12%)]"
              )}
            >
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {server.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {server.short_description}
                </p>
              </div>
              {server.language && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {server.language}
                </span>
              )}
            </button>
          ))}
          {/* Browse-all footer */}
          <button
            onClick={() => {
              setOpen(false);
              router.push(`/browse?search=${encodeURIComponent(query.trim())}`);
            }}
            className="w-full px-4 py-2.5 text-xs text-[hsl(217_91%_60%)] hover:bg-[hsl(0_0%_12%)] text-left transition-colors"
          >
            Browse all results for &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
