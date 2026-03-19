import Database from "better-sqlite3";
import path from "path";
import type {
  Server,
  ServerDetail,
  Category,
  Tool,
  ServerConfig,
  ServerListParams,
  PaginatedResult,
} from "./types";

const DB_PATH = path.join(process.cwd(), "mcphub.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      github_url TEXT NOT NULL,
      npm_package TEXT,
      stars INTEGER DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'TypeScript',
      transport TEXT NOT NULL DEFAULT 'stdio',
      auth_type TEXT NOT NULL DEFAULT 'none',
      security_score INTEGER DEFAULT 50,
      install_command TEXT NOT NULL DEFAULT '',
      logo_url TEXT,
      is_official INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'folder'
    );

    CREATE TABLE IF NOT EXISTS server_categories (
      server_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (server_id, category_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      input_schema TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS server_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      client_type TEXT NOT NULL,
      config_json TEXT NOT NULL,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_servers_slug ON servers(slug);
    CREATE INDEX IF NOT EXISTS idx_servers_stars ON servers(stars DESC);
    CREATE INDEX IF NOT EXISTS idx_servers_security ON servers(security_score DESC);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_tools_server ON tools(server_id);
    CREATE INDEX IF NOT EXISTS idx_configs_server ON server_configs(server_id);
  `);
}

export function getAllServers(params: ServerListParams = {}): PaginatedResult<Server> {
  const db = getDb();
  const {
    category,
    language,
    transport,
    auth_type,
    sort = "stars",
    page = 1,
    limit = 24,
  } = params;

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (category) {
    conditions.push(`
      s.id IN (
        SELECT sc.server_id FROM server_categories sc
        JOIN categories c ON c.id = sc.category_id
        WHERE c.slug = ?
      )
    `);
    bindings.push(category);
  }
  if (language) {
    conditions.push("s.language = ?");
    bindings.push(language);
  }
  if (transport) {
    conditions.push("s.transport = ?");
    bindings.push(transport);
  }
  if (auth_type) {
    conditions.push("s.auth_type = ?");
    bindings.push(auth_type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderMap: Record<string, string> = {
    stars: "s.stars DESC",
    newest: "s.created_at DESC",
    security: "s.security_score DESC",
    name: "s.name ASC",
  };
  const orderBy = orderMap[sort] ?? "s.stars DESC";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM servers s ${where}`)
    .get(...bindings) as { total: number };
  const total = countRow.total;

  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `SELECT s.* FROM servers s ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...bindings, limit, offset) as Server[];

  return {
    data: rows.map(normalizeServer),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getServerBySlug(slug: string): ServerDetail | null {
  const db = getDb();

  const server = db
    .prepare("SELECT * FROM servers WHERE slug = ?")
    .get(slug) as Server | undefined;

  if (!server) return null;

  const categories = db
    .prepare(
      `SELECT c.* FROM categories c
       JOIN server_categories sc ON sc.category_id = c.id
       WHERE sc.server_id = ?`
    )
    .all(server.id) as Category[];

  const tools = db
    .prepare("SELECT * FROM tools WHERE server_id = ?")
    .all(server.id) as Tool[];

  const configs = db
    .prepare("SELECT * FROM server_configs WHERE server_id = ?")
    .all(server.id) as ServerConfig[];

  return {
    ...normalizeServer(server),
    categories,
    tools,
    configs,
  };
}

export function getFeaturedServers(limit = 8): Server[] {
  const db = getDb();
  return (
    db
      .prepare(
        "SELECT * FROM servers WHERE is_featured = 1 ORDER BY stars DESC LIMIT ?"
      )
      .all(limit) as Server[]
  ).map(normalizeServer);
}

export function getTrendingServers(limit = 12): Server[] {
  const db = getDb();
  return (
    db
      .prepare("SELECT * FROM servers ORDER BY stars DESC LIMIT ?")
      .all(limit) as Server[]
  ).map(normalizeServer);
}

export function getAllCategories(): Category[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, COUNT(sc.server_id) as server_count
       FROM categories c
       LEFT JOIN server_categories sc ON sc.category_id = c.id
       GROUP BY c.id
       ORDER BY server_count DESC`
    )
    .all() as Category[];
}

export function getServersByCategory(categorySlug: string): Server[] {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT s.* FROM servers s
         JOIN server_categories sc ON sc.server_id = s.id
         JOIN categories c ON c.id = sc.category_id
         WHERE c.slug = ?
         ORDER BY s.stars DESC`
      )
      .all(categorySlug) as Server[]
  ).map(normalizeServer);
}

export function searchServers(query: string): Server[] {
  const db = getDb();
  const pattern = `%${query}%`;
  return (
    db
      .prepare(
        `SELECT * FROM servers
         WHERE name LIKE ? OR description LIKE ? OR short_description LIKE ?
         ORDER BY stars DESC LIMIT 20`
      )
      .all(pattern, pattern, pattern) as Server[]
  ).map(normalizeServer);
}

export function getStats(): { servers: number; categories: number; tools: number } {
  const db = getDb();
  const servers = (
    db.prepare("SELECT COUNT(*) as c FROM servers").get() as { c: number }
  ).c;
  const categories = (
    db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }
  ).c;
  const tools = (
    db.prepare("SELECT COUNT(*) as c FROM tools").get() as { c: number }
  ).c;
  return { servers, categories, tools };
}

export function insertServer(
  server: Omit<Server, "id" | "created_at" | "updated_at">
): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO servers (name, slug, description, short_description, github_url,
        npm_package, stars, language, transport, auth_type, security_score,
        install_command, logo_url, is_official, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      server.name,
      server.slug,
      server.description,
      server.short_description,
      server.github_url,
      server.npm_package,
      server.stars,
      server.language,
      server.transport,
      server.auth_type,
      server.security_score,
      server.install_command,
      server.logo_url,
      server.is_official ? 1 : 0,
      server.is_featured ? 1 : 0
    );
  return result.lastInsertRowid as number;
}

export function insertCategory(
  category: Omit<Category, "id" | "server_count">
): number {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)"
    )
    .run(category.name, category.slug, category.description, category.icon);
  if (result.changes === 0) {
    const existing = db
      .prepare("SELECT id FROM categories WHERE slug = ?")
      .get(category.slug) as { id: number };
    return existing.id;
  }
  return result.lastInsertRowid as number;
}

export function linkServerCategory(serverId: number, categoryId: number): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO server_categories (server_id, category_id) VALUES (?, ?)"
  ).run(serverId, categoryId);
}

export function insertTool(tool: Omit<Tool, "id">): number {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO tools (server_id, name, description, input_schema) VALUES (?, ?, ?, ?)"
    )
    .run(tool.server_id, tool.name, tool.description, tool.input_schema);
  return result.lastInsertRowid as number;
}

export function insertServerConfig(config: Omit<ServerConfig, "id">): number {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO server_configs (server_id, client_type, config_json) VALUES (?, ?, ?)"
    )
    .run(config.server_id, config.client_type, config.config_json);
  return result.lastInsertRowid as number;
}

export function getDistinctLanguages(): string[] {
  const db = getDb();
  return (
    db
      .prepare("SELECT DISTINCT language FROM servers ORDER BY language")
      .all() as { language: string }[]
  ).map((r) => r.language);
}

export function getDistinctTransports(): string[] {
  const db = getDb();
  return (
    db
      .prepare("SELECT DISTINCT transport FROM servers ORDER BY transport")
      .all() as { transport: string }[]
  ).map((r) => r.transport);
}

export function getDistinctAuthTypes(): string[] {
  const db = getDb();
  return (
    db
      .prepare("SELECT DISTINCT auth_type FROM servers ORDER BY auth_type")
      .all() as { auth_type: string }[]
  ).map((r) => r.auth_type);
}

export function getCategoriesForServer(serverId: number): Category[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.* FROM categories c
       JOIN server_categories sc ON sc.category_id = c.id
       WHERE sc.server_id = ?`
    )
    .all(serverId) as Category[];
}

function normalizeServer(row: Server): Server {
  return {
    ...row,
    is_official: Boolean(row.is_official),
    is_featured: Boolean(row.is_featured),
  };
}
