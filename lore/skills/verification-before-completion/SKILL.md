---
name: verification-before-completion
description: "Verify acceptance criteria before claiming that code, installation, or live behavior works."
---

# Verification Before Completion

1. Re-read the requested outcome and latest corrections. Map each acceptance criterion to a concrete artifact or observable result.
2. Run relevant verification on the final files. Capture command exits and actual output. Confirm installation through fresh runtime discovery, not merely the presence of a directory.
3. Check the diff for unrelated changes and preserve user-owned work. Inspect integration points, generated artifacts, referenced assets, and rollback where the change affects installation or configuration.
4. Keep evidence levels separate: a parser check is not runtime execution; a successful build is not interactive or physical operation; a self-review is not independent verification.
5. If criteria remain unsatisfied, continue the work or state the concrete blocker. Report completion only for what the evidence proves. Do not generate invented results or silently narrow the requested deliverable.
