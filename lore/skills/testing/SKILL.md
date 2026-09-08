---
name: testing
description: "Select and execute meaningful checks for changed behavior, with accurate runtime evidence."
---

# Testing

1. Identify the behavior being changed and its failure modes. Read the existing test harness and select checks that exercise public behavior and integration boundaries.
2. Use temporary fixtures for configuration, installation, and file mutation tests. Cover collisions, rollback, malformed inputs, unsupported capabilities, and preservation of unrelated files where relevant.
3. Run real tests with the project's installed tooling. Read complete failure context and exit status. A mocked provider response only validates the adapter contract; label it accordingly.
4. Fix regressions caused by the change and rerun affected checks. Expand the test scope when new evidence warrants it, not as a ritual. Do not write tests that merely duplicate the implementation.
5. Report exact commands and observed counts. Distinguish unit, protocol, package discovery, interactive model behavior, and live-device evidence. Never claim an unexecuted runtime passed.
