"use client";

import * as React from "react";
import { SearchBar } from "@/components/search-bar";
import type { Server } from "@/lib/types";

/**
 * Client component that fetches the server list from /api/servers on mount
 * and passes it to SearchBar for client-side fuzzy search in the hero variant.
 */
export function HeroSearch() {
  const [allServers, setAllServers] = React.useState<Server[]>([]);

  React.useEffect(() => {
    fetch("/api/servers?limit=100")
      .then((res) => res.json())
      .then((data: { data?: Server[] }) => {
        if (Array.isArray(data.data)) {
          setAllServers(data.data);
        }
      })
      .catch(() => {
        // Silent fail — search still works via /browse redirect
      });
  }, []);

  return (
    <SearchBar
      variant="hero"
      allServers={allServers}
      placeholder="Search MCP servers…"
      className="max-w-2xl mx-auto"
    />
  );
}
