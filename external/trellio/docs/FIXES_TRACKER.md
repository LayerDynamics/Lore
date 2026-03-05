# DefTrello Documentation Fixes Tracker

> Created: 2026-02-13
> Status: Complete

## High Priority

- [x] **FIX-01**: Crash recovery workflow sends duplicate messages — no deduplication logic
  - File: `AgentSystemSetup.md`
  - Fix: Added Static Data tracking with tier-based deduplication. Tracks `lastTierSent` and `lastNudgeTime`. Only sends when escalating to a new tier or 24+ hours since last nudge. Resets tracking when user becomes active.

- [x] **FIX-02**: n8n Docker Compose uses deprecated auth environment variables
  - File: `AgentSystemSetup.md`
  - Fix: Removed `N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`. Updated `WEBHOOK_URL` to `N8N_WEBHOOK_URL`. Added note explaining n8n creates owner account on first launch. (Also covers FIX-13.)

- [x] **FIX-03**: Slack MCP GitHub repo link doesn't match npm package used
  - Files: `AdhdTrelloSetup.md`, `AgentSystemSetup.md`
  - Fix: Replaced with `@modelcontextprotocol/server-slack` and official MCP servers repo URL. Then superseded by full Slack→Twilio migration (Slack MCP removed entirely).

## Medium Priority

- [x] **FIX-04**: "Six Power-Ups" but only five listed
  - File: `AdhdTrelloSetup.md`
  - Fix: Changed to "four" (after removing Slack Power-Up during Twilio migration).

- [x] **FIX-05**: List emoji icons inconsistent across files
  - File: `AdhdLeadsGuideToManagingTeams.md`
  - Fix: Changed `🎯 Today` → `⭐ Today` and `⚡ Doing` → `🔥 Doing`. All three files now consistent.

- [x] **FIX-06**: Energy labels — File 1 missing "Brain Dead" and uses wrong color for Medium
  - File: `AdhdLeadsGuideToManagingTeams.md`
  - Fix: Added `🟣 Brain Dead` label, changed `🟡 Medium` to `🟠 Medium Energy`. All three files now have 4 matching energy labels.

- [x] **FIX-07**: Numbered lists restart at 1 after code blocks (4 occurrences)
  - File: `AgentSystemSetup.md`
  - Fix: Continued numbering correctly after Trello MCP JSON (→4,5,6,7), Calendar MCP JSON (→3,4,5), and Claude Project prompt (→4,5). Slack section was replaced entirely.

- [x] **FIX-08**: High Energy label reused for urgency — conflicts with energy system
  - File: `AgentSystemSetup.md`
  - Fix: Changed Rule 5 companion to use dedicated `⚠️ Due Soon` label (yellow). Added blockquote with label creation instructions and explanation of why energy and urgency labels should be separate.

## Low Priority

- [x] **FIX-09**: Today WIP limit varies across files (3-5 / 5-7 / 5)
  - Files: `AdhdTrelloSetup.md`
  - Fix: Changed "5-7" to "5" in File 2. File 1 stays at "3-5" as a general recommendation range. File 3 already at "5".

- [x] **FIX-10**: Unused variable `list` in Morning Briefing code
  - File: `AgentSystemSetup.md`
  - Fix: Removed `const list = c.json.idList;` (was just an ID, not useful without additional API lookup).

- [x] **FIX-11**: Calendar dedup approach differs between files
  - File: `AdhdTrelloSetup.md`
  - Fix: Changed "n8n's built-in database node" to "n8n's Static Data (via `$getWorkflowStaticData('global')`)" to match File 3.

- [x] **FIX-12**: Dual H1 headings at top of AgentSystemSetup.md
  - File: `AgentSystemSetup.md`
  - Fix: Changed line 3 from `#` to `###`.

- [x] **FIX-13**: `WEBHOOK_URL` should be `N8N_WEBHOOK_URL` in Docker Compose
  - File: `AgentSystemSetup.md`
  - Fix: Updated env var name. (Handled as part of FIX-02.)

- [x] **FIX-14**: Card description `\n` may be literal string in Trello node
  - File: `AgentSystemSetup.md`
  - Fix: Used string concatenation in Trello node expression. Added blockquote note explaining Code node fallback if literal `\n` appears.

## Additional Change: Slack → Twilio SMS Migration

All three files updated to replace Slack with Twilio SMS (~$1.50-2.50/mo):

- **AdhdLeadsGuideToManagingTeams.md**: Slack Power-Up → Twilio SMS entry. Slack task capture → Trello email-to-board / mobile app. Week 3 integration → Twilio setup. All remaining Slack refs updated.
- **AdhdTrelloSetup.md**: Full architecture/data flow updated. Cost table updated. All 6 workflow descriptions updated. MCP servers reduced from 4 to 3. Crash recovery tiers updated. All Q&A answers updated.
- **AgentSystemSetup.md**: Architecture diagram updated. Power-Up table reduced to 4. Slack MCP section replaced with Twilio setup section. Claude Project prompt updated. All 6 workflow pipelines updated (Slack nodes → Twilio nodes). Workflow 3 rewritten from Slack-to-Trello → Email-to-Trello. Cost summary and URL reference tables updated.
