"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ServerCrash } from "lucide-react";
import { FilterSidebar, type ActiveFilters } from "@/components/filter-sidebar";
import { ServerCard } from "@/components/server-card";
import type { Category, PaginatedResult, Server } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrowseContentProps {
  initialServers: PaginatedResult<Server>;
  categories: Category[];
  languages: string[];
  transports: string[];
  authTypes: string[];
}

type SortOption = "stars" | "newest" | "security" | "name";

const SORT_LABELS: Record<SortOption, string> = {
  stars: "Stars",
  newest: "Newest",
  security: "Security Score",
  name: "Name",
};

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-2/3 rounded bg-[hsl(0_0%_15%)]" />
        <div className="h-5 w-16 rounded-full bg-[hsl(0_0%_15%)]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full rounded bg-[hsl(0_0%_13%)]" />
        <div className="h-3 w-4/5 rounded bg-[hsl(0_0%_13%)]" />
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <div className="h-4 w-10 rounded bg-[hsl(0_0%_15%)]" />
        <div className="h-5 w-14 rounded-full bg-[hsl(0_0%_15%)]" />
        <div className="h-5 w-20 rounded-full bg-[hsl(0_0%_15%)]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// URL param helpers
// ---------------------------------------------------------------------------

/** Build an ActiveFilters object from current URL search params. */
function filtersFromParams(params: URLSearchParams): ActiveFilters {
  return {
    categories: params.getAll("category"),
    languages: params.getAll("language"),
    transports: params.getAll("transport"),
    authTypes: params.getAll("auth_type"),
  };
}

/** Serialize ActiveFilters + sort + page into a URLSearchParams string. */
function buildSearchString(
  filters: ActiveFilters,
  sort: SortOption,
  page: number
): string {
  const p = new URLSearchParams();
  filters.categories?.forEach((v) => p.append("category", v));
  filters.languages?.forEach((v) => p.append("language", v));
  filters.transports?.forEach((v) => p.append("transport", v));
  filters.authTypes?.forEach((v) => p.append("auth_type", v));
  if (sort !== "stars") p.set("sort", sort);
  if (page > 1) p.set("page", String(page));
  return p.toString();
}

/**
 * Build the /api/servers query string.
 *
 * The DB layer supports only one value per filter dimension, so we use the
 * first selected value when multiple are checked.
 */
function buildApiUrl(
  filters: ActiveFilters,
  sort: SortOption,
  page: number
): string {
  const p = new URLSearchParams();
  const firstCategory = filters.categories?.[0];
  const firstLanguage = filters.languages?.[0];
  const firstTransport = filters.transports?.[0];
  const firstAuthType = filters.authTypes?.[0];
  if (firstCategory) p.set("category", firstCategory);
  if (firstLanguage) p.set("language", firstLanguage);
  if (firstTransport) p.set("transport", firstTransport);
  if (firstAuthType) p.set("auth_type", firstAuthType);
  p.set("sort", sort);
  p.set("page", String(page));
  p.set("limit", "24");
  return `/api/servers?${p.toString()}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Client component for the /browse page.
 * Manages filters, sorting, pagination and fetches from /api/servers.
 */
export function BrowseContent({
  initialServers,
  categories,
  languages,
  transports,
  authTypes,
}: BrowseContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive initial state from URL params (enables direct-link / back-nav).
  const initialFilters = React.useMemo(
    () => filtersFromParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialSort = (searchParams.get("sort") as SortOption) ?? "stars";
  const initialPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [filters, setFilters] = React.useState<ActiveFilters>(initialFilters);
  const [sort, setSort] = React.useState<SortOption>(initialSort);
  const [page, setPage] = React.useState(initialPage);
  const [result, setResult] = React.useState<PaginatedResult<Server>>(initialServers);
  const [loading, setLoading] = React.useState(false);

  // Detect whether filters are "default" (no URL params on first load).
  const isFirstRender = React.useRef(true);

  // Fetch servers whenever filters / sort / page change — skip on first
  // render when we already have initialServers and params match defaults.
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // If URL has no filter params the initialServers data is already correct.
      const hasParams =
        searchParams.toString() !== "" && searchParams.toString() !== `sort=${initialSort}&page=1`;
      if (!hasParams) return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(buildApiUrl(filters, sort, page))
      .then((r) => r.json())
      .then((data: PaginatedResult<Server>) => {
        if (!cancelled) setResult(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state changes back into the URL (shallow navigation).
  React.useEffect(() => {
    if (isFirstRender.current) return;
    const qs = buildSearchString(filters, sort, page);
    router.replace(qs ? `/browse?${qs}` : "/browse", { scroll: false });
  }, [filters, sort, page, router]);

  function handleFilterChange(next: ActiveFilters) {
    setFilters(next);
    setPage(1);
  }

  function handleSort(next: SortOption) {
    setSort(next);
    setPage(1);
  }

  function clearAllFilters() {
    setFilters({ categories: [], languages: [], transports: [], authTypes: [] });
    setSort("stars");
    setPage(1);
  }

  const hasFilters =
    (filters.categories?.length ?? 0) +
      (filters.languages?.length ?? 0) +
      (filters.transports?.length ?? 0) +
      (filters.authTypes?.length ?? 0) >
    0;

  const { data: servers, total, totalPages } = result;

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar */}
      <FilterSidebar
        categories={categories}
        languages={languages}
        transports={transports}
        authTypes={authTypes}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              <span className="inline-block h-4 w-28 rounded bg-[hsl(0_0%_15%)] animate-pulse" />
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {total.toLocaleString()}
                </span>{" "}
                {total === 1 ? "server" : "servers"} found
              </>
            )}
          </p>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              Sort by
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => handleSort(e.target.value as SortOption)}
              className="rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(217_91%_60%/0.5)] transition-colors"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <EmptyState onClear={clearAllFilters} hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <ServerCrash className="h-12 w-12 text-muted-foreground opacity-40" />
      <div>
        <p className="text-lg font-semibold text-foreground">No servers found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search query.
        </p>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-[hsl(217_91%_60%/0.4)] bg-[hsl(217_91%_60%/0.08)] px-4 py-2 text-sm font-medium text-[hsl(217_91%_60%)] transition-colors hover:bg-[hsl(217_91%_60%/0.15)]"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(0_0%_22%)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <span className="text-sm text-muted-foreground tabular-nums">
        Page{" "}
        <span className="font-semibold text-foreground">{page}</span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(0_0%_22%)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
