---
name: design
description: "Design a system or refactor around observed constraints, interfaces, and runtime capabilities."
---

# Design

1. Establish the concrete problem and inspect the current implementation. Record what must be preserved, including dirty files, public APIs, supported runtimes, and data formats.
2. Define the smallest coherent architecture that satisfies the whole request. Separate provider-independent domain behavior from adapters for tool naming, event payloads, installation, and optional services.
3. Compare alternatives only where a decision changes compatibility, complexity, cost, or risk. Choose using evidence; do not force a new approval if the user has already authorized the design work.
4. Specify contracts, failure behavior, migration/rollback, and meaningful integration checks. Detect capabilities instead of branching on model generations. Optional integrations must not become implicit installation dependencies.
5. Implement when authorized. Keep the design aligned with the delivered code and report unsupported runtime boundaries explicitly.
