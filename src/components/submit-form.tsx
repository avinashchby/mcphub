"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Category, GitHubRepoMeta } from "@/lib/types";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

const TRANSPORT_OPTIONS = ["stdio", "sse", "http"] as const;
const AUTH_OPTIONS = ["none", "token", "api_key", "oauth"] as const;

type FormState =
  | { status: "idle" }
  | { status: "fetching_github" }
  | { status: "submitting" }
  | { status: "success"; serverSlug: string }
  | { status: "error"; message: string };

interface SubmitFormProps {
  /** Pre-loaded categories from the server. */
  categories: Category[];
}

/** Multi-step server submission form with GitHub metadata auto-fill. */
export function SubmitForm({ categories }: SubmitFormProps) {
  const [githubUrl, setGithubUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [transport, setTransport] = React.useState<string>("stdio");
  const [authType, setAuthType] = React.useState<string>("none");
  const [installCommand, setInstallCommand] = React.useState("");
  const [meta, setMeta] = React.useState<GitHubRepoMeta | null>(null);
  const [formState, setFormState] = React.useState<FormState>({ status: "idle" });

  const isGithubUrlValid = GITHUB_URL_REGEX.test(githubUrl.trim());

  function handleCategoryToggle(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleFetchGithub() {
    if (!isGithubUrlValid) return;

    const match = githubUrl.trim().match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [, owner, repo] = match;

    setFormState({ status: "fetching_github" });
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo.replace(/\/$/, "")}`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
      const data = await res.json();
      const fetched: GitHubRepoMeta = {
        name: data.name,
        description: data.description ?? "",
        stars: data.stargazers_count,
        language: data.language ?? "Unknown",
        owner: data.owner.login,
        avatar_url: data.owner.avatar_url,
        topics: data.topics ?? [],
      };
      setMeta(fetched);
      if (!description) setDescription(fetched.description);
      setFormState({ status: "idle" });
    } catch (err) {
      setFormState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to fetch GitHub metadata",
      });
    }
  }

  function validate(): string | null {
    if (!githubUrl.trim()) return "GitHub URL is required.";
    if (!isGithubUrlValid) return "Enter a valid GitHub repository URL.";
    if (!description.trim()) return "Description is required.";
    if (selectedCategories.length === 0) return "Select at least one category.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) {
      setFormState({ status: "error", message: error });
      return;
    }

    setFormState({ status: "submitting" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_url: githubUrl.trim(),
          description: description.trim(),
          categories: selectedCategories,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const created = await res.json();
      setFormState({ status: "success", serverSlug: created.slug });
    } catch (err) {
      setFormState({
        status: "error",
        message: err instanceof Error ? err.message : "Submission failed",
      });
    }
  }

  if (formState.status === "success") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl">&#10003;</div>
          <h2 className="text-xl font-semibold">Server Submitted</h2>
          <p className="text-muted-foreground">
            Your server has been added to the directory.
          </p>
          <div className="flex gap-3 justify-center">
            <a href={`/servers/${formState.serverSlug}`}>
              <Button>View Server</Button>
            </a>
            <Button
              variant="outline"
              onClick={() => {
                setGithubUrl("");
                setDescription("");
                setSelectedCategories([]);
                setTransport("stdio");
                setAuthType("none");
                setInstallCommand("");
                setMeta(null);
                setFormState({ status: "idle" });
              }}
            >
              Submit Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isBusy =
    formState.status === "fetching_github" || formState.status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* GitHub URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repository</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => {
                setGithubUrl(e.target.value);
                setMeta(null);
              }}
              disabled={isBusy}
              className="flex-1"
              aria-label="GitHub repository URL"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchGithub}
              disabled={!isGithubUrlValid || isBusy}
            >
              {formState.status === "fetching_github" ? "Fetching…" : "Fetch Info"}
            </Button>
          </div>

          {meta && (
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground pt-1">
              <span className="font-medium text-foreground">{meta.name}</span>
              <Badge variant="secondary">{meta.language}</Badge>
              <span>&#9733; {meta.stars.toLocaleString()}</span>
              {meta.topics.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isBusy}
            rows={4}
            placeholder="Describe what this MCP server does…"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            aria-label="Server description"
          />
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <label
                  key={cat.slug}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.slug)}
                    onCheckedChange={() => handleCategoryToggle(cat.slug)}
                    disabled={isBusy}
                    aria-label={cat.name}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transport & Auth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transport &amp; Auth</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="transport">
              Transport
            </label>
            <select
              id="transport"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              disabled={isBusy}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {TRANSPORT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="auth_type">
              Auth Type
            </label>
            <select
              id="auth_type"
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              disabled={isBusy}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {AUTH_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Install Command */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Install Command</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="npx @modelcontextprotocol/server-example"
            value={installCommand}
            onChange={(e) => setInstallCommand(e.target.value)}
            disabled={isBusy}
            className="font-mono"
            aria-label="Install command"
          />
        </CardContent>
      </Card>

      {/* Error message */}
      {formState.status === "error" && (
        <p className="text-sm text-destructive px-1">{formState.message}</p>
      )}

      <Button
        type="submit"
        disabled={isBusy}
        className="w-full"
        size="lg"
      >
        {formState.status === "submitting" ? "Submitting…" : "Submit Server"}
      </Button>
    </form>
  );
}
