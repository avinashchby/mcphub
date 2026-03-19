"use client";

import * as React from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export interface ActiveFilters {
  categories?: string[];
  languages?: string[];
  transports?: string[];
  authTypes?: string[];
}

interface FilterSidebarProps {
  /** All available categories with optional server counts. */
  categories: Category[];
  /** Available language options. */
  languages: string[];
  /** Available transport options. */
  transports: string[];
  /** Available auth type options. */
  authTypes: string[];
  /** Currently selected filters. */
  activeFilters: ActiveFilters;
  /** Called when any filter changes, receives full updated filter object. */
  onFilterChange: (filters: ActiveFilters) => void;
}

interface FilterSection {
  label: string;
  key: keyof ActiveFilters;
  items: { value: string; count?: number }[];
}

/** Collapsible section of filter checkboxes. */
function FilterGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { value: string; count?: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="border-b border-[hsl(0_0%_15%)] last:border-0">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground transition-colors hover:text-[hsl(217_91%_60%)]"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      {!collapsed && (
        <ul className="flex flex-col gap-2 pb-3">
          {items.map((item) => {
            const id = `filter-${label}-${item.value}`;
            const checked = selected.includes(item.value);
            return (
              <li key={item.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => onToggle(item.value)}
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "flex-1 cursor-pointer text-sm select-none",
                    checked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.value}
                </label>
                {item.count !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.count}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Counts how many filter values are active. */
function countActive(filters: ActiveFilters): number {
  return (
    (filters.categories?.length ?? 0) +
    (filters.languages?.length ?? 0) +
    (filters.transports?.length ?? 0) +
    (filters.authTypes?.length ?? 0)
  );
}

/** The actual filter panel content (used in both sidebar and sheet). */
function FilterPanelContent({
  sections,
  activeFilters,
  onFilterChange,
}: {
  sections: FilterSection[];
  activeFilters: ActiveFilters;
  onFilterChange: (f: ActiveFilters) => void;
}) {
  const activeCount = countActive(activeFilters);

  function toggle(key: keyof ActiveFilters, value: string) {
    const current: string[] = (activeFilters[key] as string[]) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...activeFilters, [key]: next });
  }

  function clearAll() {
    onFilterChange({ categories: [], languages: [], transports: [], authTypes: [] });
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[hsl(0_0%_15%)]">
        <span className="text-sm font-semibold text-foreground">Filters</span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-[hsl(217_91%_60%)] hover:text-[hsl(217_91%_70%)] transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <FilterGroup
          key={section.key}
          label={section.label}
          items={section.items}
          selected={(activeFilters[section.key] as string[]) ?? []}
          onToggle={(value) => toggle(section.key, value)}
        />
      ))}
    </div>
  );
}

/**
 * Filter sidebar for server browsing.
 * On desktop: renders inline as a sidebar panel.
 * On mobile: renders behind a Sheet/Drawer triggered by a filter icon button.
 */
export function FilterSidebar({
  categories,
  languages,
  transports,
  authTypes,
  activeFilters,
  onFilterChange,
}: FilterSidebarProps) {
  const sections: FilterSection[] = [
    {
      label: "Category",
      key: "categories",
      items: categories.map((c) => ({ value: c.slug, count: c.server_count })),
    },
    {
      label: "Language",
      key: "languages",
      items: languages.map((l) => ({ value: l })),
    },
    {
      label: "Transport",
      key: "transports",
      items: transports.map((t) => ({ value: t })),
    },
    {
      label: "Auth Type",
      key: "authTypes",
      items: authTypes.map((a) => ({ value: a })),
    },
  ];

  const activeCount = countActive(activeFilters);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4 sticky top-4">
          <FilterPanelContent
            sections={sections}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
          />
        </div>
      </aside>

      {/* Mobile sheet trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                activeCount > 0
                  ? "border-[hsl(217_91%_60%/0.5)] bg-[hsl(217_91%_60%/0.1)] text-[hsl(217_91%_60%)]"
                  : "border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(217_91%_60%)] text-[10px] font-bold text-white px-1">
                  {activeCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader className="mb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <FilterPanelContent
                sections={sections}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
