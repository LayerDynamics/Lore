---
description: Architecture design, specification writing, and implementation planning. Three modes — outline (components, interfaces, data flow), spec (complete architecture document), and roadmap (milestones, trade-offs, task breakdown).
argument-hint: "<feature> [--mode outline|spec|roadmap]"
---

# design: Design

**Load the design skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the feature or system to design and an optional `--mode` flag. Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is empty, ask: "What are you designing? Optionally specify a mode: --mode outline, --mode spec, or --mode roadmap (default: outline)."

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional.
