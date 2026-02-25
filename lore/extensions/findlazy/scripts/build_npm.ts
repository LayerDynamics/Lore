#!/usr/bin/env -S deno run -A

import { build, emptyDir } from "../resources/dnt/mod.ts";
import { copy } from "@std/fs";
import { join } from "@std/path";

/**
 * Build npm package from Deno source using dnt
 */

const outDir = "./npm";

await emptyDir(outDir);

await build({
  entryPoints: ["./main.ts"],
  outDir,
  // importMap: "./deno.json", // Don't use import map - dnt has issues with it (see #437)
  shims: {
    deno: true,
  },
  package: {
    name: "@findlazy/findlazy",
    version: "0.1.0",
    description: "FindLazy - Detect lazy, incomplete, and deceptive code patterns left by AI agents",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/findlazy/findlazy.git",
    },
    bugs: {
      url: "https://github.com/findlazy/findlazy/issues",
    },
    keywords: [
      "code-quality",
      "linter",
      "static-analysis",
      "mcp-server",
      "ai-detection",
      "code-patterns",
      "typescript",
      "python",
    ],
    bin: {
      findlazy: "./esm/main.js",
    },
    engines: {
      node: ">=18.0.0",
    },
  },
  mappings: {
    // Map to npm packages (use JSR npm mirror @jsr/scope__package for JSR packages)
    // Note: Versions must match deno.json imports
    "@std/fs": {
      name: "@jsr/std__fs",
      version: "^1.0.8",
    },
    "@std/path": {
      name: "@jsr/std__path",
      version: "^1.0.8",
    },
    "@std/jsonc": {
      name: "@jsr/std__jsonc",
      version: "^1.0.1",
    },
    "@std/yaml": {
      name: "@jsr/std__yaml",
      version: "^1.0.5",
    },
    "@std/assert": {
      name: "@jsr/std__assert",
      version: "^1.0.10",
    },
    "@std/testing": {
      name: "@jsr/std__testing",
      version: "^1.0.5",
    },
    "@std/fmt/colors": {
      name: "@jsr/std__fmt",
      version: "^1.0.3",
      subPath: "colors",
    },
    "@cliffy/command": {
      name: "@jsr/cliffy__command",
      version: "^1.0.0-rc.7",
    },
    "@cliffy/table": {
      name: "@jsr/cliffy__table",
      version: "^1.0.0-rc.7",
    },
    "@cliffy/prompt": {
      name: "@jsr/cliffy__prompt",
      version: "^1.0.0-rc.7",
    },
    "@kriss-u/py-ast": {
      name: "@jsr/kriss-u__py-ast",
      version: "^1.0.0",
    },
    "@modelcontextprotocol/sdk": {
      name: "@modelcontextprotocol/sdk",
      version: "^1.0.4",
    },
    "typescript": {
      name: "typescript",
      version: "^5.7.2",
      peerDependency: true,
    },
  },
  compilerOptions: {
    lib: ["ESNext", "DOM"],
    target: "ES2022",
    sourceMap: true,
  },
  test: false,
  typeCheck: "both",
  declaration: "separate",
  scriptModule: false,
  postBuild: async () => {
    await Deno.stdout.write(
      new TextEncoder().encode("Copying additional files...\n"),
    );

    // Copy patterns directory
    await copy("./patterns", join(outDir, "patterns"), { overwrite: true });

    // Copy LICENSE
    await Deno.copyFile("./LICENSE", join(outDir, "LICENSE"));

    // Copy README.md
    await Deno.copyFile("./README.md", join(outDir, "README.md"));

    // Copy JSON schema
    await Deno.copyFile(
      "./findlazy.schema.json",
      join(outDir, "findlazy.schema.json"),
    );

    // Create npm-specific README additions
    const npmReadmeAddition = `

## npm-specific Installation

\`\`\`bash
# Install globally
npm install -g @findlazy/findlazy

# Run directly with npx
npx @findlazy/findlazy scan ./src

# Use as MCP server in Claude Desktop
npx -y @findlazy/findlazy --mcp
\`\`\`

## MCP Server Configuration (npm)

Add to your Claude Desktop config:

\`\`\`json
{
  "mcpServers": {
    "findlazy": {
      "command": "npx",
      "args": ["-y", "@findlazy/findlazy", "--mcp"]
    }
  }
}
\`\`\`

Built from Deno source using [dnt](https://github.com/denoland/dnt).
`;

    const readmePath = join(outDir, "README.md");
    const readme = await Deno.readTextFile(readmePath);
    await Deno.writeTextFile(readmePath, readme + npmReadmeAddition);

    await Deno.stdout.write(
      new TextEncoder().encode("Build complete!\n"),
    );
  },
});

await Deno.stdout.write(
  new TextEncoder().encode(
    "\nNPM package built successfully in ./npm/\n\nNext steps:\n" +
      "  cd npm\n" +
      "  npm link     # Test locally\n" +
      "  npm publish  # Publish to npm\n",
  ),
);
