#!/usr/bin/env bash
# ============================================
# Create ADHD Trello Board via REST API
# ============================================
# Creates the complete board structure:
#   - 5 lists (Reference, This Week, Today, Doing, Done)
#   - 5 labels (4 energy + Due Soon)
#   - 4 custom fields (Time Estimate, Task Type, Priority, Quick Win)
#
# Outputs all generated IDs to .env for downstream scripts.
#
# Prerequisites: curl, jq
# Usage: ./trello/create-board.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"
CONFIG_FILE="${SCRIPT_DIR}/board-config.json"

# --- Load environment ---
if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    echo "Copy .env.example to .env and fill in TRELLO_API_KEY and TRELLO_TOKEN first."
    exit 1
fi
source "$ENV_FILE"

if [[ -z "${TRELLO_API_KEY:-}" || -z "${TRELLO_TOKEN:-}" ]]; then
    echo "ERROR: TRELLO_API_KEY and TRELLO_TOKEN must be set in .env"
    exit 1
fi

# --- Check prerequisites ---
for cmd in curl jq; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: $cmd is required but not installed."
        exit 1
    fi
done

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "ERROR: Board config not found at $CONFIG_FILE"
    exit 1
fi

TRELLO_BASE="https://api.trello.com/1"
AUTH="key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"

# Helper: small delay to respect rate limits
api_delay() { sleep 0.1; }

# Helper: update .env file with a key=value pair
update_env() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# Helper: make an API call and check for errors
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
echo "  ADHD Trello Board Setup"
echo "=========================================="
echo ""

# --- Step 1: Create Board ---
BOARD_NAME=$(jq -r '.board.name' "$CONFIG_FILE")
echo "[1/5] Creating board: $BOARD_NAME"

BOARD_RESPONSE=$(trello_api POST "${TRELLO_BASE}/boards?${AUTH}" \
    -d "name=${BOARD_NAME}" \
    -d "defaultLists=false" \
    -d "prefs_permissionLevel=org")

BOARD_ID=$(echo "$BOARD_RESPONSE" | jq -r '.id')
echo "  Board ID: $BOARD_ID"
update_env "TRELLO_BOARD_ID" "$BOARD_ID"
api_delay

# --- Step 2: Create Lists ---
echo ""
echo "[2/5] Creating lists..."

LIST_COUNT=$(jq '.lists | length' "$CONFIG_FILE")

for i in $(seq 0 $((LIST_COUNT - 1))); do
    LIST_NAME=$(jq -r ".lists[$i].name" "$CONFIG_FILE")
    LIST_POS=$(jq -r ".lists[$i].pos" "$CONFIG_FILE")

    LIST_RESPONSE=$(trello_api POST "${TRELLO_BASE}/boards/${BOARD_ID}/lists?${AUTH}" \
        -d "name=${LIST_NAME}" \
        -d "pos=${LIST_POS}")

    LIST_ID=$(echo "$LIST_RESPONSE" | jq -r '.id')
    echo "  Created: $LIST_NAME -> $LIST_ID"
    api_delay
done

# Fetch all lists and map IDs to env vars by name
ALL_LISTS=$(trello_api GET "${TRELLO_BASE}/boards/${BOARD_ID}/lists?${AUTH}")
api_delay

update_env "TRELLO_LIST_REFERENCE_ID" "$(echo "$ALL_LISTS" | jq -r '.[] | select(.name | contains("Reference")) | .id')"
update_env "TRELLO_LIST_THIS_WEEK_ID" "$(echo "$ALL_LISTS" | jq -r '.[] | select(.name | contains("This Week")) | .id')"
update_env "TRELLO_LIST_TODAY_ID" "$(echo "$ALL_LISTS" | jq -r '.[] | select(.name | contains("Today")) | .id')"
update_env "TRELLO_LIST_DOING_ID" "$(echo "$ALL_LISTS" | jq -r '.[] | select(.name | contains("Doing")) | .id')"
update_env "TRELLO_LIST_DONE_ID" "$(echo "$ALL_LISTS" | jq -r '.[] | select(.name | contains("Done")) | .id')"

# --- Step 3: Clear default labels and create custom ones ---
echo ""
echo "[3/5] Setting up labels..."

# Fetch existing labels (Trello creates 6 unnamed ones by default)
EXISTING_LABELS=$(trello_api GET "${TRELLO_BASE}/boards/${BOARD_ID}/labels?${AUTH}")
api_delay

# Delete all default labels
echo "$EXISTING_LABELS" | jq -r '.[].id' | while read -r label_id; do
    trello_api DELETE "${TRELLO_BASE}/labels/${label_id}?${AUTH}" >/dev/null 2>&1 || true
    api_delay
done

# Create custom labels
LABEL_COUNT=$(jq '.labels | length' "$CONFIG_FILE")

for i in $(seq 0 $((LABEL_COUNT - 1))); do
    LABEL_NAME=$(jq -r ".labels[$i].name" "$CONFIG_FILE")
    LABEL_COLOR=$(jq -r ".labels[$i].color" "$CONFIG_FILE")

    LABEL_RESPONSE=$(trello_api POST "${TRELLO_BASE}/boards/${BOARD_ID}/labels?${AUTH}" \
        -d "name=${LABEL_NAME}" \
        -d "color=${LABEL_COLOR}")

    LABEL_ID=$(echo "$LABEL_RESPONSE" | jq -r '.id')
    echo "  Created: $LABEL_NAME ($LABEL_COLOR) -> $LABEL_ID"
    api_delay
done

# Map label IDs to env vars by re-fetching (cleaner than tracking order)
ALL_LABELS=$(trello_api GET "${TRELLO_BASE}/boards/${BOARD_ID}/labels?${AUTH}")
api_delay

update_env "TRELLO_LABEL_HIGH_ENERGY_ID" "$(echo "$ALL_LABELS" | jq -r '.[] | select(.color == "red") | .id')"
update_env "TRELLO_LABEL_MEDIUM_ENERGY_ID" "$(echo "$ALL_LABELS" | jq -r '.[] | select(.color == "orange") | .id')"
update_env "TRELLO_LABEL_LOW_ENERGY_ID" "$(echo "$ALL_LABELS" | jq -r '.[] | select(.color == "green") | .id')"
update_env "TRELLO_LABEL_BRAIN_DEAD_ID" "$(echo "$ALL_LABELS" | jq -r '.[] | select(.color == "purple") | .id')"
update_env "TRELLO_LABEL_DUE_SOON_ID" "$(echo "$ALL_LABELS" | jq -r '.[] | select(.color == "yellow") | .id')"

# --- Step 4: Create Custom Fields ---
echo ""
echo "[4/5] Creating custom fields..."

FIELD_COUNT=$(jq '.customFields | length' "$CONFIG_FILE")

for i in $(seq 0 $((FIELD_COUNT - 1))); do
    FIELD_NAME=$(jq -r ".customFields[$i].name" "$CONFIG_FILE")
    FIELD_TYPE=$(jq -r ".customFields[$i].type" "$CONFIG_FILE")

    if [[ "$FIELD_TYPE" == "list" ]]; then
        # Build options array
        OPTIONS=$(jq -c "[.customFields[$i].options[] as \$opt | {\"color\": \"none\", \"value\": {\"text\": \$opt}, \"pos\": 0}]" "$CONFIG_FILE" | \
            jq '[to_entries[] | .value.pos = ((.key + 1) * 1024) | .value]')

        FIELD_RESPONSE=$(trello_api POST "${TRELLO_BASE}/customFields?${AUTH}" \
            -H "Content-Type: application/json" \
            -d "{
                \"idModel\": \"${BOARD_ID}\",
                \"modelType\": \"board\",
                \"name\": \"${FIELD_NAME}\",
                \"type\": \"list\",
                \"pos\": \"bottom\",
                \"options\": ${OPTIONS}
            }")
    else
        # Checkbox type
        FIELD_RESPONSE=$(trello_api POST "${TRELLO_BASE}/customFields?${AUTH}" \
            -H "Content-Type: application/json" \
            -d "{
                \"idModel\": \"${BOARD_ID}\",
                \"modelType\": \"board\",
                \"name\": \"${FIELD_NAME}\",
                \"type\": \"checkbox\",
                \"pos\": \"bottom\"
            }")
    fi

    FIELD_ID=$(echo "$FIELD_RESPONSE" | jq -r '.id')
    echo "  Created: $FIELD_NAME ($FIELD_TYPE) -> $FIELD_ID"
    api_delay
done

# --- Step 5: Summary ---
echo ""
echo "[5/5] Board setup complete!"
echo ""
echo "=========================================="
echo "  Board: $BOARD_NAME"
echo "  ID:    $BOARD_ID"
echo "  URL:   https://trello.com/b/$BOARD_ID"
echo "=========================================="
echo ""
echo "All IDs have been written to .env"
echo ""
echo "Next steps:"
echo "  1. Run ./trello/create-reference-cards.sh to create template cards"
echo "  2. Follow ./trello/butler-rules-manual.md to set up Butler automations"
echo "  3. Enable Power-Ups: Calendar, List Limits, Card Repeater, Card Aging"
