import * as React from "react";
import Link from "next/link";
import { Boxes } from "lucide-react";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const ABOUT_LINKS: FooterLink[] = [
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
  { href: "https://github.com/mcphub", label: "GitHub", external: true },
];

const RESOURCE_LINKS: FooterLink[] = [
  { href: "https://modelcontextprotocol.io", label: "MCP Docs", external: true },
  { href: "https://github.com/anthropics/anthropic-cookbook", label: "Anthropic Cookbook", external: true },
  { href: "/playground", label: "Playground" },
];

const SITE_LINKS: FooterLink[] = [
  { href: "/browse", label: "Browse Servers" },
  { href: "/submit", label: "Submit a Server" },
  { href: "/configure", label: "Configure" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(({ href, label, external }) => (
          <li key={href}>
            <Link
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Site-wide footer with column links and copyright bar. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Grid: logo/tagline + link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity w-fit"
            >
              <Boxes className="h-5 w-5 text-primary" />
              <span className="text-base font-bold tracking-tight">mcphub</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Discover, configure, and deploy Model Context Protocol servers for
              your AI workflow.
            </p>
          </div>

          <FooterColumn title="About" links={ABOUT_LINKS} />
          <FooterColumn title="Links" links={SITE_LINKS} />
          <FooterColumn title="Resources" links={RESOURCE_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; 2024 mcphub. MIT License.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for the MCP ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
