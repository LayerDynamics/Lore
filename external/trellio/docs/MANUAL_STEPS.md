# Manual Setup Steps

These steps cannot be automated and must be completed in the UI.

---

## 1. Trello Power-Ups

On your board, click **Power-Ups** > **Add Power-Ups**. Enable all four (free on every plan):

- [ ] **Calendar** - Shows due-dated cards in calendar view
- [ ] **List Limits** - Warnings when lists exceed card limits
- [ ] **Card Repeater** - Auto-creates recurring cards
- [ ] **Card Aging** - Makes neglected cards gradually transparent

### Set List Limits
- [ ] `Doing` list > "..." menu > Set List Limit > **2**
- [ ] `Today` list > "..." menu > Set List Limit > **5**

### Sync Calendar to Google Calendar
- [ ] Power-Ups > Calendar > Enable sync > Copy iCalendar URL
- [ ] In Google Calendar: Other calendars (+) > From URL > Paste URL

---

## 2. Butler Automation Rules

Follow the step-by-step instructions in `trello/butler-rules-manual.md`.

- [ ] Rule 1: Auto-complete on Done
- [ ] Rule 2: Auto-setup on Doing
- [ ] Rule 3: Daily board reset (7 PM)
- [ ] Rule 4: Recurring tasks via Card Repeater
- [ ] Rule 5: Due date surfacing (+ companion rule)
- [ ] Rule 6: Auto-archive Done cards (11 PM)
- [ ] Board Button: Clean Up Board

---

## 3. n8n Credential Assignment

After importing workflows, you must assign credentials to each node in n8n:

1. Open each workflow in the n8n editor
2. Click on each node that uses an external service
3. Select the correct credential from the dropdown

| Node Type | Credential to Assign |
|-----------|---------------------|
| Trello nodes | Your Trello API credential |
| Google Calendar nodes | Your Google Calendar OAuth2 credential |
| Gmail Trigger nodes | Your Gmail OAuth2 credential |
| Twilio nodes | Your Twilio credential |

> HTTP Request nodes for Anthropic API use the `ANTHROPIC_API_KEY` environment variable and don't need separate credentials.

### Set n8n Environment Variables

In n8n Settings > Variables (or via environment), set these variables so workflows can reference them:

| Variable | Value |
|----------|-------|
| `TRELLO_BOARD_ID` | Your board ID from .env |
| `TRELLO_API_KEY` | Your Trello API key |
| `TRELLO_TOKEN` | Your Trello token |
| `TRELLO_LIST_THIS_WEEK_ID` | From .env |
| `TRELLO_LIST_TODAY_ID` | From .env |
| `TRELLO_LIST_DOING_ID` | From .env |
| `TRELLO_LIST_DONE_ID` | From .env |
| `TRELLO_LABEL_HIGH_ENERGY_ID` | From .env |
| `TRELLO_LABEL_MEDIUM_ENERGY_ID` | From .env |
| `TRELLO_LABEL_LOW_ENERGY_ID` | From .env |
| `TRELLO_LABEL_BRAIN_DEAD_ID` | From .env |
| `TRELLO_LABEL_DUE_SOON_ID` | From .env |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number |
| `MY_PHONE_NUMBER` | Your personal phone number |

---

## 4. Claude Desktop MCP Servers

1. Copy `claude/claude-desktop-config.json` to:
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
2. Replace placeholder values with your actual credentials from .env
3. Fully quit and reopen Claude Desktop
4. Test: Ask "What lists are on my Trello board?"

---

## 5. Claude Project Setup

1. Go to https://claude.ai > Projects > New Project
2. Name: `ADHD Executive Function Coach`
3. Paste the contents of `claude/adhd-coach-system-prompt.md` into Project Instructions
4. Save
5. Test: "Hey, what's on my plate today? Energy is about a 3."

---

## 6. Gmail Label for Email Capture (Workflow 3)

1. In Gmail, create a label called `Tasks`
2. (Optional) Set up a filter: emails sent to `yourname+tasks@gmail.com` auto-apply the `Tasks` label
3. Save `yourname+tasks@gmail.com` as a contact called "Add Task" on your phone

---

## 7. Activate Workflows

After all credentials are assigned and tested:

1. Open each workflow in n8n
2. Click **Test Workflow** to run it once manually
3. Verify output at each node
4. Toggle **Active** (switch in top right) to enable the schedule

Recommended activation order:
1. Workflow 2: Crash Recovery (safety net)
2. Workflow 1: Morning Briefing (core value)
3. Workflow 4: Smart Reminders
4. Workflow 5: Overdue Alerts
5. Workflow 3: Email Capture
6. Workflow 6: Calendar Sync
