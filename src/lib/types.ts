export interface Server {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  server_count?: number;
}

export interface Tool {
  id: number;
  server_id: number;
  name: string;
  description: string;
  input_schema: string;
}

export interface ServerConfig {
  id: number;
  server_id: number;
  client_type: ClientType;
  config_json: string;
}

export type ClientType =
  | "claude_desktop"
  | "claude_code"
  | "cursor"
  | "windsurf"
  | "vscode";

export interface SearchResult {
  item: Server;
  score: number;
  categories: Category[];
}

export interface ServerDetail extends Server {
  categories: Category[];
  tools: Tool[];
  configs: ServerConfig[];
}

export interface ServerListParams {
  category?: string;
  language?: string;
  transport?: string;
  auth_type?: string;
  sort?: "stars" | "newest" | "security" | "name";
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmitServerPayload {
  github_url: string;
  description: string;
  categories: string[];
}

export interface GitHubRepoMeta {
  name: string;
  description: string;
  stars: number;
  language: string;
  owner: string;
  avatar_url: string;
  topics: string[];
}

export interface GeneratedConfig {
  client_type: ClientType;
  label: string;
  config: Record<string, unknown>;
}
