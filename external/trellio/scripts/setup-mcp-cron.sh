#!/bin/bash
# Setup and test mcp-cron integration with DefTrello

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DefTrello MCP-Cron Setup ===${NC}\n"

# Step 1: Verify mcp-cron is accessible
echo -e "${YELLOW}Step 1: Verifying mcp-cron installation...${NC}"
if npx -y mcp-cron --version > /dev/null 2>&1; then
    VERSION=$(npx -y mcp-cron --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    echo -e "${GREEN}✓ mcp-cron is installed (version $VERSION)${NC}\n"
else
    echo -e "${RED}✗ mcp-cron not accessible${NC}"
    exit 1
fi

# Step 2: Check MCP configuration
echo -e "${YELLOW}Step 2: Checking MCP configuration...${NC}"
if [ -f "$PROJECT_DIR/.mcp.json" ]; then
    if grep -q "mcp-cron" "$PROJECT_DIR/.mcp.json"; then
        echo -e "${GREEN}✓ mcp-cron is configured in .mcp.json${NC}\n"
    else
        echo -e "${RED}✗ mcp-cron not found in .mcp.json${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ .mcp.json not found${NC}"
    exit 1
fi

# Step 3: Create mcp-cron database directory
echo -e "${YELLOW}Step 3: Creating database directory...${NC}"
mkdir -p "$PROJECT_DIR/.mcp-cron"
echo -e "${GREEN}✓ Database directory created at .mcp-cron/${NC}\n"

# Step 4: Verify directory structure
echo -e "${YELLOW}Step 4: Verifying directory structure...${NC}"
if [ -d "$PROJECT_DIR/.mcp-cron" ]; then
    echo -e "${GREEN}✓ .mcp-cron/ directory exists${NC}"
else
    echo -e "${RED}✗ .mcp-cron/ directory missing${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Restart Claude Code to load the new MCP server"
echo "2. Verify mcp-cron is loaded:"
echo "   Ask Claude: 'List all available MCP servers'"
echo ""
echo "3. Create your first scheduled task:"
echo "   Ask Claude: 'Create a task that runs my morning planning every day at 9am'"
echo ""
echo "4. Test the integration:"
echo "   Ask Claude: 'List all scheduled tasks'"
echo ""
echo -e "${GREEN}Setup script completed successfully!${NC}"
