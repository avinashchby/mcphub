import type { GeneratedConfig, Server } from "./types";

interface ConfigInput {
  name: string;
  slug: string;
  npm_package: string | null;
  install_command: string;
  transport: string;
}

function buildServerBlock(server: ConfigInput): Record<string, unknown> {
  const isNpx = server.install_command.startsWith("npx");
  const isUvx = server.install_command.startsWith("uvx");
  const isDocker = server.install_command.startsWith("docker");

  if (isNpx) {
    const parts = server.install_command.split(" ").slice(1);
    return {
      command: "npx",
      args: ["-y", ...parts],
    };
  }
  if (isUvx) {
    const parts = server.install_command.split(" ").slice(1);
    return {
      command: "uvx",
      args: parts,
    };
  }
  if (isDocker) {
    return {
      command: "docker",
      args: ["run", "-i", "--rm", server.install_command.split(" ").pop() ?? ""],
    };
  }

  return {
    command: "npx",
    args: ["-y", server.npm_package ?? `@modelcontextprotocol/server-${server.slug}`],
  };
}

export function generateClaudeDesktopConfig(servers: ConfigInput[]): GeneratedConfig {
  const mcpServers: Record<string, unknown> = {};
  for (const s of servers) {
    mcpServers[s.slug] = buildServerBlock(s);
  }

  return {
    client_type: "claude_desktop",
    label: "Claude Desktop",
    config: {
      mcpServers,
    },
  };
}

export function generateClaudeCodeConfig(servers: ConfigInput[]): GeneratedConfig {
  const mcpServers: Record<string, unknown> = {};
  for (const s of servers) {
    mcpServers[s.slug] = buildServerBlock(s);
  }

  return {
    client_type: "claude_code",
    label: "Claude Code",
    config: {
      mcpServers,
    },
  };
}

export function generateCursorConfig(servers: ConfigInput[]): GeneratedConfig {
  const mcpServers: Record<string, unknown> = {};
  for (const s of servers) {
    mcpServers[s.slug] = {
      ...buildServerBlock(s),
      disabled: false,
    };
  }

  return {
    client_type: "cursor",
    label: "Cursor",
    config: {
      mcpServers,
    },
  };
}

export function generateWindsurfConfig(servers: ConfigInput[]): GeneratedConfig {
  const mcpServers: Record<string, unknown> = {};
  for (const s of servers) {
    mcpServers[s.slug] = buildServerBlock(s);
  }

  return {
    client_type: "windsurf",
    label: "Windsurf",
    config: {
      mcpServers,
    },
  };
}

export function generateVSCodeConfig(servers: ConfigInput[]): GeneratedConfig {
  const inputs: Record<string, unknown>[] = [];

  for (const s of servers) {
    const block = buildServerBlock(s);
    inputs.push({
      type: "stdio",
      id: s.slug,
      name: s.name,
      command: block.command,
      args: block.args,
    });
  }

  return {
    client_type: "vscode",
    label: "VS Code",
    config: {
      "mcp.servers": inputs,
    },
  };
}

export function generateAllConfigs(
  servers: ConfigInput[]
): GeneratedConfig[] {
  return [
    generateClaudeDesktopConfig(servers),
    generateClaudeCodeConfig(servers),
    generateCursorConfig(servers),
    generateWindsurfConfig(servers),
    generateVSCodeConfig(servers),
  ];
}

export function generateConfigForServer(server: Server): GeneratedConfig[] {
  const input: ConfigInput = {
    name: server.name,
    slug: server.slug,
    npm_package: server.npm_package,
    install_command: server.install_command,
    transport: server.transport,
  };
  return generateAllConfigs([input]);
}
