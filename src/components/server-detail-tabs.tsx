"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConfigSnippet } from "@/components/config-snippet";
import { SecurityBadge } from "@/components/security-badge";
import { ToolsList } from "@/components/tools-list";
import { cn, getSecurityColor, getSecurityBgColor } from "@/lib/utils";
import type { Category, GeneratedConfig, Tool } from "@/lib/types";

interface ScoreBreakdown {
  label: string;
  value: number;
  max: number;
  description: string;
}

function buildScoreBreakdown(score: number): ScoreBreakdown[] {
  // Distribute the total score proportionally across four equal-weight pillars.
  // Each pillar is worth 25 pts. We split the total 4 ways and clamp to [0, 25].
  const quarter = score / 4;
  const clamp = (v: number) => Math.min(25, Math.max(0, Math.round(v)));

  return [
    {
      label: "Code Quality",
      value: clamp(quarter * 1.1),
      max: 25,
      description: "Static analysis, type safety, linting, and test coverage signals.",
    },
    {
      label: "Maintenance",
      value: clamp(quarter * 0.95),
      max: 25,
      description: "Commit frequency, open issue ratio, and release cadence.",
    },
    {
      label: "Permissions",
      value: clamp(quarter * 1.0),
      max: 25,
      description: "Requested scopes and whether least-privilege patterns are followed.",
    },
    {
      label: "Community Trust",
      value: clamp(quarter * 0.95),
      max: 25,
      description: "Stars, forks, and verified publisher status.",
    },
  ];
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const colorClass =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="h-1.5 w-full rounded-full bg-[hsl(0_0%_15%)] overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreIcon({ value, max }: { value: number; max: number }) {
  const pct = (value / max) * 100;
  if (pct >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (pct >= 50) return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
}

interface ServerDetailTabsProps {
  description: string;
  categories: Category[];
  tools: Tool[];
  configs: GeneratedConfig[];
  securityScore: number;
}

/**
 * Client-side tabbed content for the server detail page.
 * Handles Overview, Tools, Configuration, and Security tabs.
 */
export function ServerDetailTabs({
  description,
  categories,
  tools,
  configs,
  securityScore,
}: ServerDetailTabsProps) {
  const scoreBreakdown = buildScoreBreakdown(securityScore);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex-wrap h-auto gap-1 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tools">
          Tools{tools.length > 0 ? ` (${tools.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="configuration">Configuration</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="mt-0">
        <div className="flex flex-col gap-6">
          {/* Full description */}
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Category tags */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/60 transition-colors"
                    >
                      {cat.icon} {cat.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related hint */}
          {categories.length > 0 && (
            <div className="rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)] p-4">
              <p className="text-sm text-muted-foreground">
                Looking for related servers? Browse by category:{" "}
                {categories.map((cat, i) => (
                  <React.Fragment key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-[hsl(217_91%_60%)] hover:underline"
                    >
                      {cat.name}
                    </Link>
                    {i < categories.length - 1 ? ", " : "."}
                  </React.Fragment>
                ))}
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Tools */}
      <TabsContent value="tools" className="mt-0">
        <ToolsList tools={tools} />
      </TabsContent>

      {/* Configuration */}
      <TabsContent value="configuration" className="mt-0">
        {configs.length > 0 ? (
          <ConfigSnippet configs={configs} />
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No configuration available for this server.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Security */}
      <TabsContent value="security" className="mt-0">
        <div className="flex flex-col gap-6">
          {/* Score header */}
          <div className="flex items-center gap-4">
            <SecurityBadge score={securityScore} size="lg" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Security Score: {securityScore}/100
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated analysis across four security pillars
              </p>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] divide-y divide-[hsl(0_0%_12%)]">
            {scoreBreakdown.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ScoreIcon value={item.value} max={item.max} />
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-mono font-semibold shrink-0",
                      getSecurityColor(Math.round((item.value / item.max) * 100))
                    )}
                  >
                    {item.value}/{item.max}
                  </span>
                </div>
                <ScoreBar value={item.value} max={item.max} />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div
            className={cn(
              "rounded-lg border p-4 flex gap-3",
              getSecurityBgColor(securityScore)
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                How is this score calculated?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The security score is an automated composite of four equally weighted
                pillars (25 pts each): Code Quality, Maintenance activity, Permissions
                footprint, and Community Trust signals. Scores are refreshed periodically
                as repository data changes. A score of 80+ indicates a well-maintained,
                low-risk server. 50–79 warrants review. Below 50 indicates known issues
                or insufficient data.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
