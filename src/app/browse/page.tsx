import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getAllServers,
  getAllCategories,
  getDistinctLanguages,
  getDistinctTransports,
  getDistinctAuthTypes,
} from "@/lib/db";
import { BrowseContent } from "@/components/browse-content";

export const metadata: Metadata = {
  title: "Browse MCP Servers | MCPHub",
  description:
    "Explore and filter the full catalogue of Model Context Protocol servers. " +
    "Filter by category, language, transport, and auth type.",
};

/**
 * Browse page — server component that fetches all seed data and passes it
 * to the interactive BrowseContent client component.
 */
export default function BrowsePage() {
  const initialServers = getAllServers({ sort: "stars", page: 1, limit: 24 });
  const categories = getAllCategories();
  const languages = getDistinctLanguages();
  const transports = getDistinctTransports();
  const authTypes = getDistinctAuthTypes();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Browse MCP Servers
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover Model Context Protocol servers across categories, languages,
            and transport types.
          </p>
        </div>

        {/* BrowseContent needs useSearchParams, wrap in Suspense per Next.js requirement */}
        <Suspense fallback={<BrowseSkeleton />}>
          <BrowseContent
            initialServers={initialServers}
            categories={categories}
            languages={languages}
            transports={transports}
            authTypes={authTypes}
          />
        </Suspense>
      </div>
    </main>
  );
}

/** Full-page skeleton shown while BrowseContent hydrates. */
function BrowseSkeleton() {
  return (
    <div className="flex gap-6 items-start animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-56 shrink-0">
        <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4 h-96" />
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="h-4 w-32 rounded bg-[hsl(0_0%_15%)]" />
          <div className="h-8 w-40 rounded-lg bg-[hsl(0_0%_15%)]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
