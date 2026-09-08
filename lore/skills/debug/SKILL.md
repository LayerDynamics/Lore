---
name: debug
description: "Diagnose reproducible failures, test causal hypotheses, and verify the actual fix."
---

# Debug

1. Capture the exact failure, command or trigger, environment, and expected behavior. Reproduce with the smallest relevant case. Distinguish observed failure from user report and inference.
2. Trace the failing path through the actual source and runtime evidence. Check assumptions about repository, target, configuration, inputs, and capability availability before changing code.
3. Form one causal hypothesis and choose a bounded observation that can disprove it. Avoid stacking speculative fixes. After repeated failed attempts, reconsider the shared assumption rather than repeating variations.
4. Implement the fix at the responsible boundary. Add a regression check when it exercises meaningful behavior. Preserve unrelated edits and avoid environment-wide repair without evidence.
5. Re-run the reproduction and relevant integration checks. Report the root cause, change, observed result, and anything not verified on the real target.
