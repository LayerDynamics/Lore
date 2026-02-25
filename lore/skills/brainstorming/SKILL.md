---
name: brainstorming
description: Use before any creative or feature work. Explores intent, requirements, and design through collaborative dialogue before implementation begins.
---

# Brainstorming

## Purpose

Turn ideas into concrete designs through structured conversation. Understand what is being built and why before writing any code.

**No implementation without a design. No design without understanding the idea.**

This applies to every project regardless of perceived simplicity. A "simple" project is where unexamined assumptions cause the most wasted work. The design can be short, but it must exist and be approved.

## Process

### 1. Explore Context

Check the current project state: files, docs, recent commits. Understand what already exists before asking about what should be built.

### 2. Ask Clarifying Questions

One question at a time. Prefer multiple-choice when possible; open-ended when necessary.

Focus on:
- What is the purpose of this feature?
- What constraints exist?
- What does success look like?

Do not overwhelm with multiple questions in a single message. If a topic needs deeper exploration, break it into follow-up questions.

### 3. Propose Approaches

Present 2-3 different approaches with trade-offs for each. Lead with your recommendation and explain why you prefer it. Let the human choose.

### 4. Present the Design

Once you believe you understand what is being built:
- Present the design in sections, scaled to complexity
- Ask after each section whether it looks right
- Cover: architecture, components, data flow, error handling, testing strategy
- Be ready to revise based on feedback

### 5. Document the Design

Save the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md` and commit it.

### 6. Transition to Implementation

With the design approved, move to creating an implementation plan. The brainstorming skill produces a design; implementation planning is the next step.

## Principles

- **One question per message** -- Do not overwhelm with a list of questions
- **Multiple choice preferred** -- Easier to answer than open-ended when possible
- **YAGNI** -- Remove unnecessary features aggressively from all designs
- **Explore alternatives** -- Always present options before settling on an approach
- **Incremental validation** -- Get approval on each section before moving forward
- **Flexibility** -- Return to earlier decisions when later questions reveal new constraints

## The Gate

Do not write code, scaffold projects, or take any implementation action until the design is presented and the human has approved it. This is a hard requirement for every project.

<!-- Inspired by Superpowers Brainstorming skill (obra) -->
