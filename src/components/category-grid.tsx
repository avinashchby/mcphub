"use client";

import * as React from "react";
import Link from "next/link";
import {
  Code2,
  Database,
  Globe,
  FileText,
  Shield,
  Cpu,
  Cloud,
  Search,
  MessageSquare,
  Zap,
  Music,
  Image,
  BarChart2,
  Mail,
  Calendar,
  Terminal,
  Lock,
  Layers,
  Settings,
  Box,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

/** Maps category icon field values to lucide-react icons. */
const ICON_MAP: Record<string, LucideIcon> = {
  code: Code2,
  code2: Code2,
  database: Database,
  db: Database,
  globe: Globe,
  web: Globe,
  file: FileText,
  "file-text": FileText,
  document: FileText,
  shield: Shield,
  security: Shield,
  cpu: Cpu,
  ai: Cpu,
  ml: Cpu,
  cloud: Cloud,
  search: Search,
  message: MessageSquare,
  chat: MessageSquare,
  zap: Zap,
  automation: Zap,
  music: Music,
  audio: Music,
  image: Image,
  photo: Image,
  chart: BarChart2,
  analytics: BarChart2,
  mail: Mail,
  email: Mail,
  calendar: Calendar,
  terminal: Terminal,
  cli: Terminal,
  lock: Lock,
  auth: Lock,
  layers: Layers,
  integration: Layers,
  settings: Settings,
  config: Settings,
  box: Box,
  package: Box,
};

function getCategoryIcon(iconName: string): LucideIcon {
  const lower = iconName?.toLowerCase() ?? "";
  return ICON_MAP[lower] ?? Box;
}

interface CategoryCardProps {
  category: Category;
}

/** Single category card with icon, name, and server count. */
function CategoryCard({ category }: CategoryCardProps) {
  const Icon = getCategoryIcon(category.icon);

  return (
    <Link
      href={`/browse?category=${category.slug}`}
      className="group block"
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-5 text-center",
          "transition-all duration-200",
          "group-hover:scale-[1.03] group-hover:border-[hsl(217_91%_60%/0.4)]",
          "group-hover:bg-[hsl(217_91%_60%/0.05)] group-hover:shadow-lg group-hover:shadow-black/30"
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            "bg-[hsl(217_91%_60%/0.1)] border border-[hsl(217_91%_60%/0.2)]",
            "transition-colors group-hover:bg-[hsl(217_91%_60%/0.2)]"
          )}
        >
          <Icon className="h-5 w-5 text-[hsl(217_91%_60%)]" />
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-foreground leading-snug">
          {category.name}
        </span>

        {/* Server count badge */}
        {category.server_count !== undefined && (
          <span className="inline-flex items-center rounded-full bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_18%)] px-2 py-0.5 text-xs text-muted-foreground">
            {category.server_count} server{category.server_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

interface CategoryGridProps {
  /** List of categories to render. */
  categories: Category[];
}

/**
 * Responsive grid of category cards.
 * Columns: 2 (mobile) → 3 (sm) → 4 (md) → 6 (lg+).
 */
export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        No categories found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
