# The complete ADHD agent system for under $45/month

**The optimal architecture combines Trello Standard ($5/mo), self-hosted n8n on a $5–10 VPS, Claude Pro with MCP servers ($20/mo), and Claude Haiku API calls (~$5–10/mo) — totaling $35–45/month for a fully automated ADHD productivity system with proactive coaching, crash recovery, and cross-tool orchestration.** This setup delivers unlimited automation runs, direct AI-to-tool integration via MCP, and scheduled accountability workflows — all deployable in a single weekend. The most critical design insight: build the crash recovery system *first*, because for ADHD users, system abandonment isn't a risk — it's a certainty that must be engineered around.

---

## Architecture overview: three layers, one brain

The system operates as a three-layer stack with Claude serving as the unified intelligence layer across all three.

**Layer 1 (Foundation)** is the Trello board itself — a 5-list kanban system with Butler automation rules, energy labels, and WIP limits that functions even without AI. This layer works standalone if everything else breaks. **Layer 2 (Orchestration)** is n8n, self-hosted on a cheap VPS, running scheduled workflows that bridge Trello, Google Calendar, Gmail, and Twilio — capturing tasks, syncing due dates, sending reminders, and flagging stale work. **Layer 3 (Intelligence)** is Claude, operating in two modes: as a proactive agent called by n8n workflows via the Haiku API for automated daily planning and accountability nudges, and as an interactive coach via Claude Desktop with MCP servers for on-demand conversation that can directly read and write to Trello and Calendar.

The data flows like this: inputs arrive from text messages, emails, and calendar events → n8n captures and routes them into Trello's Inbox list → Butler rules manage card lifecycle within the board → n8n's scheduled workflows call Claude's API to generate prioritized daily plans, energy-matched task suggestions, and accountability check-ins → Claude delivers these via SMS → for interactive coaching sessions, Claude Desktop + MCP connects directly to all tools. The entire system is designed so that every component degrades gracefully — if the VPS goes down, Trello and its Butler rules still work; if the user stops engaging, the crash recovery system escalates contact attempts.

**Monthly cost breakdown:**

| Component | Monthly cost | What it provides |
|-----------|-------------|-----------------|
| Trello Standard | $5 | Board, Butler (1,000 runs), Custom Fields, Power-Ups |
| VPS (Hetzner/Railway) | $5–10 | Hosts n8n (unlimited workflows/executions) |
| Claude Pro subscription | $20 | Interactive coaching, Claude Projects, Claude Desktop + MCP |
| Claude Haiku 4.5 API | $5–10 | ~50–100 automated calls/day for n8n workflows |
| MCP servers | $0 | Free open-source, connect Claude to Trello/Calendar/Gmail |
| Twilio SMS | $1.50–2.50 | Notifications, reminders, crash recovery nudges |
| Power-Ups | $0 | Calendar, List Limits, Card Repeater, Card Aging — all free |
| **Total** | **$37–48** | Complete 3-layer system |

---

## Layer 1: The Trello board that runs itself

Trello Standard at **$5/month** provides the minimum viable plan. You need Standard (not Free) for two reasons: Custom Fields for time estimates and priority tracking, and **1,000 Butler automation runs/month** versus Free's 250. The estimated usage for a full ADHD setup is approximately **441 runs/month**, leaving comfortable headroom. If automation becomes intensive, Premium at $10/month offers unlimited runs plus built-in Calendar and Timeline views.

### Board structure and labels

Create five lists from left to right: **📥 Inbox** (unlimited, zero-judgment brain dump), **📅 This Week** (15–20 card limit, curated during weekly review), **⭐ Today** (5 card limit, prevents overwhelm), **🔥 Doing** (1–2 card limit — the most critical ADHD guardrail), and **✅ Done** (no limit, auto-archived after 3 days). The single-card WIP limit on Doing enforces single-tasking, which is the one structural decision that makes the entire system work.

Energy labels use a traffic-light system: 🔴 **High Energy** (red — deep focus work like writing or analysis), 🟠 **Medium Energy** (orange — emails, planning, meetings), 🟢 **Low Energy** (green — routine autopilot tasks), and 🟣 **Brain Dead** (purple — zero-effort work for crash days). Filter cards by label using Trello's `F` key shortcut to instantly see only tasks matching your current capacity.

Add four Custom Fields: a **Time Estimate** dropdown (5 min, 15 min, 30 min, 1 hour, 2+ hours), **Task Type** dropdown (Deep Work, Communication, Admin, Creative), **Priority** dropdown using the Eisenhower matrix (🔥 Urgent+Important, ⭐ Important, ⚡ Urgent, 📋 Backlog), and a **Quick Win** checkbox for sub-5-minute tasks that build momentum.

### Six Butler automation rules

All four Power-Ups needed are **free on every plan** — Calendar, List Limits, Card Repeater, and Card Aging. Here are the Butler rules to create, each taking 2–5 minutes to set up:

**Rule 1 — Auto-complete on Done:** When a card moves to Done, mark due date complete and check all checklist items. **Rule 2 — Auto-setup on Doing:** When a card moves to Doing, add a standard checklist from a template card, set due date 4 hours from now, and join the card. **Rule 3 — Daily board reset:** Scheduled every weekday at 7 PM, move all cards in Today back to the top of This Week. This ensures a fresh start every morning without guilt about yesterday's unfinished work. **Rule 4 — Recurring tasks:** Use Card Repeater Power-Up (not Butler) for daily standup prep and weekly review cards — this saves Butler runs. Card Repeater creates copies on schedule without consuming automation quota. **Rule 5 — Due date surfacing:** When a card's due date arrives, auto-move it to the top of Today. Set a companion rule to surface cards to This Week one week before due. **Rule 6 — Auto-archive:** Scheduled daily at 11 PM, archive all cards that have been in Done for more than 3 days.

The total setup time for the complete Trello layer is approximately **80 minutes**.

---

## Layer 2: n8n orchestrates everything for $5–10/month

**n8n self-hosted is the clear winner** for the automation platform. It costs $0 for the software (fair-code license, free for personal use) with unlimited executions, unlimited workflows, and native integrations for Trello, Google Calendar, Gmail, Twilio, plus built-in Claude API and OpenAI nodes with LangChain agent capabilities. The only cost is the VPS.

### Why n8n beats every alternative

The critical difference is how platforms count usage. n8n counts **1 execution per complete workflow run** regardless of steps. A 6-step workflow running 200 times/day costs 200 executions. Make.com would count that as **1,200 operations** (6 steps × 200). Zapier would count **1,200 tasks**. For the volume of automation this ADHD system requires (approximately 50–200 runs/day), here's what each platform actually costs:

| Platform | Monthly cost for this use case | Why |
|----------|-------------------------------|-----|
| **n8n self-hosted** | **$5–10** (VPS only) | Unlimited everything |
| Activepieces self-hosted | $5–10 | MIT license, fewer integrations (632 vs 1,900) |
| Make.com | $16–29 | Credit consumption requires careful monitoring |
| Activepieces Cloud | ~$25 | Predictable pricing, unlimited runs |
| n8n Cloud Starter | ~$22 | 2,500 executions may be tight |
| Pipedream | $29–49 | Fewer no-code features |
| Zapier | $100–300+ | Prohibitively expensive for multi-step workflows |

**Hosting recommendation:** Deploy n8n on **Railway** (~$5/month with usage-based pricing, 1-click deploy from template, PostgreSQL included) or a **Hetzner VPS** (~€5/month, best performance-per-dollar, requires manual Docker setup). Avoid Render — it costs $25+ for the web service plus $19+ for PostgreSQL.

### The six core n8n workflows to build

**Workflow 1 — Email-to-Trello task capture:** Tasks are captured via Trello's built-in email-to-board feature (every board has a unique email address that creates cards in a designated list) or added directly to the board via Trello's mobile app. For enhanced processing, n8n monitors a designated email inbox/folder via IMAP trigger → Claude Haiku API call parses incoming task emails to extract task title, priority, and energy level → creates a structured Trello card in Inbox with appropriate labels and custom fields → sends a Twilio SMS confirmation with the card title and assigned priority. This lets the user forward or send any email to their task inbox and have it automatically become a structured Trello card.

**Workflow 2 — Trello-to-Google Calendar sync:** Schedule trigger every 15 minutes → fetch all Trello cards with due dates → compare against existing Google Calendar events → create/update calendar events for new or changed cards. For reverse sync (Calendar → Trello), a separate workflow uses Google Calendar webhook triggers to update Trello card due dates when calendar events change. **Deduplication logic is critical** — store a mapping of Trello card IDs to Calendar event IDs in n8n's Static Data (via `$getWorkflowStaticData('global')`) to prevent infinite loops.

**Workflow 3 — Smart reminders via SMS:** Schedule trigger at configurable intervals → query Trello for cards due within 2 hours → check if reminder already sent (using n8n's static data) → send SMS via Twilio with task details, time estimate, and energy level. Include simple reply keywords: reply "GO" to mark as started, "30" to snooze 30 minutes, "TMW" to move to tomorrow.

**Workflow 4 — Morning planning briefing:** Cron trigger at 7:30 AM → fetch today's Trello cards, Google Calendar events, and any overdue items → send all context to Claude Haiku API with a planning prompt → Claude generates a prioritized daily plan with energy-matched task ordering → deliver via SMS. The prompt should include: "Given the user's tasks and calendar, create a realistic plan. Front-load deep work. Include buffer time. Suggest which tasks to skip if energy is low."

**Workflow 5 — Overdue and stale task alerts:** Schedule trigger every 4 hours → query Trello for cards past due date or cards in This Week/Today that haven't been modified in 48+ hours → send SMS alert categorizing items as overdue, stale, or blocked. On Fridays, include a "weekly review" compilation of completed tasks, completion rate, and energy pattern analysis.

**Workflow 6 — Crash recovery detection:** This is the most important workflow. Schedule trigger every 12 hours → check Trello API for last board activity timestamp → if no activity in 48+ hours, begin escalation: Day 2 sends a gentle SMS ("Hey, your board misses you. One small thing today?"), Day 4 sends a more direct SMS nudge with a single suggested action, Day 7 sends an SMS with a 2-minute board reset offer, Day 14 emails the accountability partner. If abandonment exceeds 14 days, trigger the **auto-recovery workflow** that archives all stale cards, clears the board, and creates 3 tiny "Welcome Back" tasks.

---

## Layer 3: Claude as your ADHD executive function prosthesis

The intelligence layer operates in two complementary modes that together cost **$20–30/month**.

### Interactive mode: Claude Desktop + MCP servers

Claude Pro at **$20/month** includes Claude Desktop, which supports MCP (Model Context Protocol) servers — open-source bridges that let Claude directly read and write to external tools. Three MCP servers cover the entire stack:

- **Trello MCP** (`delorenj/mcp-server-trello`): Full board, list, and card management — Claude can create cards, move them between lists, read board state, manage checklists. Most popular Trello MCP server, listed in the official MCP Registry.
- **Google Calendar MCP** (`nspady/google-calendar-mcp`): Multi-calendar support, recurring events, free/busy queries, natural language date handling. OAuth2 authentication.
- **Google Workspace MCP** (`taylorwilsdon/google_workspace_mcp`): All-in-one server covering Gmail, Calendar, Drive, Docs, and more. One-click Claude Desktop installation via .dxt extension.

**Setup takes about 1–2 hours total.** Each server requires generating an API key/OAuth token and adding a JSON config block to `claude_desktop_config.json`. Once configured, you can have conversations like: "What's on my calendar today and what Trello tasks are overdue? Move the two most important ones to Today and block 90 minutes on my calendar for deep work." Claude calls the Trello and Calendar MCP tools, executes the actions, and confirms.

Pair this with a **Claude Project** containing custom instructions that establish Claude as your ADHD executive function coach. Upload documents about your work patterns, energy cycles, team context, and preferred ADHD strategies. The system instructions should include directives like: "Always ask about energy level (1–5) before suggesting tasks. Never present more than 3 options. Validate emotions before problem-solving. If the user seems overwhelmed, suggest the smallest possible next action."

### Proactive mode: n8n calls Claude API

For automated scheduled workflows, n8n calls the **Claude Haiku 4.5 API** directly. At **$1.00 per million input tokens and $5.00 per million output tokens**, the estimated cost for 50–100 daily calls with moderate context is **$5–10/month**. Use Haiku for routine tasks (daily planning, reminder generation, stale task flagging) and upgrade individual calls to Sonnet 4.5 for complex work (weekly reviews, task breakdown, pattern analysis). GPT-4o-mini at $0.15/$0.60 per million tokens is even cheaper (~$1/month) if budget is extremely tight, though Claude's coaching tone tends to be more empathetic.

### Open-source agent frameworks worth considering

For users who want a dedicated chat interface beyond Claude Desktop, two self-hosted options stand out. **Flowise** is the easiest — a drag-and-drop visual builder for LLM agents that installs with `npx flowise start` and runs on the same VPS as n8n. Build an ADHD coaching chatbot with memory, RAG from uploaded ADHD strategy documents, and tool calling in about 30 minutes. **Dify.ai** is more feature-complete — it combines visual workflows, agent frameworks, and RAG in one platform, and natively supports MCP protocol. It needs more RAM (4GB recommended, so a $10–15/month VPS) but provides the most polished self-hosted experience. Both are free to self-host.

CrewAI is worth noting for its conceptual elegance: define role-based agents (a "Planning Agent," an "Accountability Agent," an "Energy Tracking Agent") that collaborate as a "crew." It's a Python library that runs anywhere and costs only API fees. However, it's code-first and adds maintenance burden — better suited for iteration after the core system is stable.

**Skip the expensive no-code AI platforms** for this use case. Dust.tt (€29/mo), Voiceflow ($60/mo), Relevance AI ($19–199/mo), and Botpress ($79/mo for substantial use) all consume too much of the $30–75 budget while providing less flexibility than self-hosted alternatives.

---

## The crash recovery system that keeps everything alive

Crash recovery isn't a feature — it's **the single most important design principle** for any ADHD productivity system. Research consistently shows that the abandonment cycle (excitement → novelty fade → guilt spiral → system avoidance) is universal among ADHD users. One study found that regular accountability check-ins increase goal achievement from **25% to 95%**. The system must be designed to survive weeks of non-use and gently re-engage the user.

### Three-tier re-engagement architecture

**Tier 1 — Passive detection (n8n Workflow 6):** Monitor Trello board activity via API. If no card moves for 48 hours, begin the escalation sequence. The n8n workflow checks `dateLastActivity` on the board and stores a "days since last activity" counter in n8n's static data.

**Tier 2 — Graduated nudges:** Day 2: SMS saying "Just checking in — your board has a couple of items waiting. Want me to suggest one tiny thing to start with?" Day 4: SMS with one specific, low-energy task suggestion. Day 7: "It's been a week. Want to do a 2-minute board reset? I'll archive the old stuff and give you a fresh start." Day 14: Email to accountability partner. The tone escalates in directness but never in judgment. Each message includes a **one-tap response option** — even replying "👋" counts as engagement and resets the timer.

**Tier 3 — Auto-recovery:** If no engagement for 14+ days, the system automatically archives all cards in Done, moves everything from Doing and Today back to This Week, and creates a "Welcome Back" card in Today with a 3-item checklist: "Open the board (done!), pick one card and move it to Doing, work on it for 10 minutes." When the user returns, the board looks clean rather than overwhelming. A companion Claude API call generates a "Here's what you missed" summary — what's still relevant, what can be safely ignored, and a suggested first-day-back plan with only 1–3 items.

### Existing open-source template to accelerate this

The **Zenitr0/second-brain-adhd-n8n** project on GitHub (98 stars, MIT license) implements a similar pattern using n8n + Notion + Telegram. It monitors task status and sends escalating reminders until tasks are marked Done or Abandoned. This template can be adapted to use Trello instead of Notion and Twilio SMS instead of Telegram with moderate effort. n8n officially promoted this project, calling it an "ADHD second brain."

---

## Weekend implementation roadmap

The entire core system can be deployed in approximately **6–8 hours** across a weekend, with refinement continuing over the following weeks.

### Saturday morning (3 hours): Foundation

**Hour 1 — Trello board setup.** Sign up for Trello Standard ($5/mo). Create the board with 5 lists. Add all 4 free Power-Ups. Create energy labels and custom fields. Set WIP limits (Doing: 1–2, Today: 5). Create a "Checklist Templates" reference card. Build the "Board Recovery" button that archives Done, flattens Doing/Today back to This Week. Time: 45 minutes.

**Hour 2 — Butler automation rules.** Create all 6 Butler rules (auto-complete, auto-setup, daily reset, recurring tasks via Card Repeater, due date surfacing, auto-archive). Test each rule by moving a sample card through the pipeline. Create the "Crash Recovery Protocol" reference card with step-by-step instructions. Time: 45 minutes.

**Hour 3 — Claude Pro + MCP servers.** Subscribe to Claude Pro ($20/mo). Install Claude Desktop. Configure MCP servers: start with Trello MCP (15 min) and Google Calendar MCP (15 min), then optionally Google Workspace MCP (15 min). Set up a Twilio account and configure the SMS number (10 min). Create a Claude Project with ADHD coaching system instructions. Test by asking Claude to read your Trello board and suggest a daily plan. Time: 55 minutes.

### Saturday afternoon (3 hours): Orchestration

**Hour 4 — Deploy n8n.** Spin up a Hetzner or Railway instance. Deploy n8n via Docker template or Railway's 1-click deploy. Verify it's running, create credentials for Trello API, Twilio API, Google Calendar API, Gmail API, and Claude/Anthropic API. Time: 45 minutes.

**Hours 5–6 — Build core workflows.** Start with the highest-value workflows: Morning planning briefing (Workflow 4), Crash recovery detection (Workflow 6), and Email-to-Trello capture (Workflow 1). These three workflows deliver 80% of the system's value. Test each workflow end-to-end. Time: 90 minutes.

### Sunday (2 hours): Refinement

**Hour 7 — Secondary workflows.** Build smart reminders (Workflow 3) and overdue task alerts (Workflow 5). Time: 60 minutes.

**Hour 8 — Calendar sync + testing.** Build Trello-to-Calendar sync (Workflow 2). Run the complete system end-to-end: email a task to the board's email address, verify it appears in Trello Inbox, move it through the pipeline, confirm calendar events are created, check that morning briefing generates correctly. Time: 60 minutes.

### Week 2 and beyond: Iteration

Add energy-level-aware task suggestions to the morning briefing prompt. Implement the body doubling check-in workflow (Pomodoro-style SMS nudges during work sessions). Connect Focusmate's public API to track body doubling sessions and trigger re-engagement if sessions drop off. Refine Claude's coaching prompts based on what actually helps. Consider adding Flowise as a mobile-accessible chat interface to the same VPS. Each addition is a 30–60 minute project.

---

## Answering the ten key questions

**1. Optimal architecture within $30–75/month?** Claude Pro ($20) + n8n self-hosted ($5–10 VPS) + Trello Standard ($5) + Claude Haiku API ($5–10) = **$35–45/month**. This covers all three layers with room to spare.

**2. Exact costs?** Trello Standard: $5/mo. VPS (Hetzner/Railway): $5–10/mo. Claude Pro: $20/mo. Claude Haiku 4.5 API at ~75 calls/day: ~$7/mo. Twilio SMS: ~$1.50–2.50/mo. All Power-Ups: $0. MCP servers: $0. n8n software: $0. Total: **$39–45/month typical**.

**3. Fastest implementation path?** Saturday morning: Trello + Claude/MCP (3 hours, immediately usable). Saturday afternoon: n8n + 3 core workflows (3 hours). Sunday: remaining workflows + testing (2 hours). **Core system fully operational in one weekend.**

**4. Phased roadmap?** Phase 1 (Weekend 1): Trello board + Butler rules + Claude/MCP + n8n with 3 core workflows. Phase 2 (Week 2): Calendar sync + body doubling + energy prompts. Phase 3 (Month 2): Flowise chat interface, Focusmate API integration, weekly review automation. Phase 4 (Month 3+): Pattern analysis, prompt refinement, complexity only where needed.

**5. Open-source cost reducers?** n8n (free, saves $22–55/mo vs cloud), MCP servers (free, saves building custom integrations), Flowise/Dify.ai (free self-hosted agent builders), Card Repeater Power-Up (free, saves Butler runs), Zenitr0's ADHD n8n template (free starting point).

**6. n8n cloud vs self-hosted?** Self-hosted saves **$12–45/month** (cloud Starter is €20/mo, Pro is €50/mo) and provides unlimited executions. The trade-off is 2–4 hours of initial setup and occasional maintenance. For a technically capable user, self-hosted is unambiguously the better choice. Railway's 1-click deploy minimizes the DevOps burden.

**7. Available MCP servers?** Trello: `delorenj/mcp-server-trello` (most popular, official registry). Google Calendar: `nspady/google-calendar-mcp` (multi-calendar, OAuth2). Gmail/All Google: `taylorwilsdon/google_workspace_mcp` (covers Gmail, Calendar, Drive, Docs, Sheets in one server). All-in-one option: Composio MCP covers 300+ apps with built-in auth.

**8. ADHD-specific templates?** **Zenitr0/second-brain-adhd-n8n** (n8n + Notion + Telegram, adaptable to Trello/Twilio SMS), **Leantime** (full open-source PM built for ADHD/neurodivergence, 1.8M Docker pulls), and various ADHD Trello board guides from Sharon Dale and Beth Harvey. No comprehensive agent template exists yet — this system would be among the first.

**9. Custom agents vs no-code platforms?** For ADHD users specifically, the **hybrid approach wins**: use n8n (visual, no-code-ish) for automation orchestration, Claude Projects/MCP for interactive coaching (no building required), and reserve custom code only for the crash recovery logic where precise behavioral control matters. Pure custom code creates maintenance burden that becomes "another system to abandon." Pure no-code platforms (Dust.tt, Voiceflow) are too expensive for personal use. The n8n + Claude combination hits the sweet spot.

**10. Crash recovery handling?** Three-tier system: passive monitoring via n8n (Trello API activity check every 12 hours), graduated nudge escalation (SMS → email to accountability partner over 14 days), and auto-recovery (archive stale cards, present clean board with 3 tiny tasks). The critical design principle: **never punish absence.** Every re-engagement message should reduce friction, not add guilt. Include one-tap response options so that any engagement — even an emoji reply — resets the timer and counts as a win.

---

## What makes this system ADHD-survivable

Three design principles separate this from the hundreds of productivity systems that ADHD users build and abandon.

**First, every layer works independently.** If n8n crashes, Trello's Butler rules still automate the board. If Claude's API key expires, the Trello board and n8n workflows still function. If the user ignores everything for two weeks, the crash recovery system activates. There is no single point of failure that kills the entire system.

**Second, the system initiates contact — the user doesn't have to.** ADHD executive function struggles make it hard to *remember* to use tools. The morning briefing arrives automatically as a text message. Reminders arrive without being requested. The crash recovery system reaches out during abandonment. The user's only job is to respond, not to initiate.

**Third, complexity is earned, not imposed.** Start with 3 n8n workflows, not 10. Start with basic energy labels, not a full spoon-tracking spreadsheet. Add features only when the current system is actually being used. The Zenitr0 n8n project's author captured this perfectly: the system should "keep reminding until the task is marked Done or **Abandoned**" — acknowledging that sometimes the right move is to let go of a task, not to feel guilty about it. The system should make both completion and intentional abandonment feel like valid outcomes.
