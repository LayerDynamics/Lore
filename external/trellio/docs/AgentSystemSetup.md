# ADHD Agent System — Complete Step-by-Step Setup Guide

### Updated: No Inbox · Direct Task Entry · Team Lead Edition

> **Total cost: $36.50–45/month | Total setup time: 6–8 hours across one weekend**
>
> This guide is built for your specific situation: you're a team lead whose boss requires Trello, you're leading newer team members, and you're naturally a solo/chaotic worker who needs external scaffolding — not more willpower. You don't use an inbox. You add tasks directly to the board and work from there.
>
> Every click, every URL, every configuration is here in order. Each step explains *what it does* and *why it matters*. Don't skip ahead. Don't "improve" it during setup. Follow it linearly, then customize later.

---

## THE SYSTEM AT A GLANCE

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3: INTELLIGENCE                     │
│         Claude Pro ($20/mo) + Claude Haiku API ($5-10/mo)    │
│                                                              │
│   ┌──────────────┐    ┌──────────────────────────────────┐   │
│   │ Claude Desktop│    │ n8n calls Haiku API for:         │   │
│   │ + MCP Servers │    │  • Morning planning briefings    │   │
│   │ (interactive) │    │  • Accountability nudges         │   │
│   │               │    │  • Crash recovery messages       │   │
│   └──────┬────────┘    └──────────────┬───────────────────┘   │
│          │ reads/writes directly      │ automated calls       │
├──────────┼────────────────────────────┼──────────────────────┤
│          │      LAYER 2: ORCHESTRATION                       │
│          │      n8n on VPS ($5-10/mo)                        │
│          │                            │                      │
│          │   6 workflows bridging:    │                      │
│          │   Twilio ↔ Trello ↔ Calendar ↔ Gmail               │
│          │   + Crash Recovery Detection                      │
├──────────┼────────────────────────────┼──────────────────────┤
│          ▼      LAYER 1: FOUNDATION   ▼                      │
│              Trello Standard ($5/mo)                          │
│                                                              │
│   📋 Reference · 📅 This Week → ⭐ Today → 🔥 Doing → ✅ Done│
│   + Butler Rules + Energy Labels + WIP Limits                │
│   (works completely standalone if everything else breaks)    │
└─────────────────────────────────────────────────────────────┘
```

### How your board flow works (no inbox)

You add tasks directly where they belong:

- **Not urgent / sometime this week?** → Add it to `📅 This Week`
- **Needs to happen today?** → Add it straight to `⭐ Today`
- **Doing it right now?** → Drag it to `🔥 Doing`
- **Team member emailed/texted a task?** → n8n auto-captures it to `📅 This Week`
- **Boss drops something urgent?** → Add it to `⭐ Today`, drag the current Doing card back

No triage step. No inbox to process. You decide where it goes when you add it. The system handles everything after that.

**Key design principle:** Each layer works independently. If your VPS goes down, Trello and Butler still work. If you ignore everything for 2 weeks, the crash recovery system activates. There is no single point of failure.

---

# PHASE 1: SATURDAY MORNING (3 hours)

## Step 1: Create your Trello account and board (45 min)

### 1.1 — Sign up for Trello Standard

**Where to go:** <https://trello.com/signup>

**What to do:**

1. Create an account (or log in if you have one)
2. You'll start on the Free plan — that's fine for now
3. Go to **Settings** → **Billing** → Upgrade to **Standard ($5/month)**
   - URL: <https://trello.com/your-boards> → click your profile icon (top right) → **Settings** → **Billing**
4. Standard is required because it gives you **1,000 Butler automation runs/month** (Free only gives 250) and **Custom Fields**

**Why Standard and not Free:** The Butler rules you're about to create will consume ~400+ runs/month. Free's 250 limit would hit the wall in 2 weeks and your automations would silently stop working — exactly when you've stopped paying attention. You also need Custom Fields for time estimates and priority tracking, which Free doesn't include.

### 1.2 — Create the board with 4 working lists + 1 reference list

**What to do:**

1. Click **"+"** (top right) → **Create board**
2. Name it whatever your boss/team expects (e.g., `Team Projects` or `[Your Team Name] Board`)
   - Keep it professional — your team and boss will see this
3. Set visibility to **Workspace** so your team and boss have access
4. Create these lists, **in this exact order from left to right:**

| List name | Purpose | WIP limit | How tasks get here |
|-----------|---------|-----------|-------------------|
| `📋 Reference` | Pinned info: team links, templates, objectives | None | You create these once |
| `📅 This Week` | Everything you/team plan to tackle this week | 15-20 | **You add tasks here directly.** n8n auto-captures from email here too. |
| `⭐ Today` | Max 5 tasks. Chosen each morning. | 5 | You drag from This Week each morning, or add urgent items straight here |
| `🔥 Doing` | THE most important list. Only 1-2 items at a time. | 1-2 | You drag from Today when you start working |
| `✅ Done` | Celebration zone. Auto-archived after 3 days. | None | You drag here when finished (or Butler moves it) |

**Why no inbox:** You told me you don't use one, and honestly, for your workflow it's one extra decision point you don't need. An inbox creates a "process this later" pile that, for ADHD brains, becomes "never process this." By adding tasks directly to This Week or Today, every task already has a timeframe the moment it hits the board. Less friction, fewer decisions, faster execution.

**Why only 4 working lists:** Every list you add is one more place to forget to check. Four lists covers the complete task lifecycle: planned → prioritized → active → done. The Reference list doesn't count — it's a pinboard, not a workflow step.

### 1.3 — Enable the 4 free Power-Ups

**Where to go:** On your board → click **"Power-Ups"** button (top menu bar) → **"Add Power-Ups"**

Search for and enable each of these (all are free on every plan):

| Power-Up | What it does for you | Why it matters |
|----------|---------------------|----------------|
| **Calendar** | Shows all due-dated cards in a calendar view. Drag cards to reschedule dates. | Makes Trello deadlines visible alongside your meetings — fights "out of sight out of mind" |
| **List Limits** | Shows a warning color when you exceed card limits on a list | Forces you to prioritize instead of piling everything into Today |
| **Card Repeater** | Auto-creates recurring cards on a schedule | Creates your weekly review card, standup prep, etc. without consuming Butler runs |
| **Card Aging** | Makes neglected cards gradually transparent over time | You can spot stale tasks at a glance without checking dates — visual decay |

**After enabling List Limits — set them immediately:**

1. Click the **"..."** menu on the `🔥 Doing` list header → **"Set List Limit"** → set to **2**
2. Click the **"..."** menu on the `⭐ Today` list header → **"Set List Limit"** → set to **5**

**What happens:** When you try to drag a 3rd card into Doing, the list header turns red. This creates a forced pause — a moment where you have to consciously decide "is this really more important than what I'm already doing?" instead of unconsciously stacking tasks. This single constraint is the most impactful structural decision in the entire system.

### 1.4 — Create energy labels

**Where to go:** On any card → click **"Labels"** → **"Create a new label"**

Create these 4 labels:

| Label | Color | When to use | Example tasks |
|-------|-------|-------------|---------------|
| 🔴 **High Energy** | Red | Deep focus work requiring sustained concentration | Writing reports, complex analysis, architecture decisions |
| 🟠 **Medium Energy** | Orange | Active but not draining work | Emails, planning sessions, team meetings, code reviews |
| 🟢 **Low Energy** | Green | Routine autopilot tasks | Status updates, filing, scheduling, simple approvals |
| 🟣 **Brain Dead** | Purple | Zero-effort work for your worst days | Clearing notifications, organizing bookmarks, reading docs |

**How to use them in practice:**

- When you add a card to the board, slap an energy label on it (takes 2 seconds)
- On bad days, press **`F`** on your keyboard to open the filter → select 🟢 Low Energy or 🟣 Brain Dead → now you only see tasks you can actually handle right now
- Your morning briefing from Claude (set up in Phase 2) will use these labels to match tasks to your energy level

**Team tip:** Your team members don't need to use energy labels. These are for YOUR cards only. When assigning tasks to team members, use the Priority field (next step) instead.

### 1.5 — Add Custom Fields

**Where to go:** On any card → look in the card sidebar → click **"Custom Fields"** (you may need to scroll down)

Create these 4 fields:

| Field name | Type | Options | Why it matters |
|-----------|------|---------|----------------|
| **Time Estimate** | Dropdown | `5 min`, `15 min`, `30 min`, `1 hour`, `2+ hours` | Prevents "this will only take a minute" lies your brain tells you. Also helps Claude suggest realistic daily plans. |
| **Task Type** | Dropdown | `Deep Work`, `Communication`, `Admin`, `Creative` | Lets you batch similar work together (e.g., do all Communication tasks in one block) |
| **Priority** | Dropdown | `🔥 Urgent+Important`, `⭐ Important`, `⚡ Urgent`, `📋 Backlog` | Eisenhower matrix in one click. Your boss and team can see this. |
| **Quick Win** | Checkbox | *(just a checkbox)* | Flag sub-5-minute tasks. On low-motivation days, filter for these to build momentum. |

**Practical tip:** You don't need to fill in every field on every card. At minimum, set **Priority** on everything (your boss will notice if you're prioritizing well) and **Energy** labels on your own tasks. Time Estimate and Task Type are bonuses for when Claude does your morning planning.

### 1.6 — Set up the Reference list

**What to do:** Create these cards in your `📋 Reference` list. They stay here permanently as pinned information.

**Card 1: `*** Checklist Templates`**

- The `***` forces it to sort to the top alphabetically
- Add these checklists to this single card (each checklist is a template you'll reuse):

  **Checklist: "Task Kickoff"**
  - [ ] Clarify the deliverable (what does "done" look like?)
  - [ ] Set a realistic due date
  - [ ] Identify blockers or dependencies
  - [ ] Add energy label and time estimate

  **Checklist: "Weekly Review"**
  - [ ] Review what got Done this week (celebrate wins)
  - [ ] Check This Week for stale cards (anything older than 7 days)
  - [ ] Decide: keep, reschedule, or kill each stale card
  - [ ] Set 3-5 priorities for next week
  - [ ] Update the board — move cards, update due dates

  **Checklist: "Delegation Handoff"**
  - [ ] Write clear description of what's needed
  - [ ] Set due date and add assignee
  - [ ] Add Priority field
  - [ ] Share card link with assignee
  - [ ] Set a reminder to check in (Butler handles this)

**Card 2: `📌 Team Agreements`**

- Add notes on how the team uses this board:
  - "Add new tasks to This Week with a priority label"
  - "Move your own cards to Doing when you start"
  - "Move to Done when complete — Butler handles the rest"
  - "Weekly review every Friday at [time]"

**Card 3: `🔗 Key Links`**

- Links to your team's shared docs, repos, dashboards, whatever your team checks regularly

**Why this matters:** When Butler auto-adds a checklist to a card (Step 2, Rule 2), it copies from the Templates card. You build these once and never rebuild from memory again. The Team Agreements card is especially important because you're leading newer team members — they need to know how the board works without you explaining it every time.

---

## Step 2: Set up Butler automation rules (45 min)

**Where to go:** On your board → click **"Automation"** (the robot icon in the top menu, or go to <https://trello.com/butler>)

You're creating 6 rules. Each one replaces a piece of executive function you'd otherwise need to remember. These work for your whole team — when anyone on the board moves a card, the automations fire.

### Rule 1 — Auto-complete on Done

**What it does:** When anyone drags a card to Done, it automatically marks the due date complete, checks off all checklist items, and (optionally) posts a comment so the team sees progress.

**How to create it:**

1. In Butler → **Rules** → **"Create Rule"**
2. Trigger: `when a card is moved into list "✅ Done"`
3. Actions (add all of these):
   - `mark the due date as complete`
   - `check all the items in all the checklists on the card`
   - *(optional)* `post a comment "✅ Completed!"`
4. Click **Save**

**What this replaces:** 3 manual clicks per completed task × dozens of tasks per week. Your team members won't forget to check off items or mark dates. Everything gets tidied up automatically the moment it hits Done.

### Rule 2 — Auto-setup on Doing

**What it does:** When you (or a team member) drag a card to Doing, it auto-adds a working checklist, sets a deadline, and joins you to the card so you get notifications.

**How to create it:**

1. Rules → **Create Rule**
2. Trigger: `when a card is moved into list "🔥 Doing"`
3. Actions:
   - `set due date 4 hours from now` (creates urgency — adjustable later)
   - `add me to the card` (so Trello sends you notifications about this card)
   - `copy checklist "Task Kickoff" from card "*** Checklist Templates"` ← adjust the checklist name to match what you named it in Step 1.6
4. Click **Save**

**Why this matters for you specifically:** This attacks initiation friction — the "I need to set this up before I can actually start" barrier that stops you cold. You drag ONE card and everything else configures itself. The 4-hour due date creates artificial urgency that your brain actually responds to (adjust to 2 hours or 8 hours based on what works for you).

### Rule 3 — Daily board reset

**What it does:** Every evening at 7 PM, any cards still sitting in Today get swept back to This Week. You wake up to a clean Today list and deliberately choose what matters each morning.

**How to create it:**

1. Butler → **Calendar** (this is a scheduled command, not a trigger rule) → **"Create Command"**
2. Schedule: `every weekday at 7:00 PM`
3. Action: `move all cards in list "⭐ Today" to the top of list "📅 This Week"`
4. Click **Save**

**Why this is critical:** Without this, cards sit in Today for days while you tune them out. The daily reset forces a fresh start every morning. You can't coast on yesterday's plan — you have to look at the board and choose. This prevents the #1 cause of ADHD system abandonment: staleness. When a board looks the same every day, your brain stops seeing it.

**Important note for team cards:** This moves ALL cards in Today, including team members'. If your team members keep their work-in-progress in Today overnight, you may want to adjust this to only move cards assigned to you. Butler can do this: change the action to `move all cards assigned to me in list "⭐ Today" to the top of list "📅 This Week"`.

### Rule 4 — Recurring tasks via Card Repeater

**What it does:** Auto-creates recurring cards on a schedule without using your Butler automation quota.

**How to create it** (this uses the Card Repeater Power-Up, NOT Butler):

1. Create a card in `⭐ Today` named `📝 Weekly Review`
2. Open the card → in the Power-Up section of the right sidebar, find **"Repeat"**
3. Set it to repeat **every Friday at 3:00 PM**
4. Set it to create the copy in `⭐ Today`
5. Add the "Weekly Review" checklist from your Templates card to this first card (Card Repeater copies checklists too)

**Repeat this process for other recurring tasks:**

- `📝 Morning Standup Prep` — every weekday at 8:00 AM → creates in `⭐ Today`
- `📝 End of Day Status Update` — every weekday at 4:30 PM → creates in `⭐ Today` (if your boss wants daily updates)

**Critical detail:** Archiving a repeated card does NOT stop the repetition — only deleting the card or opening it and canceling the repeat schedule stops it. This is actually good — it means even if you archive your whole board during a crash recovery, the recurring cards keep generating.

### Rule 5 — Due date surfacing

**What it does:** When a card's due date arrives, it automatically moves to the top of Today so it's impossible to miss.

**How to create it:**

1. Butler → **Rules** → Create Rule
2. Trigger: `when a card's due date is reached`
3. Action: `move the card to the top of list "⭐ Today"`
4. Click **Save**

**Companion rule (recommended — catches things a day early):**

1. Butler → **Due Date** commands → Create
2. Trigger: `1 day before a card is due`
3. Actions:
   - `move the card to list "⭐ Today"`
   - `add label "⚠️ Due Soon"`
4. Click **Save**

> **Create this label first:** Go to any card → Labels → Create a new label → name it `⚠️ Due Soon` → choose yellow color. This keeps it separate from your energy labels — "🔴 High Energy" means the task requires deep focus, while "⚠️ Due Soon" means the deadline is approaching. Two different signals that shouldn't be conflated.

**Why this matters:** ADHD time blindness means deadlines don't feel real until they've already passed. This makes due dates physically appear in your face on the board. Between this and the calendar sync (Phase 2), there's no way a deadline sneaks up on you.

### Rule 6 — Auto-archive Done cards

**What it does:** Keeps your board clean without anyone lifting a finger. Cards that have been in Done for 3+ days get archived automatically.

**How to create it:**

1. Butler → **Calendar** → Create Command
2. Schedule: `every day at 11:00 PM`
3. Action: `archive all cards in list "✅ Done" that have been in the list for more than 3 days`
4. Click **Save**

**Also create a manual panic reset button:**

1. Butler → **Board Buttons** → Create Button
2. Button name: `🧹 Clean Up Board`
3. Actions (add all three):
   - `archive all cards in list "✅ Done"`
   - `move all cards in list "🔥 Doing" to the top of list "📅 This Week"`
   - `move all cards in list "⭐ Today" to the top of list "📅 This Week"`
4. Click **Save**

This button is your **emergency reset** — one click flattens the entire board back to a clean state with everything in This Week. Use it when you come back after ignoring the board for a week, when things feel overwhelming, or anytime the board looks chaotic. It's designed so your worst-day self can recover in one click.

### Test everything before moving on

1. Create a dummy card in `📅 This Week` — give it a due date, a checklist, and energy/priority labels
2. Drag it through the full pipeline: This Week → Today → Doing → Done
3. **Verify each rule fires:**
   - In Doing: Did the "Task Kickoff" checklist get added? Did a 4-hour due date get set? Are you now a member of the card?
   - In Done: Did the due date mark as complete? Did all checklist items get checked?
4. Test the `🧹 Clean Up Board` button — does it sweep everything back to This Week?
5. Delete the test card when satisfied

---

## Step 3: Set up Claude Pro + MCP servers (60 min)

This is where the system gets intelligent. You're connecting Claude to your Trello board and Google Calendar so it can read and write to both of them through conversation. You'll also set up Twilio for SMS notifications from n8n. Once set up, you can say things like "What's on my plate today? Energy is a 2" and Claude will look at your actual board and calendar, then suggest a realistic plan.

### 3.1 — Subscribe to Claude Pro

**Where to go:** <https://claude.ai/settings/billing>

**What to do:**

1. Sign up or log in at <https://claude.ai>
2. Go to **Settings** → **Billing** → Subscribe to **Claude Pro ($20/month)**
3. This gives you: Claude Desktop app, Claude Projects (custom coaching personas), MCP server support, and higher usage limits

### 3.2 — Install Claude Desktop

**Where to go:** <https://claude.ai/download>

**What to do:**

1. Download Claude Desktop for your OS (Mac or Windows)
2. Install it and sign in with your Claude Pro account
3. Open it and send a test message to verify it works

### 3.3 — Configure MCP Server: Trello

**What this does:** Lets Claude directly read your Trello board state, create cards, move cards between lists, manage checklists, and update fields — all through natural conversation. Instead of you opening Trello, finding a card, and dragging it, you tell Claude "move the vendor call card to Doing" and it happens.

**Where to go:** <https://github.com/delorenj/mcp-server-trello>

**Prerequisites:** You need Node.js installed.

- Check by opening Terminal (Mac) or Command Prompt (Windows) and running: `node --version`
- If not installed, get it at <https://nodejs.org> — download the LTS version, install with default settings

**Step-by-step:**

**Part A — Get your Trello API credentials:**

1. Go to <https://trello.com/power-ups/admin>
2. Click **"New"** to create a new Power-Up integration
   - Name it anything (e.g., "Claude MCP") — this is just to generate API keys
3. After creating, click **"Generate a new API key"**
4. **Copy your API Key** — save it somewhere (a notes app, password manager, whatever)
5. Next to the API key, click the **"Token"** link → this opens a page asking you to authorize → click **"Allow"**
6. **Copy your Token** — save it with the API key
7. **Get your Board ID:** Open your Trello board in a browser. The URL looks like:
   `https://trello.com/b/XXXXXXXX/board-name`
   The `XXXXXXXX` part is your board ID. Copy it.

**Part B — Add the MCP server to Claude Desktop:**

1. Open the Claude Desktop config file:
   - **Mac:** Open Finder → Go → Go to Folder → paste: `~/Library/Application Support/Claude/`
   - **Windows:** Open File Explorer → paste in address bar: `%APPDATA%\Claude\`
2. Open (or create) the file `claude_desktop_config.json`
3. Paste this JSON (replacing the three placeholder values with your actual credentials):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "paste-your-api-key-here",
        "TRELLO_TOKEN": "paste-your-token-here",
        "TRELLO_BOARD_ID": "paste-your-board-id-here"
      }
    }
  }
}
```

4. Save the file
5. **Fully quit Claude Desktop** (not just close the window — right-click the dock/taskbar icon → Quit)
6. Reopen Claude Desktop
7. **Test it:** Type: *"What lists are on my Trello board?"*
   - It should return your 4 lists + Reference. If it does, the connection is working.
   - Try: *"What cards are in my This Week list?"*

### 3.4 — Configure MCP Server: Google Calendar

**What this does:** Lets Claude read your calendar, create events, find free time, and block focus sessions. Combined with Trello access, Claude can say "You have a meeting at 2 PM, so let's front-load your deep work tasks this morning."

**Where to go:** <https://github.com/nspady/google-calendar-mcp>

**Step-by-step:**

**Part A — Create Google OAuth credentials:**

1. Go to <https://console.cloud.google.com/>
2. If you've never used Google Cloud: click **"Agree and Continue"** on the terms
3. Click **"Select a project"** (top bar) → **"New Project"**
   - Name it: `Claude MCP`
   - Click **Create**
   - Make sure this project is selected in the top bar
4. In the left sidebar → **APIs & Services** → **Library**
5. Search for `Google Calendar API` → click it → click **"Enable"**
6. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** → Create
   - App name: `Claude MCP` → Add your email as support email → Save through all steps
   - On the "Test users" page → **Add users** → add your own email address
7. Go to **APIs & Services** → **Credentials** → **"+ Create Credentials"** → **OAuth client ID**
   - Application type: **Desktop app**
   - Name: `Claude Calendar`
   - Click **Create**
   - Click **"Download JSON"** — save this file somewhere you'll remember (e.g., your home folder)
   - Remember the **full file path** to this JSON file

**Part B — Add to Claude Desktop config:**

1. Open `claude_desktop_config.json` again
2. Add the Google Calendar server inside the `mcpServers` object (add a comma after the Trello block):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token",
        "TRELLO_BOARD_ID": "your-board-id"
      }
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@nspady/google-calendar-mcp"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "/full/path/to/your/credentials.json"
      }
    }
  }
}
```

3. Save → Fully quit and reopen Claude Desktop
4. **First launch:** It will open a browser window asking you to sign in to Google and authorize calendar access → sign in → click Allow
5. **Test it:** Ask Claude: *"What's on my calendar today?"*

### 3.5 — Set up Twilio for SMS notifications

**What this does:** n8n sends you SMS notifications — morning briefings, reminders, crash recovery nudges. Texts have the highest open rate of any notification channel (~98%), which matters for ADHD. If a notification doesn't reach you, it doesn't exist. SMS cuts through the noise better than anything else.

**Where to go:** <https://www.twilio.com/try-twilio>

**Step-by-step:**

**Part A — Create Twilio account and get credentials:**

1. Sign up at <https://www.twilio.com/try-twilio> (free trial, no credit card needed initially)
2. Verify your phone number when prompted
3. Get a Twilio phone number — the free trial gives you one automatically
4. Find your **Account SID** and **Auth Token** on the Twilio Console dashboard (<https://console.twilio.com>)
5. Save these four values somewhere safe (password manager, notes app, whatever you use):
   - Account SID
   - Auth Token
   - Your Twilio Phone Number (the one Twilio assigned you)
   - Your Personal Phone Number (the one you want to receive texts on)
6. **After trial:** costs ~$1.15/mo for the phone number + $0.0079/SMS. At 5-10 messages/day, that's roughly **$1.50-2.50/month** total. Cheaper than a coffee.

**Part B — Add credentials to n8n (not Claude Desktop — Twilio is used by n8n, not MCP):**

1. In n8n dashboard → **Settings** (gear icon) → **Credentials** → **Add Credential**
2. Search for "Twilio"
3. Enter your **Account SID** and **Auth Token**
4. Save

**No MCP server needed.** Unlike the Trello and Calendar connections, Twilio doesn't need a Claude Desktop MCP configuration. Claude talks to your Trello board and Calendar directly via MCP. Twilio is only used by n8n to push notifications to your phone — it's a one-way notification channel, not something Claude needs to interact with.

**Test it:** Skip testing here — you'll test when building Workflow 1 (Morning Briefing) in Step 5. That way you'll see a real notification with real content instead of a generic test message.

### 3.6 — (Optional) Google Workspace All-in-One MCP

**Where to go:** <https://github.com/taylorwilsdon/google_workspace_mcp>

**What this does:** Single server that covers Gmail + Calendar + Drive + Docs + Sheets. If you want Claude to read/draft emails or pull info from Google Docs, this replaces the separate Calendar MCP with one that does everything. The repo has a one-click `.dxt` installer for Claude Desktop that handles most of the config automatically.

**When to add this:** Not during initial setup. Add this in Week 2 if you find yourself wanting Claude to help with email or docs. One thing at a time.

### 3.7 — Create your ADHD Coach Claude Project

**Where to go:** <https://claude.ai> → **Projects** (left sidebar) → **"New Project"**

**What this does:** Creates a persistent coaching persona that knows your work patterns, your board structure, and how to help you specifically. Every conversation in this project starts with these instructions already loaded.

**Step-by-step:**

1. Click **"New Project"**
2. Name it: `ADHD Executive Function Coach`
3. In the **Project Instructions** field (the system prompt), paste this:

```
You are my ADHD executive function coach and productivity partner. You have direct access to my Trello board and Google Calendar via MCP tools.

MY CONTEXT:
- I'm a team lead whose boss requires me to use Trello
- I lead newer team members who need guidance
- I'm naturally a solo/chaotic worker learning to manage others
- I don't use an inbox — I add tasks directly to This Week or Today
- My board has 4 working lists: This Week → Today → Doing → Done (plus a Reference list)

CORE RULES:
- Always ask about my energy level (1-5) before suggesting tasks
- Never present more than 3 options at once
- Validate my emotions before jumping to problem-solving
- If I seem overwhelmed, suggest the smallest possible next action
- Use my Trello energy labels (High/Medium/Low/Brain Dead) to match tasks to my current state
- Front-load deep work suggestions to morning hours
- Always include buffer time in plans
- Celebrate completed tasks — mention what I moved to Done
- Never guilt-trip about incomplete tasks or days I didn't use the board
- If I say "I can't do anything today," help me find one Brain Dead task
- Remember I'm also managing a team — ask if I need to delegate anything

DAILY PLANNING FLOW:
1. Ask: "How's your energy today, 1-5?"
2. Read my Trello board (This Week + Today lists) and today's calendar
3. Suggest a realistic plan with max 3 priorities for me personally
4. Flag any team tasks I should check in on
5. Offer to move cards and block calendar time for focus work

WEEKLY REVIEW FLOW:
1. Summarize what got Done this week (mine and team's)
2. Identify stale cards (in This Week for 7+ days without activity)
3. Ask if stale items should be kept, rescheduled, delegated, or killed
4. Help set 3-5 priorities for next week
5. Check if any team member's cards are blocked or overdue

DELEGATION SUPPORT:
- When I add a task, ask if this is something a team member could own
- Help me write clear card descriptions for delegated tasks
- Remind me to check in on delegated work (not micromanage, just check)
```

4. Click **Save**
5. **Test it:** Open the project and say: *"Hey, what's on my plate today? Energy is about a 3."*

Claude will read your Trello board and calendar, then give you a prioritized plan matched to medium energy — including any team tasks you should be aware of.

---

# PHASE 2: SATURDAY AFTERNOON (3 hours)

## Step 4: Deploy n8n on a VPS (45 min)

n8n is the automation engine that makes the system proactive — it sends you morning briefings via SMS, captures tasks from email, detects when you've abandoned the board, and bridges all your tools together. Without n8n, you have to remember to check things. With n8n, things come to you.

### 4.1 — Choose your hosting (pick ONE)

**Option A: Railway — recommended for speed (~$5-7/month)**

1. Go to <https://railway.com/deploy/n8n>
2. Click **"Deploy on Railway"** — this is a 1-click template
3. Sign up for Railway if you haven't (GitHub login works, or email)
4. Railway auto-provisions n8n + a PostgreSQL database
5. Wait 2-3 minutes for deployment to complete
6. Click the generated URL (looks like `https://your-n8n-xxxxx.up.railway.app`)
7. Create your n8n admin account on first visit (choose a strong password — this is your automation brain)
8. **Cost:** Usage-based pricing, typically $5-7/month for this workload. Railway's Hobby plan starts at $5/month.

**Option B: Hetzner VPS — cheapest long-term (~€4.51/month)**

1. Go to <https://www.hetzner.com/cloud>
2. Create an account → **Create a new server**
3. Choose: **CX22** (2 vCPU, 4GB RAM) → ~€4.51/month
4. OS: **Ubuntu 24.04**
5. Set an SSH key (or password if you prefer)
6. Once the server is created, SSH into it and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Create a directory for n8n and set up Docker Compose
mkdir n8n && cd n8n

cat > docker-compose.yml << 'EOF'
version: '3'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_WEBHOOK_URL=https://your-domain-or-ip:5678/
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
EOF

# Start n8n
docker compose up -d
```

> **Note:** On first launch, n8n will prompt you to create an owner account (email + password) in the browser. There are no default credentials — you set them yourself at `http://your-server-ip:5678`. Choose a strong password; this controls your entire automation system.

1. Access n8n at `http://your-server-ip:5678`
2. For production use, set up a reverse proxy (Caddy is easiest) with SSL — but this works fine for getting started

**Which to choose:** If you want to be up and running in 5 minutes, use Railway. If you want the cheapest possible monthly cost and don't mind 30 minutes of terminal work, use Hetzner. Both work identically once running.

### 4.2 — Create API credentials in n8n

Once n8n is running, you need to tell it how to talk to every service.

**Where to go:** n8n dashboard → **Settings** (gear icon, bottom left) → **Credentials** → **"Add Credential"**

Create credentials for each service. Click "Add Credential," search for the type, and paste in the keys:

| Credential type | Where the keys come from |
|----------------|--------------------------|
| **Trello API** | Same API key + token from Step 3.3, Part A |
| **Twilio** | Account SID + Auth Token from Step 3.5 — already added during that step. If you skipped it, go to <https://console.twilio.com> to grab your credentials. |
| **Google Calendar OAuth2** | Same Google Cloud project from Step 3.4 — you can reuse the same OAuth client or create a second one for n8n. n8n will walk you through the OAuth flow when you add this credential. |
| **Gmail OAuth2** | Same Google Cloud project — go back to Google Cloud Console → **APIs & Services** → **Library** → enable **Gmail API** → use the same OAuth client. n8n handles the auth flow. |
| **Anthropic (Claude API)** | This is a NEW credential — follow the steps below |

**Setting up the Anthropic API key (for n8n's automated Claude calls):**

1. Go to <https://console.anthropic.com> — sign up if you don't have an account (separate from your claude.ai account)
2. Go to <https://console.anthropic.com/settings/keys>
3. Click **"Create Key"**
4. Name it: `n8n ADHD System`
5. **Copy the key immediately** — you won't see it again after closing this dialog
6. Go to **Settings** → **Billing** → add a payment method (credit card)
7. **Set a monthly spending limit of $15** — this prevents runaway costs. At normal usage (50-100 automated calls/day using Haiku), you'll spend $5-10/month.
8. Back in n8n: **Add Credential** → search for "Anthropic" → paste your API key → Save

---

## Step 5: Build the 3 highest-value n8n workflows (90 min)

Start with only 3 workflows. These deliver 80% of the system's value. You'll add more in Phase 3 only after these are working and you're actually using them.

### Workflow 1 — Morning Planning Briefing

**What it does:** Every weekday morning at 7:30 AM, this workflow automatically fetches your Trello board and today's calendar, sends everything to Claude Haiku to analyze, and delivers a prioritized daily plan via SMS. You wake up, check your texts, and your plan is already there.

**Why this matters for you:** You don't have to remember to plan your day. You don't have to open Trello first thing. The plan arrives as a text message — the one notification channel you actually see. And because it reads your actual board state, it accounts for overdue items, today's meetings, and energy-appropriate task suggestions.

**How to build it in n8n:**

1. Click **"+ New Workflow"** → name it `Morning Planning Briefing`
2. Build this pipeline by adding nodes left to right:

```
[Schedule Trigger] → [Trello: Get Cards] → [Google Calendar: Get Events] → [Code: Format Context] → [Anthropic: Claude] → [Twilio: Send SMS]
```

**Node 1 — Schedule Trigger:**

- Click the **+** to add first node → search "Schedule Trigger"
- Schedule type: Cron
- Cron expression: `30 7 * * 1-5`
  - Translation: 7:30 AM, Monday through Friday

**Node 2 — Trello: Get Cards:**

- Add node → search "Trello"
- Operation: **Get All Cards**
- Resource: Card
- Board ID: your board ID
- Additional options: check "Include labels," "Include due dates," "Include custom fields"
- This fetches every active card on your board with all their metadata

**Node 3 — Google Calendar: Get Events:**

- Add node → search "Google Calendar"
- Operation: **Get Events**
- Calendar: select your primary calendar
- Time Min: `{{ $today.toISO() }}` (start of today)
- Time Max: `{{ $today.plus({ days: 1 }).toISO() }}` (end of today)
- This fetches all of today's meetings and appointments

**Node 4 — Code Node (JavaScript):**

- Add node → search "Code"
- Paste this code:

```javascript
// Combine Trello cards and calendar events into a planning prompt
const cards = $('Trello').all();
const events = $('Google Calendar').all();

// Format Trello cards — focus on This Week and Today lists
const cardList = cards.map(c => {
  const labels = c.json.labels?.map(l => l.name).join(', ') || 'No label';
  const due = c.json.due
    ? new Date(c.json.due).toLocaleDateString()
    : 'No due date';
  const overdue = c.json.due && new Date(c.json.due) < new Date() ? ' ⚠️ OVERDUE' : '';
  const members = c.json.idMembers?.length > 0 ? ' (assigned)' : ' (unassigned)';
  return `- ${c.json.name} [${labels}] (Due: ${due})${overdue}${members}`;
}).join('\n');

// Format calendar events
const eventList = events.map(e => {
  const start = new Date(e.json.start?.dateTime || e.json.start?.date);
  const end = new Date(e.json.end?.dateTime || e.json.end?.date);
  const startTime = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const endTime = end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  return `- ${e.json.summary} (${startTime} - ${endTime})`;
}).join('\n');

const prompt = `You are an ADHD executive function coach creating a morning briefing.

This person is a team lead who adds tasks directly to their board (no inbox). They have newer team members they're responsible for. They struggle with initiation and time blindness.

TODAY'S CALENDAR:
${eventList || 'No meetings today — great day for deep work!'}

ALL ACTIVE TRELLO TASKS:
${cardList || 'Board is empty — time to add some tasks!'}

CREATE A MORNING PLAN:
- Suggest max 3 personal priorities for today
- Flag any OVERDUE items with urgency (but no guilt)
- Note any team member cards that need check-ins
- Match task suggestions to energy levels (assume medium unless they tell you otherwise)
- Front-load deep work before meetings
- Include buffer/break time
- If the board looks overwhelming, acknowledge it and suggest just ONE thing to start
- End with one encouraging sentence
- Keep the entire response under 250 words
- Format as a clean, easy-to-scan text message (use emoji sparingly)`;

return [{ json: { prompt } }];
```

**Node 5 — Anthropic (Claude API):**

- Add node → search "Anthropic"
- Select your Anthropic credential
- Model: `claude-haiku-4-5-20251001` (cheapest + fast — perfect for daily briefings)
- Messages → User Message: `{{ $json.prompt }}`
- Max Tokens: 500

**Node 6 — Twilio: Send SMS:**

- Add node → search "Twilio"
- Select your Twilio credential
- From: Your Twilio phone number
- To: Your personal phone number
- Message: `Morning Briefing\n\n{{ $json.message.content[0].text }}`

> **Note:** SMS has a 1600-character limit per message. The prompt already asks Claude to keep responses under 250 words, which fits within this limit. If you ever see truncated messages, reduce the word count in the prompt or split into multiple SMS nodes.

**Testing and activation:**

1. Click **"Test Workflow"** (the play button) to run it immediately
2. Check your texts — you should get a morning briefing based on your actual board and calendar
3. If it works, toggle the workflow **Active** (switch in the top right)
4. Tomorrow morning at 7:30 AM, your first automated briefing will arrive

### Workflow 2 — Crash Recovery Detection

**What it does:** Every 12 hours, checks whether you've touched your Trello board. If you haven't interacted with it in 48+ hours, it starts sending you escalating (but gentle, never judgmental) nudges via SMS. If you go 14+ days without activity, it auto-cleans the board so you come back to something fresh instead of an overwhelming mess.

**Why this is the most important workflow in the entire system:** Every ADHD productivity system follows a predictable arc: 2 weeks of enthusiasm → gradual neglect → complete abandonment → shame spiral. This workflow catches you in the "gradual neglect" phase and gently pulls you back. It's the safety net under the whole system.

**How to build it:**

```
[Schedule Trigger] → [HTTP Request: Get Board] → [Code: Check Activity] → [IF: Should Send?] → [Twilio: Send SMS]
```

**Node 1 — Schedule Trigger:**

- Cron: `0 */12 * * *` (every 12 hours)

**Node 2 — HTTP Request (Trello API):**

- Method: **GET**
- URL: `https://api.trello.com/1/boards/YOUR_BOARD_ID?fields=dateLastActivity`
- Query Parameters:
  - `key` = your Trello API key
  - `token` = your Trello token
- This returns the timestamp of the last activity on the board

**Node 3 — Code Node:**

```javascript
const lastActivity = new Date($json.dateLastActivity);
const now = new Date();
const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
const daysSinceActivity = Math.floor(hoursSinceActivity / 24);

// Deduplication: track which tier we last sent and when
const staticData = $getWorkflowStaticData('global');
const lastTierSent = staticData.lastTierSent || 0;
const lastNudgeTime = staticData.lastNudgeTime ? new Date(staticData.lastNudgeTime) : null;

// Determine the current tier based on inactivity
let currentTier = 0;
if (daysSinceActivity >= 14) currentTier = 4;
else if (daysSinceActivity >= 7) currentTier = 3;
else if (daysSinceActivity >= 4) currentTier = 2;
else if (daysSinceActivity >= 2) currentTier = 1;

let message = '';
let shouldSend = false;

// Only send if: we've escalated to a new tier, OR it's been 24+ hours since last nudge at this tier
const hoursSinceLastNudge = lastNudgeTime ? (now - lastNudgeTime) / (1000 * 60 * 60) : Infinity;
const isNewTier = currentTier > lastTierSent;
const isTimeForRepeat = currentTier > 0 && hoursSinceLastNudge >= 24;

if (currentTier > 0 && (isNewTier || isTimeForRepeat)) {
  if (currentTier === 4) {
    message = `🌱 Hey — it's been a couple weeks. No judgment, seriously. I went ahead and tidied up your board so it's fresh when you're ready.\n\nHere's the only thing I'm asking: open Trello and just *look* at it. That's it. That counts as a win.\n\nReply 👋 to let me know you're around.`;
  } else if (currentTier === 3) {
    message = `👋 It's been about a week since your last board activity. Want to do a 2-minute reset? Just reply "reset" and I'll help you pick one small thing to start with.\n\nOr just reply with anything — even an emoji counts.`;
  } else if (currentTier === 2) {
    message = `🌤️ Your board has some items waiting in This Week. I spotted a low-energy task that might take about 5 minutes — want me to surface it?\n\nSometimes the hardest part is just opening the board.`;
  } else if (currentTier === 1) {
    message = `☕ Quick check-in — your board has items in This Week. No pressure, but your future self will thank you for 5 minutes today.\n\nReply with anything to let me know you're alive!`;
  }
  shouldSend = true;

  // Update deduplication state
  staticData.lastTierSent = currentTier;
  staticData.lastNudgeTime = now.toISOString();
} else if (currentTier === 0) {
  // User is active — reset tracking so nudges start fresh next time
  staticData.lastTierSent = 0;
  staticData.lastNudgeTime = null;
}

return [{ json: { shouldSend, message, daysSinceActivity } }];
```

**Node 4 — IF Node:**

- Condition: `{{ $json.shouldSend }}` equals `true`

**Node 5 — Twilio: Send SMS:**

- Add node → search "Twilio"
- Select your Twilio credential
- From: Your Twilio phone number
- To: Your personal phone number
- Message: `{{ $json.message }}`

**Advanced extension (add in Week 2):** Add a branch after the IF node that triggers when `daysSinceActivity >= 14`. This branch should call the Trello API to: archive all Done cards, move all Doing and Today cards back to This Week, and create a "Welcome Back" card in Today with a simple 3-item checklist. This way when you finally return, the board is clean instead of a guilt-inducing graveyard.

### Workflow 3 — Email-to-Trello Smart Capture

**What it does:** Monitors a designated Gmail label (e.g., "Tasks") for incoming emails. When you forward an email or send yourself a quick note, n8n uses Claude Haiku to extract task details and creates a properly labeled Trello card in your `📅 This Week` list. Sends you a confirmation SMS so you know it landed.

**Why this matters:** You can email yourself a task from any device — phone, tablet, laptop — and it lands on your board properly structured. Trello has its own email-to-board feature, but this version adds AI-powered labeling and energy-level tagging. No inbox means tasks need to land somewhere useful immediately. Forward an email like "need to review the Q3 report by Friday" and a properly structured card with a due date, priority label, and energy estimate appears on your board without you touching Trello.

**Setup prerequisite:** Create a Gmail label called "Tasks" first. You can set up a filter to auto-label emails sent to a specific alias (like `yourname+tasks@gmail.com`), or just manually apply the label when forwarding. Save the address in your phone contacts for one-tap forwarding.

**How to build it:**

```
[Gmail Trigger: New email with label "Tasks"] → [Anthropic: Extract Task Info] → [Code: Map Labels] → [Trello: Create Card] → [Twilio: Send SMS confirmation]
```

**Node 1 — Gmail Trigger:**

- Add node → search "Gmail Trigger"
- Event: **New Email Received**
- Filter: Label = `Tasks` (select the label you created)
- Poll interval: Every 5 minutes (or whatever frequency you want)

> **Tip:** Save your `yourname+tasks@gmail.com` address as a contact in your phone called "Add Task" — then forwarding task emails is two taps.

**Node 2 — Anthropic (Claude Haiku):**

- Model: `claude-haiku-4-5-20251001`
- User Message:

```
Extract task information from this email. Return ONLY valid JSON, no other text.

Fields:
- "title": concise task title, max 10 words
- "energy": one of "high", "medium", "low", or "brain_dead"
- "priority": one of "urgent_important", "important", "urgent", or "backlog"
- "due_date": ISO date string if a date/deadline is mentioned, or null
- "is_team_task": true if it seems like something for a team member, false if personal
- "description": the original email text

Subject: "{{ $json.subject }}"
Body: "{{ $json.snippet }}"
```

- Max Tokens: 200

**Node 3 — Code Node (map Claude's response to Trello label IDs):**

```javascript
// Parse Claude's JSON response
let parsed;
try {
  const text = $json.message.content[0].text;
  parsed = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
} catch (e) {
  // If parsing fails, create a basic card from the email subject
  parsed = {
    title: $('Gmail Trigger').first().json.subject?.substring(0, 50) || 'New task from email',
    energy: 'medium',
    priority: 'backlog',
    due_date: null,
    description: $('Gmail Trigger').first().json.snippet || ''
  };
}

// Map energy levels to your Trello label IDs
// IMPORTANT: Replace these with YOUR actual label IDs from Trello
// (Find them by going to your board URL + .json, search for "labels")
const energyToLabel = {
  'high': 'YOUR_RED_LABEL_ID',
  'medium': 'YOUR_ORANGE_LABEL_ID',
  'low': 'YOUR_GREEN_LABEL_ID',
  'brain_dead': 'YOUR_PURPLE_LABEL_ID'
};

return [{ json: {
  title: parsed.title,
  labelId: energyToLabel[parsed.energy] || energyToLabel['medium'],
  dueDate: parsed.due_date,
  description: parsed.description || '',
  priority: parsed.priority
}}];
```

**Node 4 — Trello: Create Card:**

- Operation: Create Card
- List: your `📅 This Week` list ID
  - Find it: open your board URL + `.json` in a browser → search for "This Week" → copy the `id` value next to it
- Card Name: `{{ $json.title }}`
- Description: `{{ $json.description + "\n\n_Created from email capture_" }}`
- Label IDs: `{{ $json.labelId }}`
- Due Date: `{{ $json.dueDate }}` (leave empty/null if no date was extracted)

> **Note on newlines:** n8n's expression `{{ }}` handles newlines correctly in most nodes. If you see a literal `\n` appearing on the card instead of an actual line break, use a Code node before the Trello node to format the description: `return [{ json: { ...items[0].json, description: items[0].json.description + "\n\n_Created from email capture_" } }];`

**Node 5 — Twilio: Send SMS:**

- Add node → search "Twilio"
- Select your Twilio credential
- From: Your Twilio phone number
- To: Your personal phone number
- Message: `Card created: {{ $json.title }}`

**Testing:**

1. Send yourself an email at `yourname+tasks@gmail.com` with subject: "Review the new hire onboarding doc by next Monday"
2. Apply the "Tasks" label to it (or wait for your filter to auto-apply it)
3. Check Trello — a card should appear in This Week with a title, energy label, and due date
4. Check your texts — you should get a confirmation SMS
5. If it works, toggle **Active**

---

# PHASE 3: SUNDAY (2 hours)

## Step 6: Build secondary workflows (60 min)

### Workflow 4 — Smart Reminders

**What it does:** Every 2 hours during work hours, checks for cards due within the next 2 hours and sends you an SMS heads-up.

**Build this pipeline:**

```
[Schedule: every 2 hours, Mon-Fri 9am-6pm] → [Trello: Get Cards with due dates] → [Code: Filter cards due within 2 hours] → [IF: Any cards due?] → [Twilio: Send SMS]
```

The Code node should filter cards where `new Date(card.due) - new Date() < 2 * 60 * 60 * 1000` and `new Date(card.due) > new Date()`.

### Workflow 5 — Overdue & Stale Alerts

**What it does:** Every 4 hours, finds cards that are past due or have been sitting in This Week without modification for 48+ hours. Sends you a categorized SMS summary. On Fridays, adds a weekly completion summary.

**Build this pipeline:**

```
[Schedule: every 4 hours] → [Trello: Get All Cards] → [Code: Categorize overdue/stale/team-blocked] → [IF: Any issues?] → [Twilio: Send SMS]
```

The Code node should check:

- Cards where `due < now` → categorize as "Overdue"
- Cards in This Week where `dateLastActivity` is 48+ hours ago → categorize as "Stale"
- Cards assigned to team members that are overdue → categorize as "Team follow-up needed"

**Friday addition:** Check if today is Friday in the Code node. If yes, also count completed cards from the Done list (or archived cards from this week) and include a "This week you completed X tasks" stat.

## Step 7: Calendar sync + end-to-end testing (60 min)

### Workflow 6 — Trello ↔ Google Calendar Sync

**What it does:** Every 15 minutes, checks Trello for cards with due dates and creates/updates matching Google Calendar events. This makes Trello deadlines visible in your calendar alongside meetings.

**Build this pipeline:**

```
[Schedule: every 15 min] → [Trello: Get Cards with due dates] → [Code: Compare to stored calendar event IDs] → [Google Calendar: Create/Update Events]
```

**Critical detail — preventing infinite loops:**
Use n8n's **Static Data** (available in the Code node via `$getWorkflowStaticData('global')`) to store a mapping of Trello card IDs → Google Calendar event IDs. Before creating a new calendar event, check if one already exists for that card. Before updating, check if the due date actually changed.

### End-to-end smoke test

Run through the complete system to make sure everything connects:

1. **Email a task to yourself:** Send an email to `yourname+tasks@gmail.com` with "Prepare slides for Monday's team meeting" → verify it appears as a card in Trello's This Week list with appropriate labels
2. **Drag the card through the pipeline:** This Week → Today → Doing → Done
3. **Verify Butler rules at each stage:**
   - Doing: Did the "Task Kickoff" checklist appear? Did the 4-hour due date get set?
   - Done: Did the due date mark complete? Did all checklist items get checked?
4. **Manually trigger Workflow 1** (Morning Briefing) → check your texts for the briefing message
5. **Check Google Calendar** → confirm the card's due date created a calendar event
6. **Test the 🧹 Clean Up Board button** → does it reset everything to This Week?

If all 6 checks pass, your core system is fully operational.

---

# PHASE 4: WEEK 2+ (ongoing iteration)

## What to add next (only when the base system is running and you're actually using it)

| Addition | Effort | When to add | Why |
|----------|--------|-------------|-----|
| Energy-aware morning briefing (asks for your energy via SMS reply) | 30 min | Week 2 | Currently assumes medium energy; interactive version is better |
| Body doubling check-in (Pomodoro-style SMS nudges) | 45 min | Week 2 | Sends "What are you working on for the next 25 min?" then checks back |
| Weekly review automation (Friday summary + next week planning) | 60 min | Week 3 | Auto-generates a review using Claude based on week's board activity |
| Day-14 auto-recovery branch on Workflow 2 | 30 min | Week 2 | Archives stale cards and creates fresh "Welcome Back" tasks |
| Delegation tracker (alerts when team cards are stale) | 45 min | Week 3 | Catches tasks you assigned that aren't moving |
| Google Workspace MCP (Gmail + Docs integration) | 30 min | Month 2 | Let Claude help with email and document drafting |
| Flowise chatbot on same VPS (mobile ADHD coach) | 60 min | Month 2 | Chat interface you can access from your phone |
| Pattern analysis (completion rates, energy trends) | 90 min | Month 3 | Claude analyzes weeks of data to find your productivity patterns |

**The rule:** Add complexity only when you feel a genuine need — never preemptively. If something sounds useful but you're not sure you need it, you don't need it yet. This rule exists because the ADHD hyperfocus-on-setup trap is real and it's the first step toward abandoning the whole thing.

---

# COMPLETE COST SUMMARY

| Component | Monthly cost | Setup time |
|-----------|-------------|------------|
| Trello Standard | $5 | 45 min |
| Railway VPS (n8n hosting) | $5-7 | 15 min |
| Claude Pro (Desktop + MCP + Projects) | $20 | 60 min |
| Anthropic API (Haiku for n8n workflows) | $5-10 | 10 min |
| Twilio SMS | $1.50-2.50 | 15 min |
| All Power-Ups (Calendar, List Limits, Card Repeater, Card Aging) | $0 | 10 min |
| All MCP servers (Trello, Calendar) | $0 | 30 min |
| n8n software | $0 | — |
| **Total** | **$36.50-44.50/mo** | **~7 hours** |

---

# QUICK REFERENCE: EVERY URL YOU NEED

| What | URL |
|------|-----|
| Trello signup | <https://trello.com/signup> |
| Trello board settings / billing | <https://trello.com/your-boards> → profile → Settings |
| Trello Power-Up admin (API keys) | <https://trello.com/power-ups/admin> |
| Trello Butler automation | <https://trello.com/butler> |
| Claude AI (web) | <https://claude.ai> |
| Claude Desktop download | <https://claude.ai/download> |
| Claude Desktop config (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop config (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Anthropic API console | <https://console.anthropic.com> |
| Anthropic API keys | <https://console.anthropic.com/settings/keys> |
| Railway n8n 1-click deploy | <https://railway.com/deploy/n8n> |
| Hetzner Cloud (VPS) | <https://www.hetzner.com/cloud> |
| Google Cloud Console (OAuth setup) | <https://console.cloud.google.com> |
| Twilio signup | <https://www.twilio.com/try-twilio> |
| Twilio Console | <https://console.twilio.com> |
| MCP Server: Trello | <https://github.com/delorenj/mcp-server-trello> |
| MCP Server: Google Calendar | <https://github.com/nspady/google-calendar-mcp> |
| MCP Server: Google Workspace (all-in-one) | <https://github.com/taylorwilsdon/google_workspace_mcp> |
| ADHD n8n template (reference/inspiration) | <https://github.com/Zenitr0/second-brain-adhd-n8n> |
| Flowise (future: mobile chat interface) | <https://github.com/FlowiseAI/Flowise> |
| Node.js (prerequisite for MCP servers) | <https://nodejs.org> |

---

# THE MOST IMPORTANT REMINDER

Your system **will** break. You **will** abandon it for a week (or two). That is not failure — that's the expected lifecycle for every ADHD productivity system ever built. The crash recovery workflow (Workflow 2) exists precisely for this moment. It will find you via text message and gently bring you back.

When you come back:

1. Open Trello
2. Click the `🧹 Clean Up Board` button
3. Look at This Week
4. Pick ONE card — the easiest one
5. Move it to Doing
6. That's enough for today

The measure of success isn't maintaining a perfect board. It's how quickly you restart after a lapse. Every Butler rule, every n8n workflow, every MCP connection you just set up is a gift from your current motivated self to your future low-energy self. You built the scaffolding. Now let it hold you up.
