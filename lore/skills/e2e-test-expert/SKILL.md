---
description: "End-to-end test expert — writes real E2E tests that exercise full user flows through the actual system. Detects frameworks (Playwright, Cypress, Selenium), maps user journeys, enforces anti-smoke-test rules, and audits existing tests for shallow coverage."
argument-hint: "[path or feature] [--framework playwright|cypress|selenium] [--audit]"
---

# e2e-test-expert: E2E Test Expert

## Phase 1: Discovery & Configuration

### 1.1 Detect E2E Framework

Search the project for E2E framework configuration:

```
Glob: playwright.config.{ts,js,mjs}, cypress.config.{ts,js,mjs}, wdio.conf.{js,ts}, .puppeteerrc.{js,cjs,yaml}
Glob: **/package.json (check devDependencies for @playwright/test, cypress, webdriverio, puppeteer, selenium-webdriver)
```

If `$ARGUMENTS` includes `--framework`, use that framework. Otherwise detect from config files.

If no framework found:
- Ask the user which framework to use
- Recommend Playwright as default (best DX, built-in assertions, auto-wait)
- Guide minimal setup: `npm init playwright@latest` or equivalent

### 1.2 Read Configuration

Read the detected config file. Extract:
- **Base URL** — where the app runs during tests
- **Test directory** — where E2E tests live
- **Timeout settings** — global and per-test
- **Browser targets** — which browsers are tested
- **Environment variables** — any needed for test runs

### 1.3 Map Application Entry Points

Use Glob and Grep to identify:
- Routes/pages (Next.js `app/`, React Router config, Express routes, etc.)
- Auth flows (login pages, OAuth callbacks, session management)
- Critical user journeys (checkout, signup, CRUD operations)
- API endpoints the frontend calls

Output a structured list of discoverable user flows.

## Phase 2: User Journey Mapping

### 2.1 Define the Target Flow

Based on `$ARGUMENTS` or user description, map the feature/flow as a sequence of **user-visible actions**:

```
Journey: [Name]
1. User navigates to [URL/page]
2. User sees [expected content]
3. User fills [form field] with [value]
4. User clicks [button/link]
5. System responds with [expected outcome]
6. User verifies [confirmation/state change]
```

### 2.2 Anti-Smoke-Test Rule

Every step MUST have at least one assertion on **user-visible behavior**. Reject:
- Steps that only check "page loaded" (status 200)
- Steps with no assertions at all
- Assertions on CSS classes, data attributes, or implementation details
- Assertions that pass even when the feature is broken

### 2.3 Identify Side Effects

For each journey, identify what should change in the system:
- Database records created/modified/deleted
- Emails or notifications sent
- External API calls made
- Session/cookie state changes
- File uploads processed

## Phase 3: Test Implementation

### 3.1 Write the Test

Write the E2E test following these **required patterns**:

**Navigation**: Use real user navigation — click links, submit forms, follow redirects. Do NOT use direct URL navigation for intermediate steps.

**Selectors**: Prefer user-facing selectors:
- `getByRole()`, `getByText()`, `getByLabel()`, `getByPlaceholder()` (Playwright)
- `cy.contains()`, `cy.findByRole()` (Cypress)
- Avoid: `#id`, `.class`, `[data-testid]` unless no semantic alternative exists

**Assertions**: Assert on user-visible outcomes:
- Text content that appears after actions
- Navigation to expected URLs
- Form validation messages
- Success/error notifications
- Data appearing in lists/tables after creation

**Async handling**: Use proper waits:
- Playwright: `await expect(locator).toBeVisible()`, `waitForURL()`, `waitForResponse()`
- Cypress: implicit retry, `cy.intercept()` with `cy.wait()`
- NEVER use `sleep()`, `wait(5000)`, or arbitrary timeouts

**Test isolation**: Each test must:
- Set up its own test data (or use seeded data)
- Clean up after itself
- Not depend on other tests running first
- Work in any order

### 3.2 Anti-Patterns to Reject

If you catch yourself writing any of these, STOP and rewrite:

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| `page.goto(url)` + no interaction | Smoke test, not E2E | Add real user interactions |
| `cy.visit()` + only `cy.get().should('exist')` | Checks DOM, not behavior | Assert on user-visible text/state |
| Mocking backend APIs in E2E | Defeats the entire purpose | Use real backend; mock only external services |
| `expect(el.className).toContain('active')` | Implementation detail | Check visible state: text, visibility, behavior |
| Hardcoded test data with no setup | Brittle, environment-dependent | Create data in test setup or use seed scripts |
| `await page.waitForTimeout(3000)` | Flaky, slow | Use `waitForSelector`, `waitForResponse`, etc. |
| Single `expect` for entire flow | Not testing the journey | One+ assertion per user action |

### 3.3 Required Test Structure

```
describe('[Feature Name] E2E', () => {
  // Setup: create test data, authenticate if needed
  beforeEach/beforeAll

  test('[User Journey Description]', async () => {
    // Step 1: Navigate (as user would)
    // Assert: page content visible

    // Step 2: Interact (fill form, click button)
    // Assert: response/feedback visible

    // Step 3: Verify outcome
    // Assert: data persisted, confirmation shown, navigation correct

    // Step N: Complete the full journey
    // Assert: final state matches expected outcome
  });

  // Cleanup: remove test data
  afterEach/afterAll
});
```

## Phase 4: Execution & Validation

### 4.1 Run the Tests

Execute the test suite using the project's configured test runner:
- Playwright: `npx playwright test [file]`
- Cypress: `npx cypress run --spec [file]`
- WebDriverIO: `npx wdio run wdio.conf.js --spec [file]`

### 4.2 Analyze Results

For each test:
- **Pass**: Verify it actually exercised the intended path (not a false positive)
- **Fail**: Determine if failure is meaningful (real bug) or flaky (timing, environment)
- **Skip**: Explain why and create a plan to enable

### 4.3 Report

Output:
```
E2E Test Results
═══════════════
Tests written:  [N]
Tests passing:  [N]
Tests failing:  [N]
User journeys covered: [list]
User journeys missing: [list]
```

## Phase 5: Anti-Smoke-Test Audit

If `$ARGUMENTS` includes `--audit`, or after writing new tests, run this checklist on every test:

### 5.1 Real E2E Checklist

For each test file, score YES/NO:

| # | Question | Required |
|---|---|---|
| 1 | Does it test a complete user journey from start to finish? | YES |
| 2 | Does it interact with the real backend (no mocks)? | YES |
| 3 | Does it assert on user-visible outcomes (not implementation details)? | YES |
| 4 | Would a real user recognize the flow being tested? | YES |
| 5 | Does it verify side effects (data persisted, emails sent, etc.)? | YES for writes |
| 6 | Does it use proper waits (not arbitrary sleeps)? | YES |
| 7 | Does it have 2+ meaningful assertions? | YES |
| 8 | Is it independent (doesn't depend on other test order)? | YES |

### 5.2 Scoring

- **8/8 YES**: Real E2E test
- **6-7 YES**: Mostly E2E, needs minor fixes (list what's missing)
- **4-5 YES**: Borderline — significant rework needed
- **<4 YES**: Smoke test masquerading as E2E — rewrite

### 5.3 Audit Report

For each test that scores <8:
- State what's missing
- Provide the specific fix
- Rewrite the test if score is <6

## Agent Dispatch

This skill can dispatch specialized agents for parallel work:

- **e2e-test-architect** — Analyze app structure and map user journeys. Use for Phase 1-2 when the app is large or has many routes.
- **e2e-test-writer** — Write test code for a specific mapped journey. Dispatch multiple in parallel for different journeys.
- **e2e-test-auditor** — Audit existing tests against the anti-smoke-test checklist. Use for `--audit` mode or Phase 5.
