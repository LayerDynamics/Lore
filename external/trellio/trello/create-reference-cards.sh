#!/usr/bin/env bash
# ============================================
# Create Reference Cards with Checklists
# ============================================
# Creates the 3 reference cards in the Reference list:
#   1. *** Checklist Templates (with Task Kickoff, Weekly Review, Delegation Handoff)
#   2. Team Agreements
#   3. Key Links
#
# Prerequisites: curl, jq, .env with board/list IDs from create-board.sh
# Usage: ./trello/create-reference-cards.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"
CONFIG_FILE="${SCRIPT_DIR}/board-config.json"

# --- Load environment ---
if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: .env file not found. Run create-board.sh first."
    exit 1
fi
source "$ENV_FILE"

if [[ -z "${TRELLO_API_KEY:-}" || -z "${TRELLO_TOKEN:-}" ]]; then
    echo "ERROR: TRELLO_API_KEY and TRELLO_TOKEN must be set in .env"
    exit 1
fi

if [[ -z "${TRELLO_LIST_REFERENCE_ID:-}" ]]; then
    echo "ERROR: TRELLO_LIST_REFERENCE_ID not set. Run create-board.sh first."
    exit 1
fi

TRELLO_BASE="https://api.trello.com/1"
AUTH="key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"

api_delay() { sleep 0.1; }

# Helper: update .env file
update_env() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

trello_api() {
    local method="$1" url="$2"
    shift 2
    local response
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" "$@")
    local http_code body
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
        echo "ERROR: API call failed (HTTP $http_code)"
        echo "URL: $url"
        echo "Response: $body"
        return 1
    fi
    echo "$body"
}

echo "=========================================="
echo "  Creating Reference Cards"
echo "=========================================="
echo ""

REF_LIST_ID="$TRELLO_LIST_REFERENCE_ID"
CARD_COUNT=$(jq '.referenceCards | length' "$CONFIG_FILE")

for i in $(seq 0 $((CARD_COUNT - 1))); do
    CARD_NAME=$(jq -r ".referenceCards[$i].name" "$CONFIG_FILE")
    CARD_DESC=$(jq -r ".referenceCards[$i].desc // \"\"" "$CONFIG_FILE")
    HAS_CHECKLISTS=$(jq ".referenceCards[$i].checklists // null" "$CONFIG_FILE")

    echo "[Card $((i+1))/$CARD_COUNT] Creating: $CARD_NAME"

    # Create the card
    CARD_RESPONSE=$(trello_api POST "${TRELLO_BASE}/cards?${AUTH}" \
        -d "idList=${REF_LIST_ID}" \
        --data-urlencode "name=${CARD_NAME}" \
        --data-urlencode "desc=${CARD_DESC}" \
        -d "pos=bottom")

    CARD_ID=$(echo "$CARD_RESPONSE" | jq -r '.id')
    echo "  Card ID: $CARD_ID"
    api_delay

    # Save the Templates card ID for Butler rule references
    if [[ "$CARD_NAME" == "*** Checklist Templates" ]]; then
        update_env "TRELLO_CARD_TEMPLATES_ID" "$CARD_ID"
        echo "  (Saved as TRELLO_CARD_TEMPLATES_ID)"
    fi

    # Create checklists if defined
    if [[ "$HAS_CHECKLISTS" != "null" ]]; then
        CL_COUNT=$(jq ".referenceCards[$i].checklists | length" "$CONFIG_FILE")

        for j in $(seq 0 $((CL_COUNT - 1))); do
            CL_NAME=$(jq -r ".referenceCards[$i].checklists[$j].name" "$CONFIG_FILE")

            echo "  Creating checklist: $CL_NAME"
            CL_RESPONSE=$(trello_api POST "${TRELLO_BASE}/cards/${CARD_ID}/checklists?${AUTH}" \
                --data-urlencode "name=${CL_NAME}")

            CL_ID=$(echo "$CL_RESPONSE" | jq -r '.id')
            api_delay

            # Add checklist items
            ITEM_COUNT=$(jq ".referenceCards[$i].checklists[$j].items | length" "$CONFIG_FILE")

            for k in $(seq 0 $((ITEM_COUNT - 1))); do
                ITEM_NAME=$(jq -r ".referenceCards[$i].checklists[$j].items[$k]" "$CONFIG_FILE")

                trello_api POST "${TRELLO_BASE}/checklists/${CL_ID}/checkItems?${AUTH}" \
                    --data-urlencode "name=${ITEM_NAME}" \
                    -d "pos=bottom" >/dev/null
                api_delay
            done

            echo "    Added $ITEM_COUNT items"
        done
    fi

    echo ""
done

echo "=========================================="
echo "  Reference cards created successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Follow ./trello/butler-rules-manual.md to set up Butler automations"
echo "  2. Enable Power-Ups in Trello: Calendar, List Limits, Card Repeater, Card Aging"
