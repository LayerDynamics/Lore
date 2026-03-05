# DefTrello - ADHD Productivity System

A 3-layer automated productivity system for ADHD team leads using Trello, n8n, and Claude.

## Cost

| Component | Monthly |
|-----------|---------|
| Trello Standard | $5 |
| VPS (Railway/Hetzner) | $5-10 |
| Claude Pro | $20 |
| Anthropic API (Haiku) | $5-10 |
| Twilio SMS | ~$2 |
| **Total** | **$37-47** |

## Architecture

```
Layer 3: INTELLIGENCE — Claude Pro + Haiku API
  Claude Desktop + MCP (interactive) | n8n calls Haiku (automated)

Layer 2: ORCHESTRATION — n8n on VPS
  6 workflows: Morning Briefing, Crash Recovery, Email Capture,
  Smart Reminders, Overdue Alerts, Calendar Sync

Layer 1: FOUNDATION — Trello Standard
  Reference | This Week | Today | Doing | Done
  + Butler Rules + Energy Labels + WIP Limits
```

Each layer works independently. If the VPS goes down, Trello still works. If you ignore everything for 2 weeks, crash recovery activates.

## Prerequisites

- `curl` and `jq` (macOS has both)
- Node.js (for MCP servers)
- Docker and Docker Compose (for n8n)
- Accounts: Trello, Anthropic, Twilio, Google Cloud (for Calendar OAuth)

## Quick Start

```bash
# 1. Configure credentials
cp .env.example .env
# Edit .env with your API keys

# 2. Create Trello board
./trello/create-board.sh
./trello/create-reference-cards.sh

# 3. Manual Trello setup (Butler rules, Power-Ups)
# Follow trello/butler-rules-manual.md

# 4. Deploy n8n
cd n8n && docker compose up -d

# 5. Import workflows into n8n
# See scripts/import-n8n-workflows.sh

# 6. Set up Claude Desktop
# Copy claude/claude-desktop-config.json to Claude Desktop config location
# See MANUAL_STEPS.md for details
```

Or use the master script:

```bash
./scripts/setup.sh
```

## Project Structure

```
deftrello/
├── .env.example              # Credential template
├── MANUAL_STEPS.md           # Steps that can't be automated
├── trello/
│   ├── board-config.json     # Board structure definition
│   ├── create-board.sh       # Creates board via Trello API
│   ├── create-reference-cards.sh
│   └── butler-rules-manual.md
├── n8n/
│   ├── docker-compose.yml    # n8n + PostgreSQL
│   └── workflows/            # 6 importable workflow JSONs
├── claude/
│   ├── claude-desktop-config.json  # MCP server config
│   └── adhd-coach-system-prompt.md
└── scripts/
    ├── setup.sh              # Master setup script
    ├── import-n8n-workflows.sh
    └── verify-setup.sh
```

## Workflows

| # | Name | Schedule | What It Does |
|---|------|----------|-------------|
| 1 | Morning Briefing | 7:30 AM M-F | AI-generated daily plan via SMS |
| 2 | Crash Recovery | Every 12h | Detects inactivity, sends gentle nudges |
| 3 | Email Capture | Every 5 min | Gmail > AI extraction > Trello card |
| 4 | Smart Reminders | Every 2h M-F | SMS for tasks due within 2 hours |
| 5 | Overdue Alerts | Every 4h | Categorized overdue/stale/team alerts |
| 6 | Calendar Sync | Every 15 min | Syncs Trello due dates to Google Calendar |

## When Your System Breaks

It will. That's expected. When you come back:

1. Open Trello
2. Click the Clean Up Board button
3. Look at This Week
4. Pick ONE card — the easiest one
5. Move it to Doing
6. That's enough for today

## Documentation

Full setup guides in `docs/`:
- `AgentSystemSetup.md` — Complete step-by-step setup guide
- `AdhdTrelloSetup.md` — Architecture and cost analysis
- `AdhdLeadsGuideToManagingTeams.md` — Team management strategies
