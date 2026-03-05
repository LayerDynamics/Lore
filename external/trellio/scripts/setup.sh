#!/usr/bin/env bash
# ============================================
# Master Setup Script - ADHD Trello System
# ============================================
# Orchestrates the complete system setup:
#   1. Check prerequisites
#   2. Create Trello board
#   3. Create reference cards
#   4. Generate Claude Desktop config
#   5. Start n8n
#   6. Guide through manual steps
#
# Usage: ./scripts/setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[DONE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=========================================="
echo "  ADHD Trello Productivity System Setup"
echo "=========================================="
echo ""

# --- Step 1: Check prerequisites ---
info "Checking prerequisites..."

MISSING=()
for cmd in curl jq docker node; do
    if ! command -v "$cmd" &>/dev/null; then
        MISSING+=("$cmd")
    fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    error "Missing required tools: ${MISSING[*]}"
    echo ""
    echo "Install them:"
    echo "  curl/jq: Should be pre-installed on macOS"
    echo "  docker:  https://docs.docker.com/desktop/install/mac-install/"
    echo "  node:    https://nodejs.org (LTS version)"
    exit 1
fi

# Check docker compose
if ! docker compose version &>/dev/null 2>&1; then
    error "Docker Compose is required. Install Docker Desktop which includes it."
    exit 1
fi

success "All prerequisites found"

# --- Step 2: Check .env ---
if [[ ! -f "$ENV_FILE" ]]; then
    warn ".env not found. Creating from template..."
    cp "${PROJECT_DIR}/.env.example" "$ENV_FILE"
    echo ""
    error "Please edit .env with your API credentials before continuing."
    echo ""
    echo "Required credentials:"
    echo "  - TRELLO_API_KEY and TRELLO_TOKEN (from https://trello.com/power-ups/admin)"
    echo "  - TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (from https://console.twilio.com)"
    echo "  - TWILIO_PHONE_NUMBER and MY_PHONE_NUMBER"
    echo "  - ANTHROPIC_API_KEY (from https://console.anthropic.com/settings/keys)"
    echo "  - POSTGRES_PASSWORD (generate a strong password)"
    echo "  - N8N_ENCRYPTION_KEY (run: openssl rand -hex 32)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

source "$ENV_FILE"

# Validate required env vars
REQUIRED_VARS=(TRELLO_API_KEY TRELLO_TOKEN ANTHROPIC_API_KEY POSTGRES_PASSWORD)
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    error "Missing required .env values: ${MISSING_VARS[*]}"
    echo "Edit .env and fill in these values, then run again."
    exit 1
fi

success ".env validated"

# Generate encryption key if missing
if [[ -z "${N8N_ENCRYPTION_KEY:-}" ]]; then
    info "Generating N8N_ENCRYPTION_KEY..."
    NEW_KEY=$(openssl rand -hex 32)
    if grep -q "^N8N_ENCRYPTION_KEY=" "$ENV_FILE" 2>/dev/null; then
        sed -i '' "s|^N8N_ENCRYPTION_KEY=.*|N8N_ENCRYPTION_KEY=${NEW_KEY}|" "$ENV_FILE"
    else
        echo "N8N_ENCRYPTION_KEY=${NEW_KEY}" >> "$ENV_FILE"
    fi
    source "$ENV_FILE"
    success "Encryption key generated"
fi

# --- Step 3: Create Trello board ---
echo ""
info "Creating Trello board..."
bash "${PROJECT_DIR}/trello/create-board.sh"
source "$ENV_FILE"  # Reload to get new IDs
success "Trello board created"

# --- Step 4: Create reference cards ---
echo ""
info "Creating reference cards..."
bash "${PROJECT_DIR}/trello/create-reference-cards.sh"
source "$ENV_FILE"
success "Reference cards created"

# --- Step 5: Generate Claude Desktop config ---
echo ""
info "Generating Claude Desktop config..."

CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="${CLAUDE_CONFIG_DIR}/claude_desktop_config.json"

if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
    warn "Claude Desktop config already exists at:"
    echo "  $CLAUDE_CONFIG_FILE"
    echo ""
    echo "Your MCP server config template is at:"
    echo "  ${PROJECT_DIR}/claude/claude-desktop-config.json"
    echo ""
    echo "Merge the mcpServers entries manually if needed."
else
    mkdir -p "$CLAUDE_CONFIG_DIR"
    # Generate config with actual values from .env
    cat > "$CLAUDE_CONFIG_FILE" << CEOF
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "${TRELLO_API_KEY}",
        "TRELLO_TOKEN": "${TRELLO_TOKEN}",
        "TRELLO_BOARD_ID": "${TRELLO_BOARD_ID}"
      }
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@nspady/google-calendar-mcp"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "${GOOGLE_OAUTH_CREDENTIALS_PATH:-REPLACE_WITH_PATH}"
      }
    }
  }
}
CEOF
    success "Claude Desktop config written to $CLAUDE_CONFIG_FILE"
    warn "Restart Claude Desktop for MCP servers to load"
fi

# --- Step 6: Start n8n ---
echo ""
info "Starting n8n..."

# Copy .env to n8n directory so docker compose can find it
cp "$ENV_FILE" "${PROJECT_DIR}/n8n/.env"

cd "${PROJECT_DIR}/n8n"
docker compose up -d
cd "$PROJECT_DIR"

# Wait for n8n to be healthy
info "Waiting for n8n to start..."
MAX_WAIT=60
WAITED=0
while [[ $WAITED -lt $MAX_WAIT ]]; do
    if curl -s "http://localhost:${N8N_PORT:-5678}/healthz" &>/dev/null; then
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [[ $WAITED -ge $MAX_WAIT ]]; then
    warn "n8n didn't respond within ${MAX_WAIT}s. It may still be starting."
    echo "Check status: docker compose -f n8n/docker-compose.yml ps"
else
    success "n8n is running at http://localhost:${N8N_PORT:-5678}"
fi

# --- Step 7: Manual steps reminder ---
echo ""
echo "=========================================="
echo "  SETUP COMPLETE - Manual Steps Remaining"
echo "=========================================="
echo ""
echo "1. TRELLO POWER-UPS & BUTLER RULES:"
echo "   Follow: trello/butler-rules-manual.md"
echo "   Enable Power-Ups: Calendar, List Limits, Card Repeater, Card Aging"
echo ""
echo "2. N8N FIRST-TIME SETUP:"
echo "   Open http://localhost:${N8N_PORT:-5678}"
echo "   Create your admin account"
echo "   Add credentials (Trello, Twilio, Google Calendar, Gmail)"
echo "   Import workflows from n8n/workflows/*.json"
echo "   Assign credentials to each workflow's nodes"
echo "   Set n8n environment variables (see MANUAL_STEPS.md)"
echo ""
echo "3. CLAUDE DESKTOP:"
echo "   Restart Claude Desktop to load MCP servers"
echo "   Create ADHD Coach project (see claude/adhd-coach-system-prompt.md)"
echo ""
echo "4. VERIFY:"
echo "   Run: ./scripts/verify-setup.sh"
echo ""
echo "See MANUAL_STEPS.md for the complete checklist."
echo ""
echo "Your board is live at: https://trello.com/b/${TRELLO_BOARD_ID}"
