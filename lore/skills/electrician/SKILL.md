---
name: electrician
description: This skill should be used when the user asks to "integrate", "wire this together", "make it all work together", "connect these components", "configure these to work together", or any request to connect or integrate code components. Also use when newly implemented code exists but hasn't been hooked into the system — exported but never imported, implemented but never registered, created but never called. Ensures components that are orphaned, disconnected, or unintegrated are always connected — never dangling.
argument-hint: "<path or component> [--audit]"
---

# Electrician

Connect and wire code components so every part of the system is reachable, callable, and operational.

**No orphans. No dangling exports. No dead registrations. Every component connected or it does not ship.**

---

## When to Use This Skill

- A new module, service, handler, or class was implemented and needs connecting to the rest of the system
- Two existing components need to communicate but aren't wired together
- An API endpoint exists but is not mounted on the router
- A plugin, hook, or middleware was written but never registered
- A config key was added but nothing reads it
- `--audit` mode: scan for any orphaned, disconnected, or unregistered code in the project

---

## The Discipline

Code that exists but is not connected to anything is not working code — it is future confusion. The electrician skill treats integration as a first-class concern, not an afterthought.

Integration has layers:
1. **Import layer** — the module is imported where it is needed
2. **Registration layer** — the module is registered in a router, registry, plugin manifest, DI container, or equivalent
3. **Configuration layer** — the component's config keys exist and are read
4. **Invocation layer** — the component is actually called at runtime (not just imported)
5. **Test layer** — the integration path is covered by at least one test

Missing any layer means the component is not fully wired.

---

## Step 1: Understand What Needs Wiring

### If `$ARGUMENTS` contains a path or component name:

Read the target file(s) immediately. Understand:
- What does this component export?
- What does it depend on (imports, config, services)?
- What type of integration does it require? (see Integration Types below)

### If `--audit` is specified or no specific target is given:

Run a wiring audit (see Audit Mode at the end of this skill).

### Ask if unclear:

If the user says "wire this together" without specifying what, ask:
- What components need to be connected?
- What is the expected entry point or call site?

Do not proceed with assumptions about what needs wiring.

---

## Step 2: Map the Integration Points

For each component to be integrated, identify all five wiring layers:

```
Component: [name / path]

Import layer:     Where does this need to be imported?
                  → Find the file that owns the namespace this component belongs in

Registration layer: Where does this need to be registered?
                  → Router, manifest, index barrel, DI container, hook registry, config

Configuration layer: What config does this component need?
                  → Check for env vars, config keys, or options the component reads at init

Invocation layer: What calls this at runtime?
                  → The caller, trigger, event, or request path that reaches this component

Test layer:       What test proves the wiring works end-to-end?
                  → At minimum, an integration test that calls through to this component
```

Use `Grep` and `Glob` to find existing patterns. Before writing any integration code, read how existing components of the same type are wired — match that pattern exactly.

```bash
# Find how similar components are registered
grep -rn "register\|mount\|use(\|addRoute\|plugin\|handler" --include="*.ts" src/

# Find existing index barrels
find . -name "index.ts" | head -20

# Find all exports from a file
grep -n "^export" path/to/component.ts
```

---

## Step 3: Implement the Wiring

Work through the layers in order. **Read before editing** — always read the target file before modifying it.

### Import Layer

Add the import at the correct call site. Match the import style of the surrounding file.

```typescript
// If adding to an existing index.ts barrel:
export { MyComponent } from './my-component';

// If importing into a consumer:
import { MyComponent } from '../components/my-component';
```

After editing: read the file back and confirm the import is present and syntactically correct.

### Registration Layer

The registration pattern depends on the project type. Find and follow the existing pattern:

| Component Type | Common Registration Pattern |
|---------------|----------------------------|
| HTTP route | `router.get('/path', handler)` or `app.use('/path', router)` |
| Middleware | `app.use(middleware)` — order matters, check existing middleware order |
| Plugin | Manifest file entry or `registerPlugin(plugin)` call |
| Hook | `hooks.register('event', handler)` or manifest hooks array |
| Command | Commands array, registry map, or `registerCommand(cmd)` |
| DI service | Container bind/register call |
| Config key | Config schema and/or `.env.example` entry |
| Event handler | `emitter.on('event', handler)` or equivalent |

If the registration file is a list (array, object, or imports), add the new entry consistently with the existing style — same indentation, same trailing comma convention, same ordering logic (alphabetical, by priority, etc.).

### Configuration Layer

If the component reads config, env vars, or options:

1. Add any new keys to the config schema or `.env.example` with a clear description
2. Verify the component's config is loaded before the component initializes
3. Check for missing required values — the integration will silently fail at runtime if a required config key is absent

```bash
# Find where config is loaded
grep -rn "process.env\|config.get\|dotenv\|loadConfig" --include="*.ts" src/
```

### Invocation Layer

Confirm there is a real code path that reaches the component at runtime:

- For a route handler: make an HTTP call through the router
- For a scheduled task: confirm the scheduler entry exists
- For a plugin: confirm the plugin loader is invoked at startup
- For an event handler: confirm the event is emitted somewhere

If no invocation path exists, the component is registered but dead. Find or create the call site.

---

## Step 4: Verify the Wiring

Verification is not optional. Do not claim integration is complete without running it.

### Static verification (always do this):

- [ ] Read the modified files back — confirm the edits are correct
- [ ] Grep for the component name at all integration points — confirm it appears where it should
- [ ] Grep for any import that should have been added — confirm it is present
- [ ] Check for circular imports — `grep -n "import.*from" file.ts` and trace the chain
- [ ] Confirm no syntax errors — run linter if available (`npm run lint`, `deno lint`, etc.)

### Runtime verification (do this when possible):

Run the actual integration path. Use the minimum test that exercises the wiring:

```bash
# Run existing tests that cover the integration path
npm test -- --testPathPattern="integration|e2e"

# If the component is an HTTP endpoint, curl it
curl -X GET http://localhost:PORT/path

# If it is a CLI command, invoke it
./bin/cli my-command --help

# If it is a module, run a quick smoke test
node -e "const m = require('./dist/my-module'); console.log(typeof m.myExport)"
```

If no test exists, write a minimal integration test that proves the wiring works before marking this complete.

### Wiring verification checklist:

- [ ] Component is imported at all required call sites
- [ ] Component is registered in all required registries/routers/manifests
- [ ] Config keys exist and are read before the component initializes
- [ ] At least one code path calls the component at runtime
- [ ] Linter/compiler passes with no new errors
- [ ] At least one test covers the integration path
- [ ] No existing tests are broken by the new wiring

---

## Step 5: Wiring Report

After completing integration, produce a short report:

```
## Wiring Complete: [Component Name]

### Layers Wired
- [x] Import layer — [file where import was added]
- [x] Registration layer — [file and mechanism: router, manifest, etc.]
- [x] Configuration layer — [keys added or N/A]
- [x] Invocation layer — [code path that calls the component]
- [x] Test layer — [test that proves the wiring works]

### Files Modified
- [path] — [what changed]

### Verification
- [x] Static check passed (linter/grep)
- [x] Runtime verification: [command run and result]
- [x] All existing tests pass
```

---

## Audit Mode (`--audit` or no specific target)

Scan the project for disconnected, orphaned, or unregistered components.

### Step A: Find All Exports

```bash
# Find all exported symbols
grep -rn "^export\|module.exports" --include="*.ts" --include="*.js" src/ | grep -v "test\|spec\|\.d\.ts"
```

For each exported symbol, check whether it is imported anywhere else in the project:

```bash
grep -rn "MySymbol" --include="*.ts" src/ | grep -v "the file that defines it"
```

If an export has zero importers, it is a candidate orphan.

### Step B: Find Unregistered Handlers / Routes

```bash
# Find handler/controller/service files
find src/ -name "*.handler.ts" -o -name "*.controller.ts" -o -name "*.service.ts"

# Find registration file
grep -rn "router\|register\|mount\|use(" --include="*.ts" src/ | grep -v "node_modules"
```

Cross-reference: every handler file should appear in at least one registration. Flag any that do not.

### Step C: Find Config Keys with No Readers

```bash
# Keys defined in config or .env.example
cat .env.example | grep -v "^#" | cut -d= -f1

# Keys actually read in code
grep -rn "process.env\." --include="*.ts" src/ | sed 's/.*process.env\.\([A-Z_]*\).*/\1/' | sort -u
```

Keys defined but never read are orphaned config.

### Step D: Find Registered but Removed Components

```bash
# Items in registration/manifest that no longer have a corresponding file
# (check router files, plugin manifests, index barrels for dead references)
grep -rn "import\|require" src/index.ts | while read line; do
  # check each imported path exists
done
```

This catches the opposite problem — stale registrations pointing to deleted files.

### Audit Report Format

```
## Wiring Audit: [project or path]

### Orphaned Exports (exported, never imported)
- [file:line] — [symbol] — suggested action: [use it | remove it | it's intentional public API]

### Unregistered Components (implemented but not connected)
- [file] — [type: handler/service/plugin] — missing registration in [where]

### Orphaned Config Keys (defined but never read)
- [key] — defined in [file], never read in code

### Dead Registrations (registered but source missing)
- [registration file:line] — references [path] which does not exist

### Summary
[N] orphans found — [N] require action, [N] are intentional public API
```

After the audit, ask the user which orphans to wire up and proceed with Step 2 for each.

---

## Integration Types Reference

| Type | Where to Look | What to Add |
|------|--------------|-------------|
| HTTP route | Router file (`routes.ts`, `router.ts`, `app.ts`) | `router.METHOD('/path', handler)` |
| Express middleware | `app.ts` or `server.ts` | `app.use(order-matters)` |
| CLI command | Command registry or `commands/index.ts` | Export or register entry |
| Plugin / extension | Plugin manifest (`plugin.json`, `plugins.ts`) | Manifest entry |
| Hook | Hook registry or `hooks.json` | Event + handler registration |
| Scheduled job | Scheduler config or cron registry | Cron entry |
| DI service | Container setup (`container.ts`, `inversify.config.ts`) | Bind/register call |
| Event handler | Event emitter setup | `emitter.on(event, handler)` |
| Config key | `.env.example`, config schema, `config.ts` | Key definition + reader |
| Index barrel | `index.ts` in module directory | Re-export line |
| Test fixture | Test setup file | Fixture registration |

---

## Red Flags: You Are Not Done

Stop and fix if any of these are true:

- You added an import but did not verify it is actually used (linter will flag unused imports)
- You registered a handler but did not confirm a request path reaches it
- You wired a config key but did not confirm the key is present in `.env.example` or has a default
- You claim integration is complete but have not run any verification command
- You modified a file but did not read it back to confirm the edit is correct
- You wrote "it should work now" without running anything
- A test fails and you moved on anyway
- The component is imported but the import is behind a condition that never evaluates to true

---

## Wiring Anti-Patterns

**Ghost registration** — component is in the manifest but the file does not exist or the export name changed. Always verify the import path resolves.

**Ordering violations** — middleware registered after a route that needs it. Configuration loaded after the component that reads it. Always check initialization order.

**Circular wiring** — A imports B, B imports A. Introduce a shared abstraction or inversion of dependency. Never ignore circular import warnings.

**Silent no-op integration** — component is imported and registered but the invocation path is guarded by a feature flag, environment check, or condition that is always false in development. Verify the path is reachable in the current environment.

**Duplicate registration** — component registered twice (once by hand, once by auto-discovery). Results in double execution, double middleware, or startup errors. Grep the registration file before adding a new entry.
