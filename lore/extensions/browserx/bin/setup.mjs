#!/usr/bin/env node

import { createInterface } from "node:readline";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PLUGIN_ROOT = resolve(__dirname, "..");
const CLAUDE_DIR = join(homedir(), ".claude");
const PLUGINS_DIR = join(CLAUDE_DIR, "plugins");
const PLUGIN_DEST = join(PLUGINS_DIR, "browserx");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const AUTO_MODE = process.argv.includes("--auto");
const PATH_FLAG_INDEX = process.argv.indexOf("--path");
const EXPLICIT_PATH = PATH_FLAG_INDEX !== -1 ? process.argv[PATH_FLAG_INDEX + 1] : null;

function log(msg) {
  console.log(`\x1b[36m[browserx]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m[browserx]\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`\x1b[31m[browserx]\x1b[0m ${msg}`);
}

function banner() {
  console.log(`
\x1b[36m ____                                     __  __
| __ ) _ __ _____      _____  ___ _ __  \\ \\/ /
|  _ \\| '__/ _ \\ \\ /\\ / / __|/ _ \\ '__|  \\  /
| |_) | | | (_) \\ V  V /\\__ \\  __/ |     /  \\
|____/|_|  \\___/ \\_/\\_/ |___/\\___|_|    /_/\\_\\\x1b[0m
  \x1b[90mClaude Code Plugin\x1b[0m
`);
}

function detectBrowserXPath() {
  // 1. Explicit --path flag (highest priority)
  if (EXPLICIT_PATH) {
    const resolved = validateBrowserXPath(EXPLICIT_PATH);
    if (resolved) return resolved;
    error(`--path provided but invalid: ${EXPLICIT_PATH}`);
    return null;
  }

  // 2. BROWSERX_PATH environment variable
  if (process.env.BROWSERX_PATH) {
    const resolved = validateBrowserXPath(process.env.BROWSERX_PATH);
    if (resolved) return resolved;
    error(`$BROWSERX_PATH is set but invalid: ${process.env.BROWSERX_PATH}`);
  }

  // 3. Detect via `which browserx`
  try {
    const whichResult = execFileSync("which", ["browserx"], { stdio: "pipe", encoding: "utf-8" }).trim();
    if (whichResult) {
      const binDir = dirname(whichResult);
      const candidate = resolve(binDir, "..");
      if (existsSync(join(candidate, "deno.json")) && existsSync(join(candidate, "mcp-server"))) {
        return candidate;
      }
    }
  } catch {
    // not found via which
  }

  // 4. Detect via npm root -g
  try {
    const npmRoot = execFileSync("npm", ["root", "-g"], { stdio: "pipe", encoding: "utf-8" }).trim();
    const candidate = join(npmRoot, "browserx");
    if (existsSync(join(candidate, "deno.json")) && existsSync(join(candidate, "mcp-server"))) {
      return candidate;
    }
  } catch {
    // npm not available or failed
  }

  // 5. Hardcoded candidate paths (fallback)
  const candidates = [
    resolve(PLUGIN_ROOT, ".."),
    join(homedir(), "BrowserX"),
    join(homedir(), "Projects", "BrowserX"),
    join(homedir(), "src", "BrowserX"),
    join(homedir(), "code", "BrowserX"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "deno.json")) && existsSync(join(candidate, "mcp-server"))) {
      return candidate;
    }
  }
  return null;
}

function printDetectionHelp() {
  error("Could not find BrowserX repository.");
  console.log(`
\x1b[36mTo fix this, do one of the following:\x1b[0m

  1. Pass the path explicitly:
     browserx-claude-setup --path /path/to/BrowserX

  2. Set the BROWSERX_PATH environment variable:
     export BROWSERX_PATH=/path/to/BrowserX

  3. Ensure 'browserx' is on your PATH (e.g. via npm link)

\x1b[90mThe BrowserX directory must contain deno.json and an mcp-server/ folder.\x1b[0m
`);
}

function validateBrowserXPath(path) {
  const absPath = resolve(path);
  if (!existsSync(join(absPath, "deno.json"))) {
    error(`No deno.json found at ${absPath}`);
    return null;
  }
  if (!existsSync(join(absPath, "mcp-server"))) {
    error(`No mcp-server/ directory found at ${absPath}`);
    return null;
  }
  return absPath;
}

function testHttpEndpoint(url) {
  try {
    const parsedUrl = new URL(url);
    const healthUrl = `${parsedUrl.origin}/health`;
    execFileSync("curl", ["-sf", "--max-time", "5", healthUrl], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function writeMcpConfig(config) {
  const mcpPath = join(PLUGIN_DEST, ".mcp.json");
  writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n");
  log(`MCP config written to ${mcpPath}`);
}

function installPlugin() {
  mkdirSync(PLUGINS_DIR, { recursive: true });

  if (existsSync(PLUGIN_DEST)) {
    rmSync(PLUGIN_DEST, { recursive: true, force: true });
  }

  cpSync(PLUGIN_ROOT, PLUGIN_DEST, { recursive: true });
  success(`Plugin installed to ${PLUGIN_DEST}`);
}

function cleanupOldSkill() {
  const oldSkillDir = join(CLAUDE_DIR, "skills", "using-browserx");
  if (existsSync(oldSkillDir)) {
    rmSync(oldSkillDir, { recursive: true, force: true });
    log("Removed old standalone skill at ~/.claude/skills/using-browserx/");
  }
}

async function setupStdio() {
  let browserxPath = detectBrowserXPath();

  if (browserxPath) {
    log(`Detected BrowserX at: ${browserxPath}`);
    const useDetected = await ask("Use this path? (Y/n) ");
    if (useDetected.toLowerCase() === "n") {
      browserxPath = null;
    }
  }

  if (!browserxPath) {
    printDetectionHelp();
    const inputPath = await ask("Enter path to BrowserX repository: ");
    browserxPath = validateBrowserXPath(inputPath.trim());
    if (!browserxPath) {
      error("Invalid BrowserX path. Aborting.");
      process.exit(1);
    }
  }

  const template = readFileSync(join(PLUGIN_ROOT, "templates", "mcp-stdio.json"), "utf-8");
  const config = JSON.parse(template.replace("{{BROWSERX_PATH}}", browserxPath));
  return config;
}

async function setupHttp() {
  const defaultUrl = "http://localhost:9847";
  const inputUrl = await ask(`Enter BrowserX MCP server URL (${defaultUrl}): `);
  const url = inputUrl.trim() || defaultUrl;

  log(`Testing connection to ${url}...`);
  const reachable = testHttpEndpoint(url);

  if (!reachable) {
    log(`Server not reachable at ${url}. The plugin will still be configured — start the server before using BrowserX tools.`);
  } else {
    success(`Server reachable at ${url}`);
  }

  const template = readFileSync(join(PLUGIN_ROOT, "templates", "mcp-http.json"), "utf-8");
  const config = JSON.parse(template.replace("{{BROWSERX_URL}}", url));
  return config;
}

async function setupDocker() {
  log("Starting BrowserX MCP server via Docker...");

  const dockerComposePath = join(PLUGIN_ROOT, "docker", "docker-compose.yml");
  if (!existsSync(dockerComposePath)) {
    error("docker-compose.yml not found. Please ensure Docker files are included in the plugin.");
    process.exit(1);
  }

  try {
    execFileSync("docker", ["compose", "-f", dockerComposePath, "up", "-d"], { stdio: "inherit" });
    success("BrowserX MCP server started via Docker on port 9847");
  } catch {
    error("Failed to start Docker container. Make sure Docker is running.");
    log("You can start it manually: docker compose -f browserx-claude-plugin/docker/docker-compose.yml up -d");
  }

  const template = readFileSync(join(PLUGIN_ROOT, "templates", "mcp-http.json"), "utf-8");
  const config = JSON.parse(template.replace("{{BROWSERX_URL}}", "http://localhost:9847"));
  return config;
}

async function main() {
  banner();

  if (AUTO_MODE) {
    const browserxPath = detectBrowserXPath();
    if (browserxPath) {
      log(`Auto-detected BrowserX at: ${browserxPath}`);
      const template = readFileSync(join(PLUGIN_ROOT, "templates", "mcp-stdio.json"), "utf-8");
      const config = JSON.parse(template.replace("{{BROWSERX_PATH}}", browserxPath));
      installPlugin();
      writeMcpConfig(config);
      cleanupOldSkill();
      printSuccess();
    } else {
      printDetectionHelp();
      log("Run 'browserx-claude-setup' manually to configure.");
    }
    rl.close();
    return;
  }

  log("Choose your install mode:\n");
  console.log("  1. Local stdio  — Connect to a local BrowserX checkout (deno task mcp:start)");
  console.log("  2. HTTP endpoint — Connect to a running BrowserX MCP server");
  console.log("  3. Docker       — Start BrowserX via Docker (zero-config)\n");

  const choice = await ask("Select mode (1/2/3): ");

  let mcpConfig;
  switch (choice.trim()) {
    case "1":
      mcpConfig = await setupStdio();
      break;
    case "2":
      mcpConfig = await setupHttp();
      break;
    case "3":
      mcpConfig = await setupDocker();
      break;
    default:
      error("Invalid choice. Please run setup again.");
      rl.close();
      process.exit(1);
  }

  installPlugin();
  writeMcpConfig(mcpConfig);
  cleanupOldSkill();
  printSuccess();

  rl.close();
}

function printSuccess() {
  console.log(`
\x1b[32m Setup complete!\x1b[0m

\x1b[36mAvailable commands:\x1b[0m
  /browse <url>      — Navigate and extract content
  /screenshot <url>  — Take a screenshot
  /query <sql>       — Run a BrowserX SQL-like query

\x1b[36mAvailable tools (auto-loaded):\x1b[0m
  browserx_query     — SQL-like extraction
  browser_navigate   — Start browser session
  browser_click      — Click elements
  browser_type       — Type into inputs
  browser_screenshot — Capture screenshots
  browser_query_dom  — Extract structured data
  + 15 more tools

\x1b[36mBehavior:\x1b[0m
  - BrowserX tools load automatically (no ToolSearch needed)
  - WebFetch/WebSearch are redirected to BrowserX
  - Session start injects BrowserX context
  - Full syntax guide via 'using-browserx' skill

\x1b[90mRestart Claude Code for changes to take effect.\x1b[0m
`);
}

main().catch((e) => {
  error(e.message);
  rl.close();
  process.exit(1);
});
