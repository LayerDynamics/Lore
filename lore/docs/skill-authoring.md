# Skill Authoring Guide

## Creating a New Skill

### 1. Scaffold

```regex
/lore:scaffold-skill my-skill-name
```

Or manually create:

```regex
skills/my-skill-name/SKILL.md
```

### 2. Write the Frontmatter

```yaml
---
name: my-skill-name
description: Use when [trigger conditions that match this skill automatically]
---
```

The `description` field is critical — it determines when Claude matches this skill to a task. Write it as trigger conditions:

**Good:** "Use when implementing any feature or bugfix, before writing implementation code"
**Bad:** "A skill for test-driven development"

### 3. Structure the Content

Every skill should have:

1. **Purpose** — What it accomplishes
2. **When to Use** — Explicit trigger conditions
3. **Process** — Step-by-step workflow
4. **Rules** — Hard constraints that must not be violated
5. **Output** — What the skill produces

### 4. Rigid vs. Flexible

**Rigid skills** (TDD, debugging): Prescriptive steps that must be followed exactly. Claude should not skip steps or adapt the order.

**Flexible skills** (patterns, conventions): Principles to apply contextually. Claude adapts the approach to fit the situation.

Mark which type your skill is in the content.

## Best Practices

- One concern per skill
- Keep skills under 200 lines — longer skills get truncated
- Use imperative language ("Do X", not "You should do X")
- Include concrete examples where helpful
- Test the skill by invoking it in a real session

## Template

See [skill template](../templates/skill/SKILL.md) for a blank scaffold.
