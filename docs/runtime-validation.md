# Standalone-core validation — 2026-09-08

Version 2.0.0 removes the 77 legacy workflow entries and the compatibility paths that loaded them. The source repository is `/Users/ryanoboyle/lore`.

## Removal completed

- Exactly ten canonical workflow directories remain. All legacy workflows, command wrappers, and in-repository legacy archives are removed.
- Bundled extensions, vendored runtime repositories, old administrative MCP gateways, helper libraries, agent definitions, templates, and old hook scripts are removed from the source tree.
- The old full-profile and extra-skill CLI switches are removed and rejected. Discovery fails on unregistered workflow directories rather than silently adding content.
- Generated 1.1.0 packages containing legacy content were moved outside the repository. Only current 2.0.0 runtime packages remain under `dist/`.

Recovery copy: `/Users/ryanoboyle/lore-removal-backup-20260908-105437`. `REMOVED.json` records the removed paths. User-modified hook registrations, drift scripts, the uninstall script, code-to-list-review files, and the modified vendored .DS_Store were preserved in that external copy before removal. Unrelated repository documentation and files were left in place.

## Refinements

The manifest is validated for version, unique names, required metadata, and valid workflow identifiers. Maintained frontmatter must contain matching name/description scalar fields and a nonempty workflow body. The obsolete helper library and fallback parser are no longer dependencies.

Builds use unique staging directories and exclusive destination reservation, so concurrent builders cannot overwrite one another. Packages carry SHA-256 file inventories; catalog loading and doctor reject missing, changed, or extra files. This is an accidental-drift check, not package signing. Tool/event mapping uses only own properties, preventing unknown names such as constructor from being mistaken for supported capabilities.

## Executed verification

Environment: macOS, Node.js 26.5.0, Codex 0.153.4, Claude Code 2.1.12.

| Command/check | Result |
| --- | --- |
| `npm test --prefix lore` | 21 passed, 0 failed. |
| `node lore/bin/lore.mjs doctor` | Version 2.0.0; exactly 10 workflows; no inferred capabilities without supplied tool inventory. |
| `bash -n install.sh lore/bin/install.sh` | Exit 0. |
| Codex build with `--hooks --mcp` | 10 workflows, 34 inventoried files. |
| Claude build with `--hooks --mcp` | 10 workflows, 24 inventoried files. |
| Portable build with `--mcp` | 10 workflows, 21 inventoried files. |
| `python3 lore/tests/host-discovery.py` | Native host checks passed in temporary configuration directories. |
| `git diff --check` | Exit 0. |

Tests cover removed-name and removed-option rejection; malformed metadata; package collisions and concurrent builds; symlink confinement; changed/missing/extra package files; real MCP subprocess initialization, list/load calls, malformed messages, Unicode, notifications, and ID zero; and actual hook subprocess output.

Codex's native installer succeeded. A fresh app-server process found all ten enabled Lore skills and two optional hooks. Explicit-activation metadata survived installation. Doctor verified the installed cache's file inventory. The unrelated existing `.agents/skills/debug/SKILL.md` frontmatter error was not changed.

Claude validated plugin and marketplace manifests, installed through its native commands, and reported the package enabled. Those initial checks used isolated configuration. Machine-readable results are in `dist/host-validation.json`; temporary host configurations are cleaned up automatically.

## Evidence boundary

Package, protocol, and native discovery behavior were executed. No model inference or paid behavioral evaluation was run. Third-party extension behavior is no longer part of the product because the bundled extensions have been removed. The configured Linux/macOS/Windows CI matrix has not run in this local session.

## Global replacement verification

The user subsequently authorized uninstalling the old installation, installing 2.0.0 globally, and pushing the source to GitHub.

- Native uninstall removed Codex `lore@personal` and Claude `lore@local`.
- Removed Lore entries from the personal/local marketplaces, 68 stale Codex hook states, and five directly configured Claude hook commands. Other plugins were preserved.
- Old runtime source/cache folders were moved outside discovery paths to `/Users/ryanoboyle/lore-install-backup-20260908-110710`, which also contains pre-change configuration backups.
- Built durable packages under `~/.local/share/lore/2.0.0/{codex,claude}` with the two advisory hooks and read-only MCP catalog, then installed `lore@lore-core` through both native installers.
- Both global installers report version 2.0.0 enabled. Both installed caches pass doctor inventory checks (Codex 34 files; Claude 24).
- A fresh globally configured Codex app-server discovers exactly ten enabled Lore skills and two new Lore hooks, with no legacy Lore skills or hooks. Machine-readable evidence is in ignored `dist/global-validation.json`.
- `i-have-adhd@i-have-adhd` remains installed and enabled.

Existing conversations may retain their initial plugin instructions until a new session starts. Global discovery verification does not demonstrate an interactive model response.
