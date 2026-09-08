# Lore development guide

The repository root is the development workspace. `lore/` is the source package; `dist/` contains generated runtime packages and is ignored by Git. Installed copies under a user's agent directory are not the source of truth.

Read `README.md` and `docs/runtime-architecture.md` before changing packaging. The canonical portable workflows are the names in `lore/lore.json`'s `core` list. Edit `lore/skills/<name>/SKILL.md` first. The manifest lists the entire catalog. Do not add a legacy fallback or infer workflows from unregistered directories.

Keep domain workflow decisions independent of provider tool names, model IDs, home-directory layouts, and mandatory delegation. Host permissions and user instructions always govern. Hooks and MCP must remain independently opt-in. Do not bundle extensions or write agent registries. Preserve dirty files; user-owned files removed during the standalone-core cleanup have an external recovery copy documented in docs/runtime-validation.md.

Verify with `npm test --prefix lore`, `node lore/bin/lore.mjs doctor`, and `git diff --check`. For packaging changes, build all supported runtime artifacts and validate with available host discovery/validation commands in isolated configuration directories. A protocol test or package validator does not prove interactive model behavior; report that boundary.

Version source: `lore/lore.json`. Keep `lore/package.json` and the source `.claude-plugin/plugin.json` version aligned. Runtime manifests are generated from that version. Removed workflows and compatibility components are not retained in the repository or packages.

Automatic drift tracking is required by the user. Preserve `lore/drift/` and `--drift` packaging. It is independent of the ten-workflow catalog. Run its Python tests for drift changes; do not remove it as legacy workflow machinery.
