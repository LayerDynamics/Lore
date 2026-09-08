# Lore

Provider-neutral engineering workflows with a small default catalog, explicit runtime adapters, and evidence-based completion.

The source code is in `lore/`. Build packages for **Codex**, **Claude Code**, or any host that supports **Agent Skills**. Lore uses the host's configured model and available capabilities; it does not require a particular provider or model generation.

## Workflows

| Workflow | Purpose |
| --- | --- |
| `plan`, `design` | Turn the requested outcome into an implementable, testable approach. |
| `execute`, `continue` | Complete authorized work and resume it without restarting approval. |
| `debug`, `review` | Trace failures and assess concrete defects. |
| `research`, `testing` | Gather primary evidence and run meaningful behavioral checks. |
| `verification-before-completion`, `scope` | Verify acceptance criteria and stay on the actual user request. |

These ten workflows are the complete catalog. There are no legacy profiles, command wrappers, bundled extensions, agent definitions, or administrative tools. Unknown workflow names and unregistered skill directories fail explicitly.

## Build locally

Requires Node.js 22 or newer. No dependencies need downloading for the core.

```sh
node lore/bin/lore.mjs doctor
node lore/bin/lore.mjs build --runtime codex --out dist/codex-2.0.1
node lore/bin/lore.mjs build --runtime claude --out dist/claude-2.0.1
node lore/bin/lore.mjs build --runtime portable --out dist/portable-2.0.1
```

The builder refuses to overwrite a destination. Use a new directory for an update; keep the preceding package for rollback. `./install.sh` and `lore/bin/install.sh` are compatibility entry points for the same builder. They require `--out` and never rewrite agent registries, install extensions, or launch an assistant.

## Install with the host

Run these commands only for the runtime you use. The host's installer controls the global configuration change.

**Codex:**

```sh
codex plugin marketplace add ./dist/codex-2.0.1
codex plugin add lore@lore-core
codex plugin list
```

Start a new chat and invoke `$lore:plan` or another core workflow. Codex packages set explicit activation policy. If an older Lore package is already enabled from another marketplace, disable that older package in the host's plugin settings before enabling the replacement to avoid duplicate names. Building a package does not disable existing installations.

**Claude Code:**

```sh
claude plugin validate ./dist/claude-2.0.1/.claude-plugin/plugin.json
claude plugin marketplace add ./dist/claude-2.0.1
claude plugin install lore@lore-core
```

Start a new session and invoke `/lore:plan`. Skills are native; no duplicate slash-command wrappers are included in the built package.

**Other Agent Skills hosts:** register or copy the built `skills/` directory using that host's documented mechanism. Each skill includes its complete runtime contract, so activation does not depend on hooks, MCP, a global instructions file, or a vendor-specific task API. Do not assume an arbitrary host will support Codex or Claude plugin manifests.

## Optional components

Add advisory hooks and a read-only MCP catalog:

```sh
node lore/bin/lore.mjs build --runtime codex --out dist/codex-with-integrations --hooks --mcp
```

Hooks are supported only in Codex/Claude packages and never replace host safeguards. MCP is standard stdio with two read-only tools: list workflows and load one workflow. For portable hosts, `--mcp` writes a registration with the final absolute package path; import it using the host's MCP configuration mechanism. There are no arbitrary filesystem, shell-runner, or background telemetry tools in the core server.


## Inspect and verify

```sh
node lore/bin/lore.mjs list
node lore/bin/lore.mjs show execute
npm test --prefix lore
```

`doctor --tools FILE.json` accepts a JSON array of actual tool names and reports recognized capabilities. Without an inventory it reports no assumed capabilities. It neither probes credentials nor contacts providers. In a generated package, `doctor` verifies the SHA-256 build inventory and reports changed, missing, or unexpected files. The same check runs before the CLI or MCP catalog loads packaged workflows. The inventory detects accidental changes; it is not a cryptographic signature or a substitute for trusting the package source.

Tests exercise real package builds, native subprocesses, MCP stdio, hook payload adapters, input validation, path confinement, concurrent build collisions, symlink handling, strict metadata, package integrity, and preservation of existing files. Host plugin discovery and interactive model behavior are separate verification levels. See [runtime architecture](docs/runtime-architecture.md), [validation results](docs/runtime-validation.md), and [the agent guide](AGENTS.md).

The independently installed `i-have-adhd` skill can control output style alongside Lore. Lore's runtime contract defers to that presentation preference without weakening acceptance criteria.
