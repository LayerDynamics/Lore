#!/usr/bin/env bash
# ============================================
# Verify Setup - Smoke Tests
# ============================================
# Validates each component of the ADHD Trello system.
#
# Usage: ./scripts/verify-setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: .env not found. Run setup.sh first."
    exit 1
fi
source "$ENV_FILE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

check() {
    local name="$1"
    local result="$2"
    if [[ "$result" == "pass" ]]; then
        echo -e "  ${GREEN}PASS${NC} $name"
        PASS=$((PASS + 1))
    elif [[ "$result" == "fail" ]]; then
        echo -e "  ${RED}FAIL${NC} $name"
        FAIL=$((FAIL + 1))
    else
        echo -e "  ${YELLOW}SKIP${NC} $name"
        SKIP=$((SKIP + 1))
    fi
}

echo "=========================================="
echo "  System Verification"
echo "=========================================="
echo ""

# --- Trello API ---
echo "Trello:"

if [[ -z "${TRELLO_API_KEY:-}" || -z "${TRELLO_TOKEN:-}" ]]; then
    check "API credentials" "fail"
else
    check "API credentials" "pass"
fi

if [[ -n "${TRELLO_BOARD_ID:-}" ]]; then
    BOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.trello.com/1/boards/${TRELLO_BOARD_ID}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}")
    if [[ "$BOARD_RESPONSE" == "200" ]]; then
        check "Board accessible" "pass"
    else
        check "Board accessible (HTTP $BOARD_RESPONSE)" "fail"
    fi

    # Check lists
    LISTS=$(curl -s "https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}")
    LIST_COUNT=$(echo "$LISTS" | jq 'length')
    if [[ "$LIST_COUNT" -eq 5 ]]; then
        check "5 lists created" "pass"
    else
        check "5 lists created (found $LIST_COUNT)" "fail"
    fi

    # Check labels
    LABELS=$(curl -s "https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/labels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}")
    LABEL_COUNT=$(echo "$LABELS" | jq '[.[] | select(.name != "")] | length')
    if [[ "$LABEL_COUNT" -eq 5 ]]; then
        check "5 labels created" "pass"
    else
        check "5 labels created (found $LABEL_COUNT)" "fail"
    fi

    # Check custom fields
    FIELDS=$(curl -s "https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/customFields?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}")
    FIELD_COUNT=$(echo "$FIELDS" | jq 'length')
    if [[ "$FIELD_COUNT" -eq 4 ]]; then
        check "4 custom fields created" "pass"
    else
        check "4 custom fields created (found $FIELD_COUNT)" "fail"
    fi
else
    check "Board ID set" "fail"
fi

echo ""

# --- n8n ---
echo "n8n:"

N8N_PORT="${N8N_PORT:-5678}"
N8N_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${N8N_PORT}/healthz" 2>/dev/null || echo "000")
if [[ "$N8N_HEALTH" == "200" ]]; then
    check "n8n running (port $N8N_PORT)" "pass"
else
    check "n8n running (port $N8N_PORT)" "fail"
fi

# Check Docker containers
if command -v docker &>/dev/null; then
    N8N_CONTAINER=$(docker ps --filter "ancestor=n8nio/n8n" --format "{{.Status}}" 2>/dev/null | head -1)
    PG_CONTAINER=$(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Status}}" 2>/dev/null | head -1)

    if [[ -n "$N8N_CONTAINER" ]]; then
        check "n8n container ($N8N_CONTAINER)" "pass"
    else
        check "n8n container" "fail"
    fi

    if [[ -n "$PG_CONTAINER" ]]; then
        check "PostgreSQL container ($PG_CONTAINER)" "pass"
    else
        check "PostgreSQL container" "fail"
    fi
else
    check "Docker" "skip"
fi

echo ""

# --- Workflow files ---
echo "Workflow files:"

EXPECTED_WORKFLOWS=(
    "01-morning-planning-briefing.json"
    "02-crash-recovery-detection.json"
    "03-email-to-trello-capture.json"
    "04-smart-reminders.json"
    "05-overdue-stale-alerts.json"
    "06-trello-calendar-sync.json"
)

for wf in "${EXPECTED_WORKFLOWS[@]}"; do
    WF_PATH="${PROJECT_DIR}/n8n/workflows/$wf"
    if [[ -f "$WF_PATH" ]]; then
        # Validate it's valid JSON
        if jq empty "$WF_PATH" 2>/dev/null; then
            check "$wf (valid JSON)" "pass"
        else
            check "$wf (invalid JSON)" "fail"
        fi
    else
        check "$wf" "fail"
    fi
done

echo ""

# --- Anthropic API ---
echo "Anthropic API:"

if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "https://api.anthropic.com/v1/messages" \
        -H "x-api-key: ${ANTHROPIC_API_KEY}" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d '{"model":"claude-haiku-4-5-20241022","max_tokens":10,"messages":[{"role":"user","content":"ping"}]}')
    if [[ "$API_RESPONSE" == "200" ]]; then
        check "Anthropic API key valid" "pass"
    else
        check "Anthropic API key (HTTP $API_RESPONSE)" "fail"
    fi
else
    check "Anthropic API key" "skip"
fi

echo ""

# --- Twilio ---
echo "Twilio:"

if [[ -n "${TWILIO_ACCOUNT_SID:-}" && -n "${TWILIO_AUTH_TOKEN:-}" ]]; then
    check "Twilio credentials set" "pass"
else
    check "Twilio credentials" "skip"
fi

if [[ -n "${TWILIO_PHONE_NUMBER:-}" && -n "${MY_PHONE_NUMBER:-}" ]]; then
    check "Phone numbers configured" "pass"
else
    check "Phone numbers" "skip"
fi

echo ""

# --- Claude Desktop ---
echo "Claude Desktop:"

CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [[ -f "$CLAUDE_CONFIG" ]]; then
    if jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
        MCP_COUNT=$(jq '.mcpServers | length' "$CLAUDE_CONFIG")
        check "Config valid ($MCP_COUNT MCP servers)" "pass"
    else
        check "Config (invalid JSON)" "fail"
    fi
else
    check "Config file" "skip"
fi

echo ""

# --- Summary ---
echo "=========================================="
TOTAL=$((PASS + FAIL + SKIP))
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$SKIP skipped${NC} / $TOTAL checks"
echo "=========================================="

if [[ $FAIL -gt 0 ]]; then
    echo ""
    echo "Fix failing checks and run again."
    exit 1
fi
