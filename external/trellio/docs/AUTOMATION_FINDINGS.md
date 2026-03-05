# DefTrello — Automating the "Manual" Steps

**Research Date:** February 16, 2026
**Status:** 5 of 7 manual steps can be fully or mostly automated. 2 remain UI-only.

---

## Summary: What Can Be Automated

| Manual Step | Can Automate? | Method | You Still Do |
|---|---|---|---|
| 1. Trello Power-Ups | **NO** | No API exists | ~2 min clicking in Trello UI |
| 2. Trello List Limits (WIP) | **YES** | `PUT /1/lists/{id}/softLimit` | Nothing |
| 3. Butler Rules | **MOSTLY** | Trello Webhooks + your MCP server replicate Butler logic | Nothing (code replaces Butler) |
| 4. n8n Credentials | **YES** | `POST /api/v1/credentials` | OAuth browser flow for Google only |
| 5. n8n Variables | **YES** | `POST /api/v1/variables` | Nothing |
| 6. n8n Workflow Activation | **YES** | `PATCH /api/v1/workflows/{id}` with `{"active": true}` | Nothing |
| 7. Claude Desktop Config | **YES** | Script writes JSON to `~/Library/Application Support/Claude/` | Restart Claude Desktop |
| 8. Gmail Label | **YES** | Gmail API `POST /gmail/v1/users/me/labels` | One-time OAuth consent |
| 9. Claude Project Setup | **NO** | No API for claude.ai Projects | ~2 min copy-paste in browser |

**Bottom line: A setup script can handle ~80% of what MANUAL_STEPS.md says you must do by hand.**

---

## Step-by-Step: How to Automate Each One

### 1. Trello Power-Ups — NOT AUTOMATABLE

**Why:** There is no public Trello REST API endpoint to enable or disable a Power-Up on a board. This remains a UI-only action.

**What you do:** Open your board → Power-Ups → search and enable these 4 (takes ~2 minutes):
- Calendar
- List Limits
- Card Repeater
- Card Aging

**Source:** [Trello Power-Up docs](https://support.atlassian.com/trello/docs/enabling-power-ups/)

---

### 2. Trello List Limits (WIP) — FULLY AUTOMATABLE

**How:** Trello lists have a `softLimit` property accessible via the REST API.

```bash
# Set Doing list limit to 2
curl -X PUT "https://api.trello.com/1/lists/${TRELLO_LIST_DOING_ID}/softLimit?value=2&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"

# Set Today list limit to 5
curl -X PUT "https://api.trello.com/1/lists/${TRELLO_LIST_TODAY_ID}/softLimit?value=5&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"
```

This is a "soft" limit — the list turns yellow/amber when exceeded but doesn't block adding cards. This matches the List Limits Power-Up behavior.

**Note:** The List Limits Power-Up must be enabled first (Step 1) for the visual warning to appear in the UI. The `softLimit` API field sets the underlying value.

**Source:** [Trello REST API - Lists](https://developer.atlassian.com/cloud/trello/rest/api-group-lists/)

---

### 3. Butler Rules — REPLACEABLE WITH WEBHOOKS + CODE

**Why Butler can't be automated:** There is no Trello API endpoint to create Butler automation rules. Butler is entirely UI-driven.

**The workaround:** You don't actually need Butler. Every Butler rule in your setup can be replicated by Trello webhooks calling your MCP server or n8n. Your MCP server already has the logic for most of these.

Here's how each Butler rule maps to an automatable approach:

| Butler Rule | Replacement |
|---|---|
| **Rule 1: Auto-complete on Done** (mark due complete, check all items) | Trello webhook → n8n workflow listens for `updateCard` where `listAfter.name == "Done"` → calls Trello API to mark due complete + check items |
| **Rule 2: Auto-setup on Doing** (set due 4h, join card, copy checklist) | Same webhook pattern → set due date, add member, copy checklist via API |
| **Rule 3: Daily board reset** (7 PM sweep Today→This Week) | n8n scheduled workflow (cron) → calls Trello API to move cards. **You already have this in your n8n workflows.** |
| **Rule 4: Recurring tasks** (Card Repeater) | n8n cron workflow creates cards on schedule. Or keep Card Repeater Power-Up (it's fine). |
| **Rule 5: Due date surfacing** (move to Today when due) | n8n scheduled check every 30 min → query cards with approaching due dates → move to Today |
| **Rule 6: Auto-archive Done** (11 PM archive 3+ day old cards) | n8n cron → query Done list → filter cards older than 3 days → archive via API |
| **Board Button: Clean Up** | Already implemented as `clean_up_board` tool in your MCP server |

**How to create the webhook:**

```bash
# Create a webhook watching your board
curl -X POST "https://api.trello.com/1/webhooks/" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackURL": "https://your-n8n.railway.app/webhook/trello-events",
    "idModel": "'${TRELLO_BOARD_ID}'",
    "description": "DefTrello board automation webhook"
  }' \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}"
```

Then create an n8n workflow with a Webhook trigger node that receives these events and performs the Butler-equivalent actions.

**Advantage over Butler:** No 1,000 automation run/month quota. No silent failures when quota is exceeded. Full visibility in n8n execution logs. You control the logic.

**Source:** [Trello Webhooks docs](https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/)

---

### 4. n8n Credentials — MOSTLY AUTOMATABLE

**How:** The n8n REST API has full CRUD endpoints for credentials.

```bash
N8N_URL="https://your-n8n.railway.app"
N8N_API_KEY="your-n8n-api-key"

# Get the schema for Trello credentials to see required fields
curl -X GET "${N8N_URL}/api/v1/credentials/schema/trelloApi" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}"

# Create Trello credential
curl -X POST "${N8N_URL}/api/v1/credentials" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trello API",
    "type": "trelloApi",
    "data": {
      "apiKey": "'${TRELLO_API_KEY}'",
      "apiToken": "'${TRELLO_TOKEN}'"
    }
  }'

# Create Twilio credential
curl -X POST "${N8N_URL}/api/v1/credentials" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Twilio",
    "type": "twilioApi",
    "data": {
      "accountSid": "'${TWILIO_ACCOUNT_SID}'",
      "authToken": "'${TWILIO_AUTH_TOKEN}'"
    }
  }'
```

**What you still do manually:** Google Calendar OAuth2 and Gmail OAuth2 credentials require a browser-based consent flow. You must click "Allow" in your Google account. After that initial consent, the refresh token can be stored via the API.

**Assigning credentials to workflow nodes:** After creating credentials, you get back credential IDs. You can then update workflow JSON to reference these IDs before importing, or use `PATCH /api/v1/workflows/{id}` to update nodes with the correct credential references.

**Source:** [n8n API Reference](https://docs.n8n.io/api/api-reference/), [n8n Workflow Management](https://docs.n8n.io/embed/managing-workflows/)

---

### 5. n8n Variables — FULLY AUTOMATABLE

**How:** The n8n REST API provides variable management endpoints.

```bash
# Create all required n8n variables from your .env
for var in TRELLO_BOARD_ID TRELLO_API_KEY TRELLO_TOKEN \
           TRELLO_LIST_THIS_WEEK_ID TRELLO_LIST_TODAY_ID \
           TRELLO_LIST_DOING_ID TRELLO_LIST_DONE_ID \
           TRELLO_LABEL_HIGH_ENERGY_ID TRELLO_LABEL_MEDIUM_ENERGY_ID \
           TRELLO_LABEL_LOW_ENERGY_ID TRELLO_LABEL_BRAIN_DEAD_ID \
           TRELLO_LABEL_DUE_SOON_ID ANTHROPIC_API_KEY \
           TWILIO_PHONE_NUMBER MY_PHONE_NUMBER; do

  VALUE=$(grep "^${var}=" .env | cut -d'=' -f2-)

  curl -X POST "${N8N_URL}/api/v1/variables" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"${var}\", \"value\": \"${VALUE}\"}"

  echo "Set ${var}"
done
```

This reads every required variable from your `.env` file and pushes it to n8n in one loop. Zero manual clicking.

**Source:** [n8n Public API](https://docs.n8n.io/api/)

---

### 6. n8n Workflow Activation — FULLY AUTOMATABLE

**How:** Toggle any workflow active/inactive via the API.

```bash
# Get all workflow IDs
WORKFLOWS=$(curl -s -X GET "${N8N_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}")

# Activate a specific workflow by ID
curl -X PATCH "${N8N_URL}/api/v1/workflows/{workflow_id}" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

You can also trigger a test execution first:

```bash
curl -X POST "${N8N_URL}/api/v1/workflows/{workflow_id}/run" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}"
```

**Source:** [n8n API Reference](https://docs.n8n.io/api/api-reference/)

---

### 7. Claude Desktop Config — FULLY AUTOMATABLE

**How:** It's just a JSON file at a known path. A script can generate it from your `.env`.

```bash
# macOS
CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "deftrello": {
      "command": "node",
      "args": ["$(pwd)/mcp-server/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "${TRELLO_API_KEY}",
        "TRELLO_TOKEN": "${TRELLO_TOKEN}",
        "TRELLO_BOARD_ID": "${TRELLO_BOARD_ID}",
        "N8N_BASE_URL": "${N8N_WEBHOOK_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}",
        "PROJECT_DIR": "$(pwd)"
      }
    }
  }
}
EOF

echo "Config written. Restart Claude Desktop to activate."
```

**What you still do:** Quit and reopen Claude Desktop. There's no API to restart it.

**Source:** [MCP Server Setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers), [Claude Help Center](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

---

### 8. Gmail Label — FULLY AUTOMATABLE

**How:** The Gmail API has a dedicated label creation endpoint.

```bash
# After OAuth2 authentication
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/labels" \
  -H "Authorization: Bearer ${GMAIL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tasks",
    "messageListVisibility": "show",
    "labelListVisibility": "labelShow"
  }'
```

**What you still do:** The initial OAuth2 consent flow (one-time browser click to authorize). Also, creating the Gmail filter for `yourname+tasks@gmail.com` requires the Gmail API's `users.settings.filters.create` endpoint, which is also automatable.

**Source:** [Gmail API - labels.create](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/create)

---

### 9. Claude Project Setup — NOT AUTOMATABLE

**Why:** There is no public API for claude.ai Projects. Creating a project and pasting the system prompt must be done in the browser.

**What you do:** Go to claude.ai → Projects → New → paste the contents of `adhd-coach-system-prompt.md`. Takes ~2 minutes.

---

## Recommended Action Plan

### What I (Claude) Can Build Right Now

1. **`scripts/automate-setup.sh`** — A master automation script that:
   - Sets Trello list soft limits via API
   - Creates n8n credentials via API (Trello, Twilio, Anthropic HTTP)
   - Pushes all n8n variables from `.env` to n8n
   - Imports workflows and activates them in recommended order
   - Writes the Claude Desktop config file
   - Creates the Gmail "Tasks" label (if Google OAuth token is available)

2. **`n8n/workflows/07-board-automation-webhook.json`** — A new n8n workflow that:
   - Receives Trello webhook events
   - Replicates all 6 Butler rules + the Clean Up Board button
   - Eliminates the need for Butler entirely (no 1,000 run quota)

3. **`scripts/create-trello-webhook.sh`** — Registers the webhook with Trello

### What Still Requires Your Browser (5 minutes total)

1. Enable 4 Trello Power-Ups (~2 min)
2. Google OAuth consent for Gmail + Calendar (~2 min)
3. Create Claude Project on claude.ai (~1 min)
4. Restart Claude Desktop after config is written

---

## Sources

- [Trello REST API - Lists](https://developer.atlassian.com/cloud/trello/rest/api-group-lists/)
- [Trello Webhooks](https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/)
- [Trello Power-Up Enabling](https://support.atlassian.com/trello/docs/enabling-power-ups/)
- [n8n Public API](https://docs.n8n.io/api/)
- [n8n API Reference](https://docs.n8n.io/api/api-reference/)
- [n8n Credential Management](https://deepwiki.com/n8n-io/n8n/3.2-credentials-api-and-security)
- [n8n Workflow Management](https://docs.n8n.io/embed/managing-workflows/)
- [Gmail API - labels.create](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/create)
- [Claude Desktop MCP Setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
- [Claude Help Center - MCP](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
