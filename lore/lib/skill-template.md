# Skill Authoring Template

Use this template when creating new skills for Lore.

## File Structure

```
skills/<skill-name>/
└── SKILL.md
```

## SKILL.md Template

```markdown
---
name: <skill-name>
description: <When to use this skill — triggers automatic matching. Write as: "Use when [doing X], [seeing Y], or [needing Z]">
---

# <Skill Title>

## Purpose

What this skill accomplishes and why it exists.

## When to Use

- Trigger condition 1
- Trigger condition 2
- Trigger condition 3

## Process

### Step 1: [Name]

What to do and how.

### Step 2: [Name]

What to do and how.

### Step 3: [Name]

What to do and how.

## Rules

- Hard constraint 1
- Hard constraint 2

## Output

What the skill produces when followed correctly.
```

## Tips

- The `description` field is the most important part — it determines when the skill gets matched
- Keep skills focused on one workflow or concern
- Rigid skills (TDD, debugging) should be prescriptive with exact steps
- Flexible skills (patterns, conventions) should teach principles
- Include examples where they help clarify expectations
