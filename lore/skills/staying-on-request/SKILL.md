---
name: staying-on-request
description: Use when you discover adjacent issues, feel tempted to refactor, or are about to do more than what was explicitly asked
---

# Staying On Request

You were given a specific task. That task has a boundary. Honor it.

## The Rule

**Do exactly what was asked. Nothing more.**

If the user asked to fix a bug in function X, fix that bug. Do not:
- Refactor the function while you're in there
- Fix adjacent bugs you notice
- Add error handling that wasn't asked for
- Improve types, imports, or formatting in the file
- Add tests that weren't requested
- Update documentation unless asked

## When You Find Something Adjacent

Do this, in this order:

1. **Note it** — add a `// TODO: [issue found]` comment, or just hold it mentally
2. **Finish the task** — complete exactly what was asked
3. **Surface it after** — tell the user: "While working on X, I noticed Y. Want me to address that separately?"
4. **Wait for permission** — do not act on it until asked

## When the Task Gets Complex

If you realize the request is larger than it appeared:

1. **Stop before expanding scope** — do not just start doing more
2. **Report the complexity** — "This requires touching 5 files instead of 1. Here's why..."
3. **Ask how to proceed** — "Want me to do the full scope, or just the minimal fix?"

## Commit Discipline

Commit exactly the change that was requested. If you are about to `git add .` and the diff includes unrequested changes, split the commit or ask the user.

## Signs You've Drifted

- You're editing a file that wasn't in the original plan
- You're "cleaning up" code you weren't asked to change
- You're adding features "while you're in there"
- The diff is significantly larger than expected
- You're solving a problem the user didn't mention

When you notice any of these: stop, assess, ask.