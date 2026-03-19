# mcphub

**The open-source MCP server directory.**

Discover, configure, and deploy Model Context Protocol (MCP) servers for Claude Desktop, Claude Code, Cursor, Windsurf, VS Code, and more.

## Features

- **50+ MCP Servers** — Browse a curated directory of real MCP servers with accurate metadata
- **One-Click Config** — Generate ready-to-paste JSON configs for 5 different MCP clients
- **Fuzzy Search** — Find servers instantly with client-side fuzzy search (Fuse.js)
- **Security Scores** — Color-coded trust indicators for every server
- **MCP Playground** — Test server tools with a mock request/response viewer
- **Multi-Server Config** — Select multiple servers and generate a merged config file
- **Dark/Light Mode** — Beautiful UI with automatic theme detection
- **Zero External Deps** — SQLite database, no cloud services required

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** SQLite via better-sqlite3
- **Search:** Fuse.js (client-side fuzzy)
- **Icons:** Lucide React

## Quickstart

```bash
# Clone the repository
git clone https://github.com/yourusername/mcphub.git
cd mcphub

# Install dependencies
npm install

# Seed the database with 50 MCP servers
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the directory.

## Project Structure

```
src/
  app/
    page.tsx              # Home page — hero, trending, categories
    browse/page.tsx       # Browse with filters, sort, pagination
    server/[slug]/page.tsx # Server detail — tools, config, security
    submit/page.tsx       # Submit a new server
    playground/page.tsx   # Mock MCP tool playground
    configure/page.tsx    # Multi-server config generator
    api/                  # REST API routes
  components/
    ui/                   # shadcn/ui primitives (button, card, tabs, etc.)
    navbar.tsx            # Navigation bar
    footer.tsx            # Footer
    server-card.tsx       # Server listing card
    search-bar.tsx        # Fuzzy search with keyboard shortcuts
    config-snippet.tsx    # Tabbed config code blocks
    security-badge.tsx    # Color-coded security indicator
    category-grid.tsx     # Category browsing grid
    filter-sidebar.tsx    # Filter panel with checkboxes
    tools-list.tsx        # Accordion tool list with schemas
  lib/
    db.ts                 # SQLite database layer
    types.ts              # TypeScript interfaces
    config-generator.ts   # MCP config generation for 5 clients
    github.ts             # GitHub API helper
    utils.ts              # Utilities (cn, formatNumber, etc.)
scripts/
  seed.ts                 # Database seeder (50 servers, 12 categories)
```

## Self-Hosting

mcphub is designed to run anywhere with zero external dependencies:

```bash
# Build for production
npm run build

# Start production server
npm start
```

The SQLite database file (`mcphub.db`) is created automatically on first run. Back it up by copying the file.

### Environment Variables (optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub API token for higher rate limits | None |
| `PORT` | Server port | 3000 |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/servers` | GET | List servers (filter, sort, paginate) |
| `/api/servers/[slug]` | GET | Server detail with tools and configs |
| `/api/search?q=` | GET | Fuzzy search servers |
| `/api/submit` | POST | Submit a new server |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please use [conventional commits](https://www.conventionalcommits.org/) for commit messages.

## License

MIT - see [LICENSE](LICENSE) for details.
