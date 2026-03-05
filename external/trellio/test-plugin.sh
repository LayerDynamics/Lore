#!/bin/bash
set -euo pipefail

# DefTrello Plugin Test Script
# Tests plugin structure, components, and availability

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Test result function
check_test() {
    local test_name="$1"
    local test_result="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$test_result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DefTrello Plugin Test Suite           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Plugin directory:${NC} $PLUGIN_DIR"
echo ""

# Test 1: Plugin Structure
echo -e "${YELLOW}[1/7] Testing Plugin Structure...${NC}"
if [ -f "$PLUGIN_DIR/.claude-plugin/plugin.json" ]; then
    check_test "Plugin manifest exists" "pass"
else
    check_test "Plugin manifest exists" "fail"
fi

if [ -d "$PLUGIN_DIR/commands" ]; then
    check_test "Commands directory exists" "pass"
else
    check_test "Commands directory exists" "fail"
fi

if [ -d "$PLUGIN_DIR/agents" ]; then
    check_test "Agents directory exists" "pass"
else
    check_test "Agents directory exists" "fail"
fi

if [ -d "$PLUGIN_DIR/skills" ]; then
    check_test "Skills directory exists" "pass"
else
    check_test "Skills directory exists" "fail"
fi

if [ -f "$PLUGIN_DIR/hooks/hooks.json" ]; then
    check_test "Hooks configuration exists" "pass"
else
    check_test "Hooks configuration exists" "fail"
fi

echo ""

# Test 2: Component Counts
echo -e "${YELLOW}[2/7] Counting Components...${NC}"

COMMAND_COUNT=$(find "$PLUGIN_DIR/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMAND_COUNT" -ge 8 ]; then
    check_test "Commands: $COMMAND_COUNT found (expected 8)" "pass"
else
    check_test "Commands: $COMMAND_COUNT found (expected 8)" "fail"
fi

AGENT_COUNT=$(find "$PLUGIN_DIR/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENT_COUNT" -ge 4 ]; then
    check_test "Agents: $AGENT_COUNT found (expected 4)" "pass"
else
    check_test "Agents: $AGENT_COUNT found (expected 4)" "fail"
fi

SKILL_COUNT=$(find "$PLUGIN_DIR/skills" -name "SKILL.md" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$SKILL_COUNT" -ge 4 ]; then
    check_test "Skills: $SKILL_COUNT found (expected 4+)" "pass"
else
    check_test "Skills: $SKILL_COUNT found (expected 4+)" "fail"
fi

echo ""

# Test 3: Manifest Validation
echo -e "${YELLOW}[3/7] Validating Manifest...${NC}"

if command -v jq &> /dev/null; then
    if jq empty "$PLUGIN_DIR/.claude-plugin/plugin.json" 2>/dev/null; then
        check_test "Manifest is valid JSON" "pass"

        PLUGIN_NAME=$(jq -r '.name' "$PLUGIN_DIR/.claude-plugin/plugin.json" 2>/dev/null)
        if [ "$PLUGIN_NAME" = "deftrello" ]; then
            check_test "Plugin name is 'deftrello'" "pass"
        else
            check_test "Plugin name is 'deftrello' (found: $PLUGIN_NAME)" "fail"
        fi

        VERSION=$(jq -r '.version' "$PLUGIN_DIR/.claude-plugin/plugin.json" 2>/dev/null)
        check_test "Version: $VERSION" "pass"
    else
        check_test "Manifest is valid JSON" "fail"
    fi
else
    echo -e "${YELLOW}⚠${NC} jq not installed, skipping JSON validation"
fi

echo ""

# Test 4: MCP Configuration
echo -e "${YELLOW}[4/7] Checking MCP Configuration...${NC}"

if [ -f "$PLUGIN_DIR/.mcp.json" ]; then
    check_test "MCP config file exists" "pass"

    if command -v jq &> /dev/null; then
        if jq empty "$PLUGIN_DIR/.mcp.json" 2>/dev/null; then
            check_test "MCP config is valid JSON" "pass"

            # Check for hardcoded credentials (security issue)
            if grep -q "0dc5c20c\|ATTA\|eyJhbGci" "$PLUGIN_DIR/.mcp.json" 2>/dev/null; then
                check_test "No hardcoded credentials" "fail"
            else
                check_test "No hardcoded credentials" "pass"
            fi
        else
            check_test "MCP config is valid JSON" "fail"
        fi
    fi
else
    check_test "MCP config file exists" "fail"
fi

echo ""

# Test 5: Component Frontmatter
echo -e "${YELLOW}[5/7] Validating Component Frontmatter...${NC}"

COMMANDS_WITH_FRONTMATTER=0
for cmd in "$PLUGIN_DIR/commands"/*.md; do
    if [ -f "$cmd" ]; then
        if grep -q "^---$" "$cmd" && grep -q "^name:" "$cmd"; then
            COMMANDS_WITH_FRONTMATTER=$((COMMANDS_WITH_FRONTMATTER + 1))
        fi
    fi
done

if [ "$COMMANDS_WITH_FRONTMATTER" -eq "$COMMAND_COUNT" ]; then
    check_test "All commands have valid frontmatter" "pass"
else
    check_test "All commands have valid frontmatter ($COMMANDS_WITH_FRONTMATTER/$COMMAND_COUNT)" "fail"
fi

AGENTS_WITH_FRONTMATTER=0
for agent in "$PLUGIN_DIR/agents"/*.md; do
    if [ -f "$agent" ]; then
        if grep -q "^---$" "$agent" && grep -q "^description:" "$agent"; then
            AGENTS_WITH_FRONTMATTER=$((AGENTS_WITH_FRONTMATTER + 1))
        fi
    fi
done

if [ "$AGENTS_WITH_FRONTMATTER" -eq "$AGENT_COUNT" ]; then
    check_test "All agents have valid frontmatter" "pass"
else
    check_test "All agents have valid frontmatter ($AGENTS_WITH_FRONTMATTER/$AGENT_COUNT)" "fail"
fi

echo ""

# Test 6: Settings Template
echo -e "${YELLOW}[6/7] Checking Configuration Templates...${NC}"

if [ -f "$PLUGIN_DIR/.claude/deftrello.local.md.example" ]; then
    check_test "Settings template exists" "pass"
else
    check_test "Settings template exists" "fail"
fi

if [ -f "$PLUGIN_DIR/.gitignore" ]; then
    if grep -q "deftrello.local.md" "$PLUGIN_DIR/.gitignore"; then
        check_test ".gitignore excludes local settings" "pass"
    else
        check_test ".gitignore excludes local settings" "fail"
    fi
fi

echo ""

# Test 7: Claude Code Availability
echo -e "${YELLOW}[7/7] Testing Claude Code Integration...${NC}"

if command -v cc &> /dev/null; then
    check_test "Claude Code CLI available (cc)" "pass"

    echo -e "${BLUE}Testing plugin loading...${NC}"

    # Try to load plugin and check for errors
    if timeout 5s cc --plugin-dir "$PLUGIN_DIR" --help &> /dev/null; then
        check_test "Plugin loads without errors" "pass"
    else
        check_test "Plugin loads without errors" "fail"
    fi
else
    check_test "Claude Code CLI available (cc)" "fail"
    echo -e "${YELLOW}⚠${NC} Install Claude Code CLI to test plugin loading"
fi

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total tests:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:${NC}       $PASSED_CHECKS"
echo -e "${RED}Failed:${NC}       $FAILED_CHECKS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Plugin is ready to use.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Test the plugin:"
    echo "     cc --plugin-dir $PLUGIN_DIR"
    echo ""
    echo "  2. Try a command:"
    echo "     /deftrello:board-list"
    echo ""
    echo "  3. Install globally (optional):"
    echo "     ln -s $PLUGIN_DIR ~/.claude/plugins/deftrello"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review errors above.${NC}"
    echo ""
    exit 1
fi
