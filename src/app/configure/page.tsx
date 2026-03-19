import type { Metadata } from "next";
import Database from "better-sqlite3";
import path from "path";
import ConfigureContent from "@/components/configure-content";

export const metadata: Metadata = {
  title: "Configure MCP Servers",
};

interface ServerRow {
  id: number;
  name: string;
  slug: string;
  npm_package: string | null;
  install_command: string;
  transport: string;
  short_description: string;
}

/** Fetch only the fields needed for the configure page, bypassing the paginated getAllServers. */
function getConfigureServers(): ServerRow[] {
  const db = new Database(path.join(process.cwd(), "mcphub.db"));
  db.pragma("journal_mode = WAL");
  const rows = db
    .prepare(
      `SELECT id, name, slug, npm_package, install_command, transport, short_description
       FROM servers
       ORDER BY name ASC`
    )
    .all() as ServerRow[];
  db.close();
  return rows;
}

/** Configure page — lets users select servers, pick a client, and generate a config file. */
export default function ConfigurePage() {
  const servers = getConfigureServers();

  return (
    <main className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Configure Your MCP Setup
        </h1>
        <p className="text-muted-foreground text-base">
          Select servers and generate a ready-to-use configuration file
        </p>
      </div>
      <ConfigureContent servers={servers} />
    </main>
  );
}
