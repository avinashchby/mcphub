import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getStats,
  getTrendingServers,
  getFeaturedServers,
  getAllCategories,
  getCategoriesForServer,
} from "@/lib/db";
import { ServerCard } from "@/components/server-card";
import { CategoryGrid } from "@/components/category-grid";
import { HeroSearch } from "@/components/hero-search";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "mcphub — Discover MCP Servers",
  description:
    "The open-source directory for Model Context Protocol servers. Find, configure, and deploy MCP servers for Claude, Cursor, VS Code, and more.",
  openGraph: {
    title: "mcphub — Discover MCP Servers",
    description:
      "The open-source directory for Model Context Protocol servers. Find, configure, and deploy MCP servers for Claude, Cursor, VS Code, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mcphub — Discover MCP Servers",
    description:
      "The open-source directory for Model Context Protocol servers. Find, configure, and deploy MCP servers for Claude, Cursor, VS Code, and more.",
  },
};

/** Single stat shown in the stats bar. */
function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1.5">
      <span className="text-xl font-bold text-foreground tabular-nums">
        {formatNumber(value)}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}

/** Thin vertical divider between stats. */
function StatDivider() {
  return (
    <span
      aria-hidden
      className="hidden sm:block h-4 w-px bg-[hsl(0_0%_20%)]"
    />
  );
}

export default function HomePage() {
  const stats = getStats();
  const trendingServers = getTrendingServers(8);
  const featuredServers = getFeaturedServers(4);
  const categories = getAllCategories();

  const trendingWithCategories = trendingServers.map((server) => ({
    server,
    categories: getCategoriesForServer(server.id),
  }));

  const featuredWithCategories = featuredServers.map((server) => ({
    server,
    categories: getCategoriesForServer(server.id),
  }));

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-[hsl(0_0%_12%)] bg-[hsl(0_0%_4%)]">
        {/* Radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[500px] w-[800px] rounded-full bg-[hsl(217_91%_60%/0.06)] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
          {/* Open-source badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(217_91%_60%/0.3)] bg-[hsl(217_91%_60%/0.08)] px-3 py-1 text-xs font-medium text-[hsl(217_91%_60%)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(217_91%_60%)]" />
            Open-source MCP registry
          </div>

          {/* Main heading */}
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Discover{" "}
            <span className="bg-gradient-to-r from-[hsl(217_91%_60%)] to-[hsl(270_91%_65%)] bg-clip-text text-transparent">
              MCP Servers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The open-source directory for Model Context Protocol servers. Find,
            configure, and deploy MCP servers for Claude, Cursor, VS Code, and
            more.
          </p>

          {/* Hero search — client component that fetches server list */}
          <HeroSearch />

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(217_91%_60%)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse all servers
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_8%)] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-[hsl(0_0%_30%)] hover:bg-[hsl(0_0%_10%)]"
            >
              Submit a server
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats bar                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-[hsl(0_0%_12%)] bg-[hsl(0_0%_6%)]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6 sm:flex-row sm:gap-8">
          <StatItem value={stats.servers} label="Servers" />
          <StatDivider />
          <StatItem value={stats.categories} label="Categories" />
          <StatDivider />
          <StatItem value={stats.tools} label="Tools" />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Trending Servers                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Trending Servers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most starred MCP servers right now
            </p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm text-[hsl(217_91%_60%)] transition-opacity hover:opacity-80"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {trendingWithCategories.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No servers yet.{" "}
            <Link
              href="/submit"
              className="text-[hsl(217_91%_60%)] underline underline-offset-2"
            >
              Submit the first one!
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trendingWithCategories.map(({ server, categories: cats }) => (
              <ServerCard key={server.id} server={server} categories={cats} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Browse by Category                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-[hsl(0_0%_12%)] bg-[hsl(0_0%_5%)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Browse by Category
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore servers grouped by use case
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Featured                                                             */}
      {/* ------------------------------------------------------------------ */}
      {featuredWithCategories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hand-picked servers worth checking out
              </p>
            </div>
            <Link
              href="/browse?sort=security"
              className="inline-flex items-center gap-1 text-sm text-[hsl(217_91%_60%)] transition-opacity hover:opacity-80"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {featuredWithCategories.map(({ server, categories: cats }) => (
              <ServerCard key={server.id} server={server} categories={cats} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
