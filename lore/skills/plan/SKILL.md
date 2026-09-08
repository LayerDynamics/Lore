---
name: plan
description: "Turn an authorized engineering request into an evidence-based plan with acceptance criteria."
---

# Plan

1. Locate the actual repository, read its agent guide, and inspect dirty state. Confirm the requested outcome from the conversation before choosing files or installations to change.
2. Read the relevant entry points and existing checks. Identify constraints, runtime dependencies, user-owned files, and evidence needed to establish success. Resolve routine choices directly; ask one focused question for a material ambiguity.
3. Write a bounded sequence of implementation tasks. Give each task its affected files, dependencies, observable acceptance criteria, and relevant verification command or manual gate. Use the host task tracker or the designated plan file.
4. Mark uncertain assumptions explicitly. Separate source/build proof from device, UI, or production proof. Do not assume model/provider features that the current session does not expose.
5. If the user requested planning only, return the plan. If implementation is already authorized, execute it without asking again. Update the plan when user corrections change the scope.
