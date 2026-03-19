/**
 * Seed script for MCPHub database.
 * Drops all existing data and re-inserts 12 categories and 50 MCP servers.
 * Run from project root: npx tsx scripts/seed.ts
 */

import Database from "better-sqlite3";
import path from "path";
import {
  insertServer,
  insertCategory,
  linkServerCategory,
  insertTool,
  insertServerConfig,
} from "../src/lib/db";

// ---------------------------------------------------------------------------
// Types used only in this script
// ---------------------------------------------------------------------------

interface ToolDef {
  name: string;
  description: string;
  input_schema: string;
}

interface ServerDef {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  github_url: string;
  npm_package: string | null;
  stars: number;
  language: string;
  transport: string;
  auth_type: string;
  security_score: number;
  install_command: string;
  logo_url: string | null;
  is_official: boolean;
  is_featured: boolean;
  categories: string[];
  tools: ToolDef[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal JSON schema for a list of required string properties. */
function schema(...props: string[]): string {
  const properties: Record<string, { type: string; description: string }> = {};
  for (const p of props) {
    properties[p] = { type: "string", description: p.replace(/_/g, " ") };
  }
  return JSON.stringify({
    type: "object",
    properties,
    required: props,
  });
}

/** Produce the five client configs for an npx-based server. */
function npxConfigs(pkg: string, extraArgs: string[] = []) {
  const args = ["-y", pkg, ...extraArgs];
  const base = { command: "npx", args };
  return base;
}

/** Produce the five client configs for a uvx-based server. */
function uvxConfigs(pkg: string) {
  return { command: "uvx", args: [pkg] };
}

/** Produce the five client configs for a docker-based server. */
function dockerConfigs(image: string) {
  return { command: "docker", args: ["run", "-i", "--rm", image] };
}

type RunCmd = ReturnType<typeof npxConfigs>;

function buildConfigs(runCmd: RunCmd, serverName: string) {
  const clients = [
    "claude_desktop",
    "claude_code",
    "cursor",
    "windsurf",
    "vscode",
  ] as const;

  return clients.map((client) => ({
    client_type: client,
    config_json: JSON.stringify({
      mcpServers: {
        [serverName]: runCmd,
      },
    }),
  }));
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    name: "Developer Tools",
    slug: "developer-tools",
    description: "Tools for software development workflows",
    icon: "code",
  },
  {
    name: "Cloud & Infrastructure",
    slug: "cloud-infrastructure",
    description: "Cloud providers, infrastructure as code, and platform tools",
    icon: "cloud",
  },
  {
    name: "Databases",
    slug: "databases",
    description: "SQL, NoSQL, and analytical database integrations",
    icon: "database",
  },
  {
    name: "Communication",
    slug: "communication",
    description: "Messaging, chat, and collaboration platforms",
    icon: "message-circle",
  },
  {
    name: "Productivity",
    slug: "productivity",
    description: "Project management and productivity applications",
    icon: "zap",
  },
  {
    name: "Search & Web",
    slug: "search-web",
    description: "Web search, scraping, and browser automation",
    icon: "search",
  },
  {
    name: "DevOps & Monitoring",
    slug: "devops-monitoring",
    description: "CI/CD, observability, and incident management",
    icon: "activity",
  },
  {
    name: "AI & ML",
    slug: "ai-ml",
    description: "Machine learning, embeddings, and AI utilities",
    icon: "cpu",
  },
  {
    name: "File Systems",
    slug: "file-systems",
    description: "Local and remote file system operations",
    icon: "folder",
  },
  {
    name: "Version Control",
    slug: "version-control",
    description: "Git and source control operations",
    icon: "git-branch",
  },
  {
    name: "Design",
    slug: "design",
    description: "Design tools and asset management",
    icon: "pen-tool",
  },
  {
    name: "Business Tools",
    slug: "business-tools",
    description: "CRM, payments, and business operations",
    icon: "briefcase",
  },
];

// ---------------------------------------------------------------------------
// Server definitions
// ---------------------------------------------------------------------------

const SERVERS: ServerDef[] = [
  // 1
  {
    name: "GitHub MCP",
    slug: "github",
    description:
      "Official GitHub MCP server for complete repository management including issues, pull requests, code search, and file operations via the GitHub REST API.",
    short_description: "Official GitHub server for repository management",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-github",
    stars: 12500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 95,
    install_command: "npx @modelcontextprotocol/server-github",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["developer-tools", "version-control"],
    tools: [
      {
        name: "create_repository",
        description: "Create a new GitHub repository",
        input_schema: schema("name", "description", "private"),
      },
      {
        name: "search_repositories",
        description: "Search GitHub repositories",
        input_schema: schema("query"),
      },
      {
        name: "get_file_contents",
        description: "Get contents of a file in a repository",
        input_schema: schema("owner", "repo", "path"),
      },
      {
        name: "create_issue",
        description: "Create a new issue in a repository",
        input_schema: schema("owner", "repo", "title", "body"),
      },
      {
        name: "create_pull_request",
        description: "Create a pull request",
        input_schema: schema("owner", "repo", "title", "head", "base"),
      },
    ],
  },

  // 2
  {
    name: "Filesystem MCP",
    slug: "filesystem",
    description:
      "Secure file system operations with configurable access controls. Supports reading, writing, moving, and searching files within allowed directories.",
    short_description: "Secure file operations with configurable access controls",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-filesystem",
    stars: 11200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 90,
    install_command: "npx @modelcontextprotocol/server-filesystem /path",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["file-systems"],
    tools: [
      {
        name: "read_file",
        description: "Read the contents of a file",
        input_schema: schema("path"),
      },
      {
        name: "write_file",
        description: "Write content to a file",
        input_schema: schema("path", "content"),
      },
      {
        name: "list_directory",
        description: "List files and directories in a path",
        input_schema: schema("path"),
      },
      {
        name: "search_files",
        description: "Search for files matching a pattern",
        input_schema: schema("path", "pattern"),
      },
      {
        name: "move_file",
        description: "Move or rename a file",
        input_schema: schema("source", "destination"),
      },
    ],
  },

  // 3
  {
    name: "PostgreSQL MCP",
    slug: "postgresql",
    description:
      "Read-only PostgreSQL database access with full schema inspection. Execute queries and explore table structures without write access.",
    short_description: "Read-only database access with schema inspection",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-postgres",
    stars: 8900,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 85,
    install_command: "npx @modelcontextprotocol/server-postgres postgresql://localhost/db",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["databases"],
    tools: [
      {
        name: "query",
        description: "Execute a read-only SQL query",
        input_schema: schema("sql"),
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        input_schema: schema("schema"),
      },
      {
        name: "describe_table",
        description: "Get the schema of a specific table",
        input_schema: schema("table_name"),
      },
    ],
  },

  // 4
  {
    name: "Google Drive MCP",
    slug: "google-drive",
    description:
      "Search, read, and list files from Google Drive. Supports Google Docs, Sheets, and binary files via OAuth authentication.",
    short_description: "Search and access Google Drive files",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-gdrive",
    stars: 7200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "oauth",
    security_score: 88,
    install_command: "npx @modelcontextprotocol/server-gdrive",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["productivity", "file-systems"],
    tools: [
      {
        name: "search_files",
        description: "Search for files in Google Drive",
        input_schema: schema("query"),
      },
      {
        name: "read_file",
        description: "Read the contents of a Drive file",
        input_schema: schema("file_id"),
      },
      {
        name: "list_files",
        description: "List files in a folder",
        input_schema: schema("folder_id"),
      },
    ],
  },

  // 5
  {
    name: "Slack MCP",
    slug: "slack",
    description:
      "Interact with Slack workspaces: manage channels, post messages, search message history, and retrieve conversation threads.",
    short_description: "Channel management and messaging for Slack",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-slack",
    stars: 6800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 85,
    install_command: "npx @modelcontextprotocol/server-slack",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "list_channels",
        description: "List all channels in a workspace",
        input_schema: schema("limit"),
      },
      {
        name: "post_message",
        description: "Post a message to a channel",
        input_schema: schema("channel", "text"),
      },
      {
        name: "search_messages",
        description: "Search messages across the workspace",
        input_schema: schema("query"),
      },
      {
        name: "get_channel_history",
        description: "Get message history for a channel",
        input_schema: schema("channel_id", "limit"),
      },
    ],
  },

  // 6
  {
    name: "Docker MCP",
    slug: "docker",
    description:
      "Manage Docker containers and images: list and run containers, build images, and manage volumes via the Docker Engine API.",
    short_description: "Container and image management",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: null,
    stars: 5600,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 82,
    install_command: "npx @modelcontextprotocol/server-docker",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["devops-monitoring", "cloud-infrastructure"],
    tools: [
      {
        name: "list_containers",
        description: "List running and stopped containers",
        input_schema: schema("all"),
      },
      {
        name: "run_container",
        description: "Start a new container from an image",
        input_schema: schema("image", "name"),
      },
      {
        name: "build_image",
        description: "Build a Docker image from a Dockerfile",
        input_schema: schema("context_path", "tag"),
      },
      {
        name: "manage_volumes",
        description: "List, create, or remove Docker volumes",
        input_schema: schema("action", "volume_name"),
      },
    ],
  },

  // 7
  {
    name: "Brave Search MCP",
    slug: "brave-search",
    description:
      "Web and local search powered by the Brave Search API. Provides privacy-focused web search and local business search results.",
    short_description: "Web and local search via Brave Search API",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-brave-search",
    stars: 9500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 92,
    install_command: "npx @modelcontextprotocol/server-brave-search",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["search-web"],
    tools: [
      {
        name: "brave_web_search",
        description: "Perform a web search using Brave Search",
        input_schema: schema("query", "count"),
      },
      {
        name: "brave_local_search",
        description: "Search for local businesses and places",
        input_schema: schema("query", "location"),
      },
    ],
  },

  // 8
  {
    name: "Puppeteer MCP",
    slug: "puppeteer",
    description:
      "Browser automation and web scraping using Puppeteer. Navigate pages, take screenshots, click elements, fill forms, and evaluate JavaScript.",
    short_description: "Browser automation and web scraping",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-puppeteer",
    stars: 7800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 78,
    install_command: "npx @modelcontextprotocol/server-puppeteer",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["search-web", "developer-tools"],
    tools: [
      {
        name: "navigate",
        description: "Navigate to a URL in the browser",
        input_schema: schema("url"),
      },
      {
        name: "screenshot",
        description: "Capture a screenshot of the current page",
        input_schema: schema("path"),
      },
      {
        name: "click",
        description: "Click on an element",
        input_schema: schema("selector"),
      },
      {
        name: "fill",
        description: "Fill a form input with a value",
        input_schema: schema("selector", "value"),
      },
      {
        name: "evaluate",
        description: "Evaluate JavaScript in the browser context",
        input_schema: schema("expression"),
      },
    ],
  },

  // 9
  {
    name: "SQLite MCP",
    slug: "sqlite",
    description:
      "Full SQLite database operations including read/write queries, table creation, and schema inspection for local SQLite files.",
    short_description: "SQLite database operations",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-sqlite",
    stars: 6200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 88,
    install_command: "npx @modelcontextprotocol/server-sqlite /path/to/db",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["databases"],
    tools: [
      {
        name: "read_query",
        description: "Execute a read-only SELECT query",
        input_schema: schema("query"),
      },
      {
        name: "write_query",
        description: "Execute an INSERT, UPDATE, or DELETE query",
        input_schema: schema("query"),
      },
      {
        name: "create_table",
        description: "Create a new table",
        input_schema: schema("query"),
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        input_schema: "{}",
      },
      {
        name: "describe_table",
        description: "Get column info for a table",
        input_schema: schema("table_name"),
      },
    ],
  },

  // 10
  {
    name: "Sentry MCP",
    slug: "sentry",
    description:
      "Integrate with Sentry to list, search, and inspect error issues and events for performance monitoring and error tracking.",
    short_description: "Error tracking and performance monitoring",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-sentry",
    stars: 4200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 80,
    install_command: "npx @modelcontextprotocol/server-sentry",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["devops-monitoring"],
    tools: [
      {
        name: "list_issues",
        description: "List issues in a Sentry project",
        input_schema: schema("organization_slug", "project_slug"),
      },
      {
        name: "get_issue",
        description: "Get details about a specific issue",
        input_schema: schema("issue_id"),
      },
      {
        name: "search_issues",
        description: "Search issues by query",
        input_schema: schema("organization_slug", "query"),
      },
      {
        name: "get_event",
        description: "Get a specific event for an issue",
        input_schema: schema("issue_id", "event_id"),
      },
    ],
  },

  // 11
  {
    name: "Google Maps MCP",
    slug: "google-maps",
    description:
      "Geocoding, turn-by-turn directions, and places search via the Google Maps Platform APIs.",
    short_description: "Geocoding, directions and places via Google Maps",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-google-maps",
    stars: 5100,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 85,
    install_command: "npx @modelcontextprotocol/server-google-maps",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["search-web"],
    tools: [
      {
        name: "geocode",
        description: "Convert an address to coordinates",
        input_schema: schema("address"),
      },
      {
        name: "directions",
        description: "Get directions between two locations",
        input_schema: schema("origin", "destination", "mode"),
      },
      {
        name: "search_places",
        description: "Search for places near a location",
        input_schema: schema("query", "location"),
      },
      {
        name: "place_details",
        description: "Get details about a place by ID",
        input_schema: schema("place_id"),
      },
    ],
  },

  // 12
  {
    name: "Memory MCP",
    slug: "memory",
    description:
      "Knowledge graph-based persistent memory using a local graph store. Create entities, define relations, and search the knowledge graph across sessions.",
    short_description: "Knowledge graph-based persistent memory",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-memory",
    stars: 8200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 90,
    install_command: "npx @modelcontextprotocol/server-memory",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["ai-ml"],
    tools: [
      {
        name: "create_entities",
        description: "Create new entities in the knowledge graph",
        input_schema: schema("entities"),
      },
      {
        name: "create_relations",
        description: "Create relations between entities",
        input_schema: schema("relations"),
      },
      {
        name: "search_nodes",
        description: "Search nodes in the knowledge graph",
        input_schema: schema("query"),
      },
      {
        name: "open_nodes",
        description: "Open specific nodes by name",
        input_schema: schema("names"),
      },
    ],
  },

  // 13
  {
    name: "Fetch MCP",
    slug: "fetch",
    description:
      "Make HTTP requests and extract web content. Fetch raw HTML, parsed text, or JSON from any URL with configurable headers and methods.",
    short_description: "HTTP requests and web content extraction",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-fetch",
    stars: 7100,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 85,
    install_command: "npx @modelcontextprotocol/server-fetch",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["search-web"],
    tools: [
      {
        name: "fetch_url",
        description: "Fetch a URL and return the raw response",
        input_schema: schema("url", "method"),
      },
      {
        name: "fetch_html",
        description: "Fetch a URL and return cleaned HTML",
        input_schema: schema("url"),
      },
      {
        name: "fetch_json",
        description: "Fetch a URL and return parsed JSON",
        input_schema: schema("url"),
      },
      {
        name: "fetch_text",
        description: "Fetch a URL and return plain text",
        input_schema: schema("url"),
      },
    ],
  },

  // 14
  {
    name: "Sequential Thinking MCP",
    slug: "sequential-thinking",
    description:
      "Dynamic problem-solving through structured thought sequences. Enables step-by-step reasoning with revision and branching of thought chains.",
    short_description: "Dynamic problem-solving through thought sequences",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-sequential-thinking",
    stars: 6500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 92,
    install_command: "npx @modelcontextprotocol/server-sequential-thinking",
    logo_url: null,
    is_official: true,
    is_featured: true,
    categories: ["ai-ml"],
    tools: [
      {
        name: "sequentialthinking",
        description: "Process a problem step by step using sequential thinking",
        input_schema: schema("thought", "next_thought_needed", "thought_number", "total_thoughts"),
      },
    ],
  },

  // 15
  {
    name: "Linear MCP",
    slug: "linear",
    description:
      "Integrate with Linear for project management: list, create, update, and search issues and projects.",
    short_description: "Project management with Linear",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-linear",
    stars: 3800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 82,
    install_command: "npx @modelcontextprotocol/server-linear",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity", "business-tools"],
    tools: [
      {
        name: "list_issues",
        description: "List issues in a team or project",
        input_schema: schema("team_id"),
      },
      {
        name: "create_issue",
        description: "Create a new issue",
        input_schema: schema("team_id", "title", "description"),
      },
      {
        name: "update_issue",
        description: "Update an existing issue",
        input_schema: schema("issue_id", "title", "state"),
      },
      {
        name: "search_issues",
        description: "Search issues by query",
        input_schema: schema("query"),
      },
      {
        name: "list_projects",
        description: "List all projects",
        input_schema: schema("team_id"),
      },
    ],
  },

  // 16
  {
    name: "Notion MCP",
    slug: "notion",
    description:
      "Full Notion workspace integration: search pages, read and create content, query databases, and update existing pages.",
    short_description: "Notion workspace integration",
    github_url: "https://github.com/makenotion/notion-mcp-server",
    npm_package: "@notionhq/notion-mcp-server",
    stars: 4500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 85,
    install_command: "npx @notionhq/notion-mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity"],
    tools: [
      {
        name: "search_pages",
        description: "Search pages in Notion",
        input_schema: schema("query"),
      },
      {
        name: "read_page",
        description: "Read the content of a Notion page",
        input_schema: schema("page_id"),
      },
      {
        name: "create_page",
        description: "Create a new Notion page",
        input_schema: schema("parent_id", "title", "content"),
      },
      {
        name: "update_page",
        description: "Update an existing page",
        input_schema: schema("page_id", "properties"),
      },
      {
        name: "query_database",
        description: "Query a Notion database",
        input_schema: schema("database_id", "filter"),
      },
    ],
  },

  // 17
  {
    name: "Vercel MCP",
    slug: "vercel",
    description:
      "Manage Vercel deployments and projects: list deployments, fetch build logs, and inspect project configuration.",
    short_description: "Deployment and project management via Vercel",
    github_url: "https://github.com/vercel/mcp-server",
    npm_package: "@vercel/mcp-server",
    stars: 3200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 88,
    install_command: "npx @vercel/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "devops-monitoring"],
    tools: [
      {
        name: "list_deployments",
        description: "List recent deployments",
        input_schema: schema("project_id", "limit"),
      },
      {
        name: "get_deployment",
        description: "Get details of a specific deployment",
        input_schema: schema("deployment_id"),
      },
      {
        name: "list_projects",
        description: "List all projects in the team",
        input_schema: schema("team_id"),
      },
      {
        name: "get_logs",
        description: "Get build or runtime logs",
        input_schema: schema("deployment_id"),
      },
    ],
  },

  // 18
  {
    name: "Cloudflare MCP",
    slug: "cloudflare",
    description:
      "Manage Cloudflare Workers, KV namespaces, and R2 buckets through the Cloudflare API.",
    short_description: "Workers, KV, and R2 management via Cloudflare",
    github_url: "https://github.com/cloudflare/mcp-server-cloudflare",
    npm_package: "@cloudflare/mcp-server-cloudflare",
    stars: 3500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 86,
    install_command: "npx @cloudflare/mcp-server-cloudflare",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure"],
    tools: [
      {
        name: "list_workers",
        description: "List all Cloudflare Workers",
        input_schema: schema("account_id"),
      },
      {
        name: "deploy_worker",
        description: "Deploy a Worker script",
        input_schema: schema("account_id", "name", "script"),
      },
      {
        name: "manage_kv",
        description: "Read/write Cloudflare KV values",
        input_schema: schema("account_id", "namespace_id", "key", "value"),
      },
      {
        name: "manage_r2",
        description: "List or manage R2 bucket objects",
        input_schema: schema("account_id", "bucket_name"),
      },
    ],
  },

  // 19
  {
    name: "AWS Knowledge Bases MCP",
    slug: "aws-kb-retrieval",
    description:
      "Retrieve information from AWS Bedrock Knowledge Bases to augment AI responses with enterprise data.",
    short_description: "AWS Bedrock knowledge base retrieval",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-aws-kb-retrieval",
    stars: 2800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 80,
    install_command: "npx @modelcontextprotocol/server-aws-kb-retrieval",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "ai-ml"],
    tools: [
      {
        name: "retrieve_from_kb",
        description: "Retrieve relevant documents from a knowledge base",
        input_schema: schema("knowledge_base_id", "query", "max_results"),
      },
      {
        name: "list_knowledge_bases",
        description: "List available knowledge bases",
        input_schema: "{}",
      },
    ],
  },

  // 20
  {
    name: "Playwright MCP",
    slug: "playwright",
    description:
      "Cross-browser automation and end-to-end testing via Microsoft Playwright. Supports Chromium, Firefox, and WebKit.",
    short_description: "Browser testing and automation via Playwright",
    github_url: "https://github.com/microsoft/playwright-mcp",
    npm_package: "@playwright/mcp-server",
    stars: 5200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 90,
    install_command: "npx @playwright/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["developer-tools", "search-web"],
    tools: [
      {
        name: "navigate",
        description: "Navigate to a URL",
        input_schema: schema("url"),
      },
      {
        name: "click",
        description: "Click on an element",
        input_schema: schema("selector"),
      },
      {
        name: "fill",
        description: "Fill an input field",
        input_schema: schema("selector", "value"),
      },
      {
        name: "screenshot",
        description: "Take a screenshot",
        input_schema: schema("path"),
      },
      {
        name: "get_text",
        description: "Get text content of an element",
        input_schema: schema("selector"),
      },
      {
        name: "select_option",
        description: "Select an option from a dropdown",
        input_schema: schema("selector", "value"),
      },
    ],
  },

  // 21
  {
    name: "Git MCP",
    slug: "git",
    description:
      "Git repository operations: status, diff, log, commit, and branch management for local repositories.",
    short_description: "Git repository operations",
    github_url: "https://github.com/modelcontextprotocol/servers",
    npm_package: "@modelcontextprotocol/server-git",
    stars: 5800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 88,
    install_command: "npx @modelcontextprotocol/server-git",
    logo_url: null,
    is_official: true,
    is_featured: false,
    categories: ["version-control", "developer-tools"],
    tools: [
      {
        name: "git_status",
        description: "Get the working tree status",
        input_schema: schema("repo_path"),
      },
      {
        name: "git_diff",
        description: "Show changes between commits or working tree",
        input_schema: schema("repo_path", "target"),
      },
      {
        name: "git_log",
        description: "Show the commit history",
        input_schema: schema("repo_path", "max_count"),
      },
      {
        name: "git_commit",
        description: "Create a new commit",
        input_schema: schema("repo_path", "message"),
      },
      {
        name: "git_branch",
        description: "List, create, or switch branches",
        input_schema: schema("repo_path", "action", "branch_name"),
      },
    ],
  },

  // 22
  {
    name: "Stripe MCP",
    slug: "stripe",
    description:
      "Interact with the Stripe payments API to create payment intents, manage customers, generate invoices, and check account balance.",
    short_description: "Payment processing via Stripe API",
    github_url: "https://github.com/stripe/agent-toolkit",
    npm_package: "@stripe/mcp-server",
    stars: 2400,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 92,
    install_command: "npx @stripe/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["business-tools"],
    tools: [
      {
        name: "create_payment_intent",
        description: "Create a new payment intent",
        input_schema: schema("amount", "currency", "customer"),
      },
      {
        name: "list_customers",
        description: "List Stripe customers",
        input_schema: schema("limit", "email"),
      },
      {
        name: "create_invoice",
        description: "Create an invoice for a customer",
        input_schema: schema("customer", "auto_advance"),
      },
      {
        name: "get_balance",
        description: "Get the Stripe account balance",
        input_schema: "{}",
      },
    ],
  },

  // 23
  {
    name: "Twilio MCP",
    slug: "twilio",
    description:
      "Send SMS and make voice calls via the Twilio API. List message history and manage account information.",
    short_description: "SMS, voice and messaging via Twilio",
    github_url: "https://github.com/twilio/mcp-server",
    npm_package: "@twilio/mcp-server",
    stars: 1800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 80,
    install_command: "npx @twilio/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "send_sms",
        description: "Send an SMS message",
        input_schema: schema("to", "from", "body"),
      },
      {
        name: "make_call",
        description: "Initiate a voice call",
        input_schema: schema("to", "from", "url"),
      },
      {
        name: "list_messages",
        description: "List sent/received messages",
        input_schema: schema("limit"),
      },
      {
        name: "get_account_info",
        description: "Get Twilio account details",
        input_schema: "{}",
      },
    ],
  },

  // 24
  {
    name: "Supabase MCP",
    slug: "supabase",
    description:
      "Full Supabase integration: query the Postgres database, manage auth users, upload files to storage, and list buckets.",
    short_description: "Database, auth, and storage via Supabase",
    github_url: "https://github.com/supabase/mcp-server",
    npm_package: "@supabase/mcp-server",
    stars: 3100,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 85,
    install_command: "npx @supabase/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["databases", "cloud-infrastructure"],
    tools: [
      {
        name: "query_database",
        description: "Execute a SQL query on the Supabase database",
        input_schema: schema("query"),
      },
      {
        name: "manage_auth_users",
        description: "List or manage authentication users",
        input_schema: schema("action", "user_id"),
      },
      {
        name: "upload_file",
        description: "Upload a file to Supabase Storage",
        input_schema: schema("bucket", "path", "file_path"),
      },
      {
        name: "list_buckets",
        description: "List all storage buckets",
        input_schema: "{}",
      },
    ],
  },

  // 25
  {
    name: "MongoDB MCP",
    slug: "mongodb",
    description:
      "Document database operations for MongoDB: find, insert, update documents, run aggregation pipelines, and list collections.",
    short_description: "Document database operations via MongoDB",
    github_url: "https://github.com/mongodb/mcp-server",
    npm_package: "@mongodb/mcp-server",
    stars: 2200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 82,
    install_command: "npx @mongodb/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["databases"],
    tools: [
      {
        name: "find_documents",
        description: "Find documents matching a query",
        input_schema: schema("collection", "filter", "limit"),
      },
      {
        name: "insert_document",
        description: "Insert a new document",
        input_schema: schema("collection", "document"),
      },
      {
        name: "update_document",
        description: "Update documents matching a filter",
        input_schema: schema("collection", "filter", "update"),
      },
      {
        name: "aggregate",
        description: "Run an aggregation pipeline",
        input_schema: schema("collection", "pipeline"),
      },
      {
        name: "list_collections",
        description: "List all collections in the database",
        input_schema: "{}",
      },
    ],
  },

  // 26
  {
    name: "Redis MCP",
    slug: "redis",
    description:
      "In-memory data store operations for Redis: get, set, delete keys, list patterns, and execute arbitrary commands.",
    short_description: "In-memory data store operations via Redis",
    github_url: "https://github.com/redis/mcp-server",
    npm_package: "@redis/mcp-server",
    stars: 1900,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 84,
    install_command: "npx @redis/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["databases"],
    tools: [
      {
        name: "get_key",
        description: "Get the value of a Redis key",
        input_schema: schema("key"),
      },
      {
        name: "set_key",
        description: "Set a Redis key-value pair",
        input_schema: schema("key", "value", "ttl"),
      },
      {
        name: "delete_key",
        description: "Delete a Redis key",
        input_schema: schema("key"),
      },
      {
        name: "list_keys",
        description: "List keys matching a pattern",
        input_schema: schema("pattern"),
      },
      {
        name: "execute_command",
        description: "Execute an arbitrary Redis command",
        input_schema: schema("command", "args"),
      },
    ],
  },

  // 27
  {
    name: "Snowflake MCP",
    slug: "snowflake",
    description:
      "Query the Snowflake cloud data warehouse, list databases and schemas, and describe table structures.",
    short_description: "Cloud data warehouse queries via Snowflake",
    github_url: "https://github.com/snowflakedb/mcp-server",
    npm_package: "@snowflakedb/mcp-server",
    stars: 1500,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 80,
    install_command: "npx @snowflakedb/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["databases", "cloud-infrastructure"],
    tools: [
      {
        name: "run_query",
        description: "Execute a SQL query",
        input_schema: schema("query", "database", "schema"),
      },
      {
        name: "list_databases",
        description: "List all accessible databases",
        input_schema: "{}",
      },
      {
        name: "list_schemas",
        description: "List schemas in a database",
        input_schema: schema("database"),
      },
      {
        name: "describe_table",
        description: "Describe a table's structure",
        input_schema: schema("database", "schema", "table"),
      },
    ],
  },

  // 28
  {
    name: "BigQuery MCP",
    slug: "bigquery",
    description:
      "Run analytics queries on Google BigQuery, list datasets and tables, and inspect schemas.",
    short_description: "Google BigQuery analytics integration",
    github_url: "https://github.com/google/mcp-bigquery",
    npm_package: "@google/mcp-bigquery",
    stars: 1700,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "oauth",
    security_score: 82,
    install_command: "npx @google/mcp-bigquery",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["databases", "cloud-infrastructure"],
    tools: [
      {
        name: "run_query",
        description: "Run a BigQuery SQL query",
        input_schema: schema("query", "project_id"),
      },
      {
        name: "list_datasets",
        description: "List datasets in a project",
        input_schema: schema("project_id"),
      },
      {
        name: "list_tables",
        description: "List tables in a dataset",
        input_schema: schema("project_id", "dataset_id"),
      },
      {
        name: "get_schema",
        description: "Get table schema",
        input_schema: schema("project_id", "dataset_id", "table_id"),
      },
    ],
  },

  // 29
  {
    name: "S3 MCP",
    slug: "s3",
    description:
      "AWS S3 object storage operations: list buckets, get, put, and delete objects.",
    short_description: "AWS S3 object storage operations",
    github_url: "https://github.com/aws/mcp-server-s3",
    npm_package: "@aws/mcp-server-s3",
    stars: 2000,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 85,
    install_command: "npx @aws/mcp-server-s3",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "file-systems"],
    tools: [
      {
        name: "list_buckets",
        description: "List all S3 buckets",
        input_schema: "{}",
      },
      {
        name: "get_object",
        description: "Download an object from S3",
        input_schema: schema("bucket", "key"),
      },
      {
        name: "put_object",
        description: "Upload an object to S3",
        input_schema: schema("bucket", "key", "body"),
      },
      {
        name: "delete_object",
        description: "Delete an object from S3",
        input_schema: schema("bucket", "key"),
      },
    ],
  },

  // 30
  {
    name: "Kubernetes MCP",
    slug: "kubernetes",
    description:
      "Kubernetes cluster management: list pods, retrieve logs, apply manifests, and scale deployments.",
    short_description: "Kubernetes cluster management",
    github_url: "https://github.com/kubernetes/mcp-server",
    npm_package: "@kubernetes/mcp-server",
    stars: 2600,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 78,
    install_command: "npx @kubernetes/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "devops-monitoring"],
    tools: [
      {
        name: "list_pods",
        description: "List pods in a namespace",
        input_schema: schema("namespace"),
      },
      {
        name: "get_pod_logs",
        description: "Get logs from a pod",
        input_schema: schema("namespace", "pod_name", "container"),
      },
      {
        name: "apply_manifest",
        description: "Apply a Kubernetes manifest",
        input_schema: schema("manifest_yaml"),
      },
      {
        name: "get_deployment",
        description: "Get deployment details",
        input_schema: schema("namespace", "deployment_name"),
      },
      {
        name: "scale_deployment",
        description: "Scale a deployment",
        input_schema: schema("namespace", "deployment_name", "replicas"),
      },
    ],
  },

  // 31
  {
    name: "Terraform MCP",
    slug: "terraform",
    description:
      "Infrastructure as code operations: plan, apply, inspect state, and list managed resources in Terraform workspaces.",
    short_description: "Infrastructure as code via Terraform",
    github_url: "https://github.com/hashicorp/mcp-server-terraform",
    npm_package: "@hashicorp/mcp-server-terraform",
    stars: 2100,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 80,
    install_command: "npx @hashicorp/mcp-server-terraform",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "devops-monitoring"],
    tools: [
      {
        name: "plan",
        description: "Run terraform plan",
        input_schema: schema("working_dir"),
      },
      {
        name: "apply",
        description: "Run terraform apply",
        input_schema: schema("working_dir", "auto_approve"),
      },
      {
        name: "show_state",
        description: "Show the current Terraform state",
        input_schema: schema("working_dir"),
      },
      {
        name: "list_resources",
        description: "List resources in state",
        input_schema: schema("working_dir"),
      },
    ],
  },

  // 32
  {
    name: "GraphQL MCP",
    slug: "graphql",
    description:
      "Explore and query GraphQL APIs: introspect schema, execute queries, and run mutations against any GraphQL endpoint.",
    short_description: "GraphQL API exploration and queries",
    github_url: "https://github.com/graphql/mcp-server",
    npm_package: "@graphql/mcp-server",
    stars: 1600,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "none",
    security_score: 82,
    install_command: "npx @graphql/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["developer-tools"],
    tools: [
      {
        name: "introspect_schema",
        description: "Introspect a GraphQL schema",
        input_schema: schema("endpoint"),
      },
      {
        name: "execute_query",
        description: "Execute a GraphQL query",
        input_schema: schema("endpoint", "query", "variables"),
      },
      {
        name: "execute_mutation",
        description: "Execute a GraphQL mutation",
        input_schema: schema("endpoint", "mutation", "variables"),
      },
    ],
  },

  // 33
  {
    name: "Jira MCP",
    slug: "jira",
    description:
      "Atlassian Jira integration: search, create, and update issues; get project details; list sprints.",
    short_description: "Atlassian Jira project management",
    github_url: "https://github.com/atlassian/mcp-server-jira",
    npm_package: "@atlassian/mcp-server-jira",
    stars: 2300,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 83,
    install_command: "npx @atlassian/mcp-server-jira",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity", "business-tools"],
    tools: [
      {
        name: "search_issues",
        description: "Search issues using JQL",
        input_schema: schema("jql", "max_results"),
      },
      {
        name: "create_issue",
        description: "Create a new Jira issue",
        input_schema: schema("project_key", "summary", "issue_type"),
      },
      {
        name: "update_issue",
        description: "Update an existing issue",
        input_schema: schema("issue_key", "fields"),
      },
      {
        name: "get_project",
        description: "Get project details",
        input_schema: schema("project_key"),
      },
      {
        name: "list_sprints",
        description: "List sprints in a board",
        input_schema: schema("board_id"),
      },
    ],
  },

  // 34
  {
    name: "Confluence MCP",
    slug: "confluence",
    description:
      "Atlassian Confluence wiki integration: search, read, create, and update pages in Confluence spaces.",
    short_description: "Atlassian Confluence wiki integration",
    github_url: "https://github.com/atlassian/mcp-server-confluence",
    npm_package: "@atlassian/mcp-server-confluence",
    stars: 1400,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 82,
    install_command: "npx @atlassian/mcp-server-confluence",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity"],
    tools: [
      {
        name: "search_pages",
        description: "Search Confluence pages with CQL",
        input_schema: schema("query"),
      },
      {
        name: "get_page",
        description: "Get a Confluence page by ID",
        input_schema: schema("page_id"),
      },
      {
        name: "create_page",
        description: "Create a new Confluence page",
        input_schema: schema("space_key", "title", "content"),
      },
      {
        name: "update_page",
        description: "Update an existing page",
        input_schema: schema("page_id", "title", "content", "version"),
      },
    ],
  },

  // 35
  {
    name: "Asana MCP",
    slug: "asana",
    description:
      "Task and project management with Asana: list, create, update tasks and projects, and search across workspaces.",
    short_description: "Task and project management via Asana",
    github_url: "https://github.com/asana/mcp-server",
    npm_package: "@asana/mcp-server",
    stars: 1200,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 80,
    install_command: "npx @asana/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity", "business-tools"],
    tools: [
      {
        name: "list_tasks",
        description: "List tasks in a project",
        input_schema: schema("project_id"),
      },
      {
        name: "create_task",
        description: "Create a new task",
        input_schema: schema("workspace", "name", "projects"),
      },
      {
        name: "update_task",
        description: "Update an existing task",
        input_schema: schema("task_id", "name", "completed"),
      },
      {
        name: "list_projects",
        description: "List projects in a workspace",
        input_schema: schema("workspace"),
      },
      {
        name: "search_tasks",
        description: "Search tasks by text",
        input_schema: schema("workspace", "text"),
      },
    ],
  },

  // 36
  {
    name: "Discord MCP",
    slug: "discord",
    description:
      "Discord bot operations: send messages, list channels and members, and read message history.",
    short_description: "Discord bot operations",
    github_url: "https://github.com/discord/mcp-server",
    npm_package: "@discord/mcp-server",
    stars: 2800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 78,
    install_command: "npx @discord/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "send_message",
        description: "Send a message to a channel",
        input_schema: schema("channel_id", "content"),
      },
      {
        name: "list_channels",
        description: "List channels in a guild",
        input_schema: schema("guild_id"),
      },
      {
        name: "list_members",
        description: "List members in a guild",
        input_schema: schema("guild_id", "limit"),
      },
      {
        name: "get_messages",
        description: "Get message history for a channel",
        input_schema: schema("channel_id", "limit"),
      },
    ],
  },

  // 37
  {
    name: "Telegram MCP",
    slug: "telegram",
    description:
      "Telegram bot API integration: send messages, receive updates, and list chats.",
    short_description: "Telegram bot API integration",
    github_url: "https://github.com/nicepkg/mcp-server-telegram",
    npm_package: null,
    stars: 1100,
    language: "Python",
    transport: "stdio",
    auth_type: "token",
    security_score: 72,
    install_command: "uvx mcp-server-telegram",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "send_message",
        description: "Send a Telegram message",
        input_schema: schema("chat_id", "text"),
      },
      {
        name: "get_updates",
        description: "Get recent bot updates",
        input_schema: schema("limit"),
      },
      {
        name: "list_chats",
        description: "List recent chats",
        input_schema: "{}",
      },
    ],
  },

  // 38
  {
    name: "WhatsApp MCP",
    slug: "whatsapp",
    description:
      "WhatsApp Business API integration: send messages and list contacts.",
    short_description: "WhatsApp Business API integration",
    github_url: "https://github.com/nicepkg/mcp-server-whatsapp",
    npm_package: null,
    stars: 900,
    language: "Python",
    transport: "stdio",
    auth_type: "token",
    security_score: 68,
    install_command: "uvx mcp-server-whatsapp",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "send_message",
        description: "Send a WhatsApp message",
        input_schema: schema("to", "message"),
      },
      {
        name: "list_contacts",
        description: "List available contacts",
        input_schema: "{}",
      },
    ],
  },

  // 39
  {
    name: "YouTube MCP",
    slug: "youtube",
    description:
      "YouTube data integration: search videos, get video info, retrieve transcripts, and list playlists.",
    short_description: "YouTube data and search integration",
    github_url: "https://github.com/nicepkg/mcp-server-youtube",
    npm_package: null,
    stars: 1500,
    language: "Python",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 75,
    install_command: "uvx mcp-server-youtube",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["search-web"],
    tools: [
      {
        name: "search_videos",
        description: "Search YouTube videos",
        input_schema: schema("query", "max_results"),
      },
      {
        name: "get_video_info",
        description: "Get info about a YouTube video",
        input_schema: schema("video_id"),
      },
      {
        name: "get_transcript",
        description: "Get the transcript for a video",
        input_schema: schema("video_id", "language"),
      },
      {
        name: "list_playlists",
        description: "List playlists for a channel",
        input_schema: schema("channel_id"),
      },
    ],
  },

  // 40
  {
    name: "Twitter/X MCP",
    slug: "twitter",
    description:
      "Twitter/X API integration: post tweets, search, get your timeline, and look up user info.",
    short_description: "Twitter/X API integration",
    github_url: "https://github.com/nicepkg/mcp-server-twitter",
    npm_package: null,
    stars: 1800,
    language: "Python",
    transport: "stdio",
    auth_type: "oauth",
    security_score: 70,
    install_command: "uvx mcp-server-twitter",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["communication"],
    tools: [
      {
        name: "post_tweet",
        description: "Post a new tweet",
        input_schema: schema("text"),
      },
      {
        name: "search_tweets",
        description: "Search tweets by query",
        input_schema: schema("query", "max_results"),
      },
      {
        name: "get_timeline",
        description: "Get home timeline tweets",
        input_schema: schema("max_results"),
      },
      {
        name: "get_user_info",
        description: "Get info about a Twitter user",
        input_schema: schema("username"),
      },
    ],
  },

  // 41
  {
    name: "Figma MCP",
    slug: "figma",
    description:
      "Access and inspect Figma design files: retrieve components, styles, and export assets.",
    short_description: "Design file access and inspection via Figma",
    github_url: "https://github.com/nicepkg/mcp-server-figma",
    npm_package: "@nicepkg/mcp-server-figma",
    stars: 2100,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 82,
    install_command: "npx @nicepkg/mcp-server-figma",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["design"],
    tools: [
      {
        name: "get_file",
        description: "Get a Figma file",
        input_schema: schema("file_key"),
      },
      {
        name: "get_components",
        description: "Get components from a Figma file",
        input_schema: schema("file_key"),
      },
      {
        name: "get_styles",
        description: "Get styles defined in a file",
        input_schema: schema("file_key"),
      },
      {
        name: "export_assets",
        description: "Export assets from a Figma file",
        input_schema: schema("file_key", "node_ids", "format"),
      },
    ],
  },

  // 42
  {
    name: "Airtable MCP",
    slug: "airtable",
    description:
      "Interact with Airtable bases: list, create, update, and search records in any table.",
    short_description: "Spreadsheet-database hybrid via Airtable",
    github_url: "https://github.com/nicepkg/mcp-server-airtable",
    npm_package: "@nicepkg/mcp-server-airtable",
    stars: 1000,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 78,
    install_command: "npx @nicepkg/mcp-server-airtable",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["productivity", "databases"],
    tools: [
      {
        name: "list_records",
        description: "List records from a table",
        input_schema: schema("base_id", "table_name", "max_records"),
      },
      {
        name: "create_record",
        description: "Create a new record",
        input_schema: schema("base_id", "table_name", "fields"),
      },
      {
        name: "update_record",
        description: "Update an existing record",
        input_schema: schema("base_id", "table_name", "record_id", "fields"),
      },
      {
        name: "search_records",
        description: "Search records by formula",
        input_schema: schema("base_id", "table_name", "filter_by_formula"),
      },
    ],
  },

  // 43
  {
    name: "HubSpot MCP",
    slug: "hubspot",
    description:
      "HubSpot CRM integration: manage contacts, deals, and search company records.",
    short_description: "CRM and marketing platform via HubSpot",
    github_url: "https://github.com/nicepkg/mcp-server-hubspot",
    npm_package: "@nicepkg/mcp-server-hubspot",
    stars: 800,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 76,
    install_command: "npx @nicepkg/mcp-server-hubspot",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["business-tools"],
    tools: [
      {
        name: "list_contacts",
        description: "List CRM contacts",
        input_schema: schema("limit"),
      },
      {
        name: "create_contact",
        description: "Create a new contact",
        input_schema: schema("email", "firstname", "lastname"),
      },
      {
        name: "list_deals",
        description: "List open deals in the pipeline",
        input_schema: schema("limit"),
      },
      {
        name: "search_companies",
        description: "Search companies by name",
        input_schema: schema("query"),
      },
    ],
  },

  // 44
  {
    name: "Zendesk MCP",
    slug: "zendesk",
    description:
      "Customer support platform integration: list, create, update, and search support tickets in Zendesk.",
    short_description: "Customer support platform via Zendesk",
    github_url: "https://github.com/nicepkg/mcp-server-zendesk",
    npm_package: "@nicepkg/mcp-server-zendesk",
    stars: 700,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 75,
    install_command: "npx @nicepkg/mcp-server-zendesk",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["business-tools"],
    tools: [
      {
        name: "list_tickets",
        description: "List support tickets",
        input_schema: schema("status", "limit"),
      },
      {
        name: "create_ticket",
        description: "Create a new support ticket",
        input_schema: schema("subject", "body", "requester_email"),
      },
      {
        name: "update_ticket",
        description: "Update a ticket",
        input_schema: schema("ticket_id", "status", "comment"),
      },
      {
        name: "search_tickets",
        description: "Search tickets by query",
        input_schema: schema("query"),
      },
    ],
  },

  // 45
  {
    name: "PagerDuty MCP",
    slug: "pagerduty",
    description:
      "Incident management with PagerDuty: list and acknowledge incidents, create new incidents, and list services.",
    short_description: "Incident management via PagerDuty",
    github_url: "https://github.com/nicepkg/mcp-server-pagerduty",
    npm_package: "@nicepkg/mcp-server-pagerduty",
    stars: 600,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 80,
    install_command: "npx @nicepkg/mcp-server-pagerduty",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["devops-monitoring"],
    tools: [
      {
        name: "list_incidents",
        description: "List open incidents",
        input_schema: schema("status", "limit"),
      },
      {
        name: "create_incident",
        description: "Create a new incident",
        input_schema: schema("title", "service_id", "urgency"),
      },
      {
        name: "acknowledge_incident",
        description: "Acknowledge an incident",
        input_schema: schema("incident_id"),
      },
      {
        name: "list_services",
        description: "List PagerDuty services",
        input_schema: "{}",
      },
    ],
  },

  // 46
  {
    name: "Datadog MCP",
    slug: "datadog",
    description:
      "Monitoring and analytics via Datadog: query metrics, manage monitors, create alerts, and retrieve logs.",
    short_description: "Monitoring and analytics via Datadog",
    github_url: "https://github.com/DataDog/mcp-server-datadog",
    npm_package: "@datadog/mcp-server",
    stars: 1600,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "api_key",
    security_score: 85,
    install_command: "npx @datadog/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["devops-monitoring"],
    tools: [
      {
        name: "query_metrics",
        description: "Query Datadog metrics",
        input_schema: schema("query", "from", "to"),
      },
      {
        name: "list_monitors",
        description: "List all monitors",
        input_schema: schema("tags"),
      },
      {
        name: "create_monitor",
        description: "Create a new monitor",
        input_schema: schema("name", "type", "query", "message"),
      },
      {
        name: "get_logs",
        description: "Search and retrieve logs",
        input_schema: schema("query", "from", "to", "limit"),
      },
    ],
  },

  // 47
  {
    name: "Grafana MCP",
    slug: "grafana",
    description:
      "Observability dashboards via Grafana: list and inspect dashboards, query datasources, and list alert rules.",
    short_description: "Observability dashboards via Grafana",
    github_url: "https://github.com/grafana/mcp-server",
    npm_package: "@grafana/mcp-server",
    stars: 1400,
    language: "TypeScript",
    transport: "stdio",
    auth_type: "token",
    security_score: 82,
    install_command: "npx @grafana/mcp-server",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["devops-monitoring"],
    tools: [
      {
        name: "list_dashboards",
        description: "List all Grafana dashboards",
        input_schema: schema("folder_id"),
      },
      {
        name: "get_dashboard",
        description: "Get a dashboard by UID",
        input_schema: schema("uid"),
      },
      {
        name: "query_datasource",
        description: "Query a Grafana datasource",
        input_schema: schema("datasource_uid", "query"),
      },
      {
        name: "list_alerts",
        description: "List alert rules",
        input_schema: schema("folder_uid"),
      },
    ],
  },

  // 48
  {
    name: "Nginx MCP",
    slug: "nginx",
    description:
      "Nginx web server configuration management: read and update config files, reload the server, and list upstream groups.",
    short_description: "Nginx web server configuration management",
    github_url: "https://github.com/nicepkg/mcp-server-nginx",
    npm_package: null,
    stars: 500,
    language: "Python",
    transport: "stdio",
    auth_type: "none",
    security_score: 70,
    install_command: "uvx mcp-server-nginx",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "devops-monitoring"],
    tools: [
      {
        name: "get_config",
        description: "Get the current Nginx configuration",
        input_schema: "{}",
      },
      {
        name: "update_config",
        description: "Update a section of the Nginx config",
        input_schema: schema("config_block", "content"),
      },
      {
        name: "reload",
        description: "Reload Nginx to apply config changes",
        input_schema: "{}",
      },
      {
        name: "list_upstreams",
        description: "List configured upstream groups",
        input_schema: "{}",
      },
    ],
  },

  // 49
  {
    name: "Caddy MCP",
    slug: "caddy",
    description:
      "Caddy web server management via the Caddy Admin API: inspect config, update routes, and list active virtual hosts.",
    short_description: "Caddy web server management",
    github_url: "https://github.com/nicepkg/mcp-server-caddy",
    npm_package: null,
    stars: 400,
    language: "Go",
    transport: "stdio",
    auth_type: "none",
    security_score: 72,
    install_command: "docker run mcphub/mcp-caddy",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure"],
    tools: [
      {
        name: "get_config",
        description: "Get the full Caddy config as JSON",
        input_schema: "{}",
      },
      {
        name: "update_config",
        description: "Update the Caddy config",
        input_schema: schema("config_json"),
      },
      {
        name: "list_routes",
        description: "List all configured HTTP routes",
        input_schema: "{}",
      },
    ],
  },

  // 50
  {
    name: "Traefik MCP",
    slug: "traefik",
    description:
      "Cloud-native reverse proxy management via the Traefik API: list routers, services, and inspect middleware configuration.",
    short_description: "Cloud-native reverse proxy via Traefik",
    github_url: "https://github.com/nicepkg/mcp-server-traefik",
    npm_package: null,
    stars: 450,
    language: "Go",
    transport: "stdio",
    auth_type: "token",
    security_score: 74,
    install_command: "docker run mcphub/mcp-traefik",
    logo_url: null,
    is_official: false,
    is_featured: false,
    categories: ["cloud-infrastructure", "devops-monitoring"],
    tools: [
      {
        name: "list_routers",
        description: "List all Traefik routers",
        input_schema: "{}",
      },
      {
        name: "list_services",
        description: "List all Traefik services",
        input_schema: "{}",
      },
      {
        name: "get_middleware",
        description: "Get middleware configuration",
        input_schema: schema("middleware_name"),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Run config builder per install_command pattern
// ---------------------------------------------------------------------------

function resolveRunCmd(server: ServerDef): RunCmd {
  const cmd = server.install_command.trim();

  if (cmd.startsWith("docker run")) {
    // e.g. "docker run mcphub/mcp-caddy"
    const image = cmd.split(" ").slice(2).join(" ");
    return dockerConfigs(image);
  }

  if (cmd.startsWith("uvx ")) {
    const pkg = cmd.slice(4).trim();
    return uvxConfigs(pkg);
  }

  // Default: npx
  // Strip leading "npx " and any path argument (e.g. "/path/to/db")
  const withoutNpx = cmd.replace(/^npx\s+/, "");
  const parts = withoutNpx.split(" ");
  const pkg = parts[0];
  const extraArgs = parts.slice(1).filter((p) => !p.startsWith("/"));
  return npxConfigs(pkg, extraArgs);
}

// ---------------------------------------------------------------------------
// Database wipe helpers
// ---------------------------------------------------------------------------

function clearAllData(): void {
  // Access the same DB file that db.ts uses.
  const DB_PATH = path.join(process.cwd(), "mcphub.db");
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = OFF");
  // Drop tables so initSchema() in db.ts can recreate them with correct columns.
  db.exec(`
    DROP TABLE IF EXISTS server_configs;
    DROP TABLE IF EXISTS tools;
    DROP TABLE IF EXISTS server_categories;
    DROP TABLE IF EXISTS servers;
    DROP TABLE IF EXISTS categories;
  `);
  db.pragma("foreign_keys = ON");
  db.close();
  console.log("Cleared existing data.");
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

function seed(): void {
  clearAllData();

  // Build category slug -> id map
  const categoryIds: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const id = insertCategory(cat);
    categoryIds[cat.slug] = id;
  }
  console.log(`Inserted ${CATEGORIES.length} categories.`);

  let serverCount = 0;
  let toolCount = 0;
  let configCount = 0;

  for (const def of SERVERS) {
    // Insert server row
    const serverId = insertServer({
      name: def.name,
      slug: def.slug,
      description: def.description,
      short_description: def.short_description,
      github_url: def.github_url,
      npm_package: def.npm_package,
      stars: def.stars,
      language: def.language,
      transport: def.transport,
      auth_type: def.auth_type,
      security_score: def.security_score,
      install_command: def.install_command,
      logo_url: def.logo_url,
      is_official: def.is_official,
      is_featured: def.is_featured,
    });

    // Link categories
    for (const catSlug of def.categories) {
      const catId = categoryIds[catSlug];
      if (catId === undefined) {
        console.warn(`Unknown category slug: ${catSlug} for server ${def.slug}`);
        continue;
      }
      linkServerCategory(serverId, catId);
    }

    // Insert tools
    for (const tool of def.tools) {
      insertTool({
        server_id: serverId,
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      });
      toolCount++;
    }

    // Insert configs for all 5 client types
    const runCmd = resolveRunCmd(def);
    const configs = buildConfigs(runCmd, def.slug);
    for (const cfg of configs) {
      insertServerConfig({
        server_id: serverId,
        client_type: cfg.client_type as import("../src/lib/types").ClientType,
        config_json: cfg.config_json,
      });
      configCount++;
    }

    serverCount++;
  }

  console.log(`Inserted ${serverCount} servers.`);
  console.log(`Inserted ${toolCount} tools.`);
  console.log(`Inserted ${configCount} server configs.`);
  console.log("Seed complete.");
}

seed();
