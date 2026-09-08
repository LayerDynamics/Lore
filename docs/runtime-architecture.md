# Standalone runtime architecture

## One source of truth

`lore/lore.json` defines the entire ten-workflow catalog and package version. `runtime/catalog.mjs` reads exactly those canonical `skills/<name>/SKILL.md` files. It rejects invalid versions, duplicate names, directory/name mismatches, empty bodies, malformed frontmatter, path escapes, and unregistered workflow directories.

There is no command fallback, tier system, legacy profile, extension registry, or hidden catalog. Each workflow contains a short domain procedure; `runtime/contract.md` supplies provider-neutral rules. Rendering inserts that contract once, including when reading a generated package.

Lore's maintained frontmatter uses `name` and `description` scalar fields. The parser accepts plain text, JSON double-quoted strings, and YAML single-quoted strings; it rejects unsupported structures instead of guessing. Generated frontmatter uses JSON-quoted descriptions, which are valid YAML scalars.

## Packaging

`bin/lore.mjs` → `runtime/build.mjs` → validated catalog → native skills → runtime manifests → integrity inventory.

Builds are offline and require an explicit destination outside the source. Files are staged in a unique sibling directory, validated, and inventoried. The builder exclusively reserves the destination before publishing; competing builds cannot replace each other's result. Failed staging is cleaned up, while unexpected user files are preserved. Symlinked skill assets and source-contained targets are rejected.

`BUILD.json` records the runtime, version, options, workflow names, and SHA-256 hashes of package files. Catalog loading and `doctor` verify that inventory for generated packages. Missing, changed, or additional files fail verification. Source checkouts intentionally have no build inventory. This detects accidental drift, not malicious alteration of both data and inventory; no signing or trust guarantee is claimed.

No operation rewrites a user's plugin registries, authentication, or global settings. Install generated artifacts through the host's native installer. Old installers, helper libraries, arbitrary filesystem/shell gateways, telemetry, templates, agent definitions, and third-party code are removed from the repository.

## Runtime boundaries

| Runtime | Package | Optional integration |
| --- | --- | --- |
| Codex | Native plugin and marketplace manifests; skills with explicit activation policy | Two advisory hooks and read-only MCP |
| Claude Code | Native plugin and marketplace manifests; native skills | Two advisory hooks and read-only MCP |
| Portable | Standard Agent Skills directory plus CLI | Standard stdio MCP; no universal hook API assumed |

`capabilities.mjs` maps a supplied tool inventory to operations without selecting a model. Unknown tools do not imply available capabilities. Workflow instructions use the host's configured model, supported operations, and existing authorization. Delegation falls back to sequential execution when unavailable or unauthorized. Output-style skills such as i-have-adhd control presentation without changing acceptance criteria.

Optional hooks normalize supported event payloads, inject the runtime contract at session start, and provide a nonblocking evidence reminder at stop. They never grant permission or claim to establish test success. Host safeguards remain authoritative.

## MCP

`runtime/mcp.mjs` exposes only `lore_list_workflows` and `lore_get_workflow`. There are no filesystem mutation, arbitrary command execution, or extension-management tools. It uses newline-delimited JSON-RPC, version negotiation, bounded messages, strict arguments, request-ID preservation, and notification handling. The complete registered catalog is validated at startup and workflow content is checked again when loaded.

## Standards and verification

- [Agent Skills specification](https://agentskills.io/specification): directory layout and scalar frontmatter.
- [Codex skill documentation](https://developers.openai.com/codex/skills): native skill discovery and activation metadata.
- [Claude plugin reference](https://code.claude.com/docs/en/plugins-reference): plugin and hook registration format.
- [MCP stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports): newline-delimited messages and protocol-only stdout.

Unit and subprocess tests cover behavioral contracts. The optional host-discovery script installs into temporary configuration directories and uses native host discovery. Those tests do not establish model response quality; that requires separately specified model cases and evaluation criteria.

## Updates

Build a new versioned directory, verify it, and switch the host registration. The builder never overwrites a preceding package. Portable MCP registration contains the final absolute destination; rebuild that registration if moving the package. Native plugin launchers resolve their root from host-provided variables and support paths containing spaces.
