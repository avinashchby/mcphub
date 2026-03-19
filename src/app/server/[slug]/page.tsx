import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Star,
  ExternalLink,
  Globe,
  Package,
  Calendar,
  Zap,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { getServerBySlug } from "@/lib/db";
import { generateConfigForServer } from "@/lib/config-generator";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "@/components/security-badge";
import { CopyCommand } from "@/components/copy-command";
import { ServerDetailTabs } from "@/components/server-detail-tabs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Dynamic metadata for SEO — title and description drawn from DB. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const server = getServerBySlug(slug);

  if (!server) {
    return {
      title: "Server Not Found — mcphub",
    };
  }

  return {
    title: `${server.name} — mcphub`,
    description: server.short_description,
    openGraph: {
      title: `${server.name} — mcphub`,
      description: server.short_description,
      url: `https://mcphub.io/server/${server.slug}`,
      siteName: "mcphub",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${server.name} — mcphub`,
      description: server.short_description,
    },
  };
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-foreground truncate max-w-[140px] text-right">
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Server detail page. Fetches data server-side; renders static shell + client tabs. */
export default async function ServerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const server = getServerBySlug(slug);

  if (!server) {
    notFound();
  }

  const configs = generateConfigForServer(server);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/servers" className="hover:text-foreground transition-colors">
          Servers
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{server.name}</span>
      </nav>

      {/* Hero section */}
      <div className="mb-8 rounded-2xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)] p-6 sm:p-8">
        {/* Top row: name + actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3 min-w-0">
            {/* Name */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {server.name}
              </h1>
              {server.is_official && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(217_91%_60%/0.12)] border border-[hsl(217_91%_60%/0.25)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(217_91%_60%)]">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Official
                </span>
              )}
            </div>

            {/* Short description */}
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {server.short_description}
            </p>

            {/* Badges: language, transport, auth */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                {server.language}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                {server.transport}
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 border-[hsl(0_0%_20%)] text-muted-foreground"
              >
                <Shield className="h-3 w-3" />
                {server.auth_type === "none" ? "No auth" : server.auth_type}
              </Badge>
              <SecurityBadge score={server.security_score} size="sm" />
            </div>
          </div>

          {/* Right: stars + GitHub */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_10%)] px-3 py-1.5 text-sm font-medium text-foreground">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              {formatNumber(server.stars)}
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href={server.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Install command */}
        {server.install_command && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Install
            </p>
            <CopyCommand command={server.install_command} className="max-w-xl" />
          </div>
        )}
      </div>

      {/* Main content + sidebar */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Tabs — take remaining width */}
        <div className="min-w-0 flex-1">
          <ServerDetailTabs
            description={server.description}
            categories={server.categories}
            tools={server.tools}
            configs={configs}
            securityScore={server.security_score}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-72 xl:w-80">
          <div className="sticky top-20 flex flex-col gap-4">
            {/* Metadata card */}
            <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] px-4 py-3">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h2>
              <div className="divide-y divide-[hsl(0_0%_12%)]">
                <MetaRow
                  icon={<Globe className="h-3.5 w-3.5" />}
                  label="Language"
                  value={server.language}
                />
                <MetaRow
                  icon={<Zap className="h-3.5 w-3.5" />}
                  label="Transport"
                  value={server.transport}
                />
                <MetaRow
                  icon={<Shield className="h-3.5 w-3.5" />}
                  label="Auth"
                  value={server.auth_type === "none" ? "None" : server.auth_type}
                />
                <MetaRow
                  icon={<Star className="h-3.5 w-3.5 text-amber-400" />}
                  label="Stars"
                  value={formatNumber(server.stars)}
                />
                <MetaRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Updated"
                  value={formatDate(server.updated_at)}
                />
              </div>
            </div>

            {/* Links card */}
            <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Links
              </h2>
              <div className="flex flex-col gap-2">
                <a
                  href={server.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_10%)] px-3 py-2 text-sm text-foreground hover:bg-[hsl(0_0%_12%)] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">GitHub Repository</span>
                </a>

                {server.npm_package && (
                  <a
                    href={`https://www.npmjs.com/package/${server.npm_package}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_10%)] px-3 py-2 text-sm text-foreground hover:bg-[hsl(0_0%_12%)] transition-colors"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{server.npm_package}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Install command box */}
            {server.install_command && (
              <div className="rounded-xl border border-[hsl(0_0%_15%)] bg-[hsl(0_0%_8%)] p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Install
                </h2>
                <CopyCommand command={server.install_command} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
