import type { GitHubRepoMeta } from "./types";

const GITHUB_URL_REGEX =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/;

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_URL_REGEX);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function fetchRepoMeta(
  githubUrl: string
): Promise<GitHubRepoMeta | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return null;

  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.name,
      description: data.description ?? "",
      stars: data.stargazers_count,
      language: data.language ?? "Unknown",
      owner: data.owner.login,
      avatar_url: data.owner.avatar_url,
      topics: data.topics ?? [],
    };
  } catch {
    return null;
  }
}
