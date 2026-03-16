---
name: man
description: "Unix-style manual lookup for any lore component — skills, commands, agents, hooks, extensions, and MCP tools."
argument-hint: "<component-name> [--type skill|command|agent|hook|extension|mcp]"
---

# Lore: Man

Look up any lore component by name and display a structured man page. If no argument is given, print an index of all components.

## Step 1: Parse Arguments

Extract from the user's input:
- **component_name**: The name to look up (may be empty)
- **type_filter**: Optional `--type` value to narrow search to one category

Strip any `lore:` or `/lore:` prefix from the component name (e.g., `/lore:debug` → `debug`).

If **no component_name** is provided, go to **Step 2 (Index Mode)**.
If a **component_name** is provided, go to **Step 3 (Lookup Mode)**.

---

## Step 2: Index Mode (no arguments)

Scan the lore plugin directory for all components:

```
Glob: lore/skills/*/SKILL.md
Glob: lore/commands/*.md
Glob: lore/agents/*.md
Glob: lore/hooks/hooks.json
Glob: lore/extensions/*/
```

For each component, read the frontmatter or first lines to extract the name and a short description.

Output in this format:

```
LORE MANUAL — [N] components

SKILLS ([count])
    name                  short description
    ...

COMMANDS ([count])
    name                  short description
    ...

AGENTS ([count])
    name                  short description
    ...

HOOKS ([count])
    name                  event type
    ...

EXTENSIONS ([count])
    name                  short description
    ...

Use /lore:man <name> for details on any component.
```

List every component found. Do not omit any. Stop here — do not proceed to Step 3.

---

## Step 3: Lookup Mode (with component name)

Search for the component in this order, stopping at the first match. If `--type` is specified, search only that category.

### 3a. Search Order

1. **Skills**: Check `lore/skills/<name>/SKILL.md`
2. **Commands**: Check `lore/commands/<name>.md`
3. **Agents**: Check `lore/agents/<name>.md`
4. **Hooks**: Read `lore/hooks/hooks.json`, search for entries where the script path or event name contains the search term
5. **Extensions**: Check `lore/extensions/<name>/` for `README.md`, `plugin.json`, or `.claude-plugin/plugin.json`
6. **MCP tools**: If name matches pattern `mcp__<server>__<tool>`, note as MCP tool reference

### 3b. Fuzzy Matching

If no exact match is found:
- Search for files containing the name as a substring (e.g., `debug` matches `systematic-debugging`)
- Search across all categories unless `--type` restricts it
- If multiple matches are found, list them and ask the user to pick one:
  ```
  Multiple matches for "debug":
    1. skill: systematic-debugging
    2. command: debug
    3. agent: (none)
  Which one? (or re-run with --type)
  ```

If still no match, report:
```
No manual entry for "<name>".
Use /lore:man to see all available components.
```

### 3c. Read and Display

Once the component file is found, **read the full file**. Then synthesize a man page in this format:

```
NAME
    lore:<name> — <description from frontmatter or first heading>

SYNOPSIS
    /lore:<name> <argument-hint if present, or inferred usage>

TYPE
    <skill | command | agent | hook | extension>

DESCRIPTION
    <2-3 sentence synthesis of what this component does, derived from
     reading the file content. Do not copy-paste — summarize.>

PHASES / STEPS
    1. <Phase or step name> — <one-line summary>
    2. ...
    (Only include if the component has structured phases/steps)

KEY RULES
    - <Extracted rules, constraints, or important behaviors>
    - ...
    (Only include if the component specifies rules or constraints)

SEE ALSO
    /lore:<related-1>, /lore:<related-2>
    (Infer related components from content — e.g., if a skill references
     another command, list it here. If none are apparent, omit this section.)

EXAMPLES
    /lore:<name> <example invocation>
        <brief description of what it does>
```

**Rules for the man page output:**
- Use the exact format above with section headers in ALL CAPS
- Indent content under each section with 4 spaces
- Keep DESCRIPTION to 2-3 sentences maximum
- PHASES should be a numbered list with one line per phase
- KEY RULES should be a bulleted list
- SEE ALSO should reference real components you know exist
- EXAMPLES should show at least one realistic invocation
