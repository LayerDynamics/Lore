#!/bin/bash
# Setup DefTrello environment variables

set -euo pipefail

echo "DefTrello Environment Setup"
echo ""

# Detect shell
SHELL_RC="$HOME/.zshrc"
if [[ "$SHELL" == *"bash"* ]]; then
  SHELL_RC="$HOME/.bashrc"
fi

echo "Adding environment variables to $SHELL_RC"
echo ""

# Create backup
cp "$SHELL_RC" "${SHELL_RC}.backup-$(date +%Y%m%d-%H%M%S)"
echo "Created backup of $SHELL_RC"

# Add DefTrello section
cat >> "$SHELL_RC" << 'EOF'

# === DefTrello Configuration ===
# Added by DefTrello plugin setup
# Replace placeholder values with your actual credentials

# Trello API Credentials
# Get these from https://trello.com/power-ups/admin
export TRELLO_API_KEY="your-trello-api-key"
export TRELLO_TOKEN="your-trello-token"

# Trello Board Configuration
# Get board/list/label IDs from the Trello API or board URL
export TRELLO_BOARD_ID="your-board-id"
export TRELLO_LIST_REFERENCE_ID="your-reference-list-id"
export TRELLO_LIST_THIS_WEEK_ID="your-this-week-list-id"
export TRELLO_LIST_TODAY_ID="your-today-list-id"
export TRELLO_LIST_DOING_ID="your-doing-list-id"
export TRELLO_LIST_DONE_ID="your-done-list-id"

# Trello Labels
export TRELLO_LABEL_HIGH_PRIORITY_ID="your-high-priority-label-id"
export TRELLO_LABEL_MEDIUM_PRIORITY_ID="your-medium-priority-label-id"
export TRELLO_LABEL_LOW_PRIORITY_ID="your-low-priority-label-id"
export TRELLO_LABEL_SIMPLE_TASKS_ID="your-simple-tasks-label-id"
export TRELLO_LABEL_DUE_SOON_ID="your-due-soon-label-id"

# n8n Integration (optional)
export N8N_BASE_URL="https://your-n8n-instance.example.com"
export N8N_API_KEY="your-n8n-api-key"

# Project Directory
export PROJECT_DIR="/path/to/your/deftrello"

# === End DefTrello Configuration ===
EOF

echo "Added DefTrello environment variables"
echo ""
echo "IMPORTANT: Edit $SHELL_RC and replace placeholder values with your actual credentials."
echo ""
echo "To activate immediately, run:"
echo "   source $SHELL_RC"
echo ""
echo "Or open a new terminal window."
echo ""
echo "Setup complete!"
