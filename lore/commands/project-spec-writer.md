---
description: Write a complete, production-grade project specification through guided discovery. Extracts requirements from existing materials or guides the user through targeted questions to produce a structured spec document.
argument-hint: "[project-name-or-description] [--from <file-or-url>]"
---

# project-spec-writer: Project Spec Writer

**Load the project-spec-writer skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the project name, description, or a `--from <file-or-url>` pointing to existing materials. Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is empty, the skill starts from scratch with guided discovery questions.

## Run the Full Workflow

Execute all four phases of the skill without skipping:

1. **Phase 1** — Gather source material, establish spec identity
2. **Phase 2** — Structured discovery (problem, requirements, architecture, implementation, milestones, risks)
3. **Phase 3** — Generate the spec document to `docs/specs/SPEC-<n>-<slug>.md`
4. **Phase 4** — Validate completeness and iterate

No phase is optional. No section may be left empty or marked TBD without a clear owner.
