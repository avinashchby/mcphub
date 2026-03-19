"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { SecurityBadge } from "@/components/security-badge";
import type { Server, Category } from "@/lib/types";

interface ServerCardProps {
  /** Server data to display. */
  server: Server;
  /** Optional categories for tag display. */
  categories?: Category[];
}

/** Language badge with subtle styling. */
function LanguageBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[hsl(217_91%_60%/0.12)] border border-[hsl(217_91%_60%/0.25)] px-2 py-0.5 text-xs font-medium text-[hsl(217_91%_60%)]">
      {language}
    </span>
  );
}

/** Category tag badge with muted styling. */
function CategoryTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[hsl(0_0%_15%)] border border-[hsl(0_0%_20%)] px-2 py-0.5 text-xs text-muted-foreground">
      {name}
    </span>
  );
}

/**
 * Card displaying a server's key info. Wraps entirely in a Next.js Link
 * to /server/{slug} with hover scale and shadow animation.
 */
export function ServerCard({ server, categories = [] }: ServerCardProps) {
  const visibleCategories = categories.slice(0, 2);

  return (
    <Link href={`/server/${server.slug}`} className="group block">
      <div
        className={cn(
          "relative flex flex-col gap-3 rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4",
          "transition-all duration-200",
          "group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-black/40",
          "group-hover:border-[hsl(0_0%_22%)]"
        )}
      >
        {/* Top row: name + language badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-1 flex-1">
            {server.name}
          </h3>
          {server.language && <LanguageBadge language={server.language} />}
        </div>

        {/* Short description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {server.short_description}
        </p>

        {/* Bottom row: stars, security badge, categories */}
        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {/* Star count */}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {formatNumber(server.stars)}
          </span>

          {/* Security badge */}
          <SecurityBadge score={server.security_score} size="sm" />

          {/* Category tags */}
          {visibleCategories.map((cat) => (
            <CategoryTag key={cat.id} name={cat.name} />
          ))}
        </div>

        {/* Official badge overlay */}
        {server.is_official && (
          <span className="absolute top-3 right-3 mt-0 mr-0 inline-flex items-center rounded-full bg-[hsl(217_91%_60%)] px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
            Official
          </span>
        )}
      </div>
    </Link>
  );
}
