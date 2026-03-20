# mcphub

The open-source directory to discover, configure, and deploy MCP servers — without reading docs.

## Overview

mcphub is a web app that solves the fragmented MCP ecosystem problem: instead of hunting through GitHub repos to find and configure Model Context Protocol servers, you get a single searchable directory. It lets you browse servers by category, language, and transport type, then generates a ready-to-paste config file for Claude Desktop, Claude Code, Cursor, Windsurf, or VS Code in one click. The SQLite-backed registry runs entirely on your own machine with no cloud dependencies.

## Features

- Browse and filter MCP servers by category, language, transport, and auth type
- Fuzzy search across server names and descriptions (Fuse.js, client-side)
- Per-server detail pages with tools list, input schemas, and security scores
- One-click config generation for Claude Desktop, Claude Code, Cursor, Windsurf, and VS Code
- Multi-server config builder — select multiple servers and export a merged config
- MCP Playground to inspect mock tool requests and responses in the browser
- Community server submission via GitHub URL with auto-populated metadata
- Zero external services — SQLite database, no cloud required

## Getting Started

```bash
npm install
npm run seed   # populate the database with MCP servers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 14** (App Router, server components)
- **TypeScript**
- **Tailwind CSS** + Radix UI primitives (shadcn/ui)
- **SQLite** via better-sqlite3
- **Fuse.js** for client-side fuzzy search
- **Lucide React** for icons

## Contributing

To add an MCP server, use the Submit page at `/submit` — provide a GitHub URL and select categories. For code contributions, open a PR with a conventional commit message (`feat:`, `fix:`, `docs:`, etc.).

## License

MIT
