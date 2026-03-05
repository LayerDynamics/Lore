# DefTrello MCP Global Access Fix - Summary

**Date:** 2026-02-16
**Status:** ✅ COMPLETE

## Problem

DefTrello MCP server only worked when Claude Code was run from the `/Users/ryanoboyle/deftrello` directory. It failed to work from other project directories (pew.news, defcad, etc.).

## Root Cause

1. **Configuration conflicts:** Multiple MCP configurations with DIFFERENT Trello board IDs:
   - Global config (`~/.claude.json`): Board `6990b65be83d956ca32f0d1d`
   - Project config (`/Users/ryanoboyle/deftrello/.mcp.json`): Board `6991a7d595883f5d05fbb90d`

2. **Missing mcp-cron argument:** Global mcp-cron config was missing `-mcp-config-path` argument, preventing it from finding deftrello server configuration.

3. **Unused config file:** `~/.mcp.json` existed but was not used by Claude Code, causing confusion.

## Solution Implemented

### 1. Updated Global Config (`~/.claude.json`)

**Board and List IDs Updated:**
- Board ID: `6991a7d595883f5d05fbb90d` (DefCad 3.0 Development Stages)
- List IDs: Updated to match the new board
- Label IDs: Updated to match the new board

**mcp-cron Fixed:**
Added missing arguments:
```json
{
  "args": [
    "-y",
    "mcp-cron",
    "-transport",
    "stdio",
    "-db-path",
    "/Users/ryanoboyle/.claude/mcp-cron/tasks.db",
    "-mcp-config-path",
    "/Users/ryanoboyle/.claude.json",
    "-ai-provider",
    "anthropic",
    "-ai-model",
    "claude-sonnet-4.5"
  ]
}
```

### 2. Disabled Project Config

Updated `~/.claude.json` project settings for `/Users/ryanoboyle/deftrello`:
```json
"disabledMcpjsonServers": ["deftrello", "mcp-cron"]
```

This prevents the project `.mcp.json` from loading when in the deftrello directory, eliminating configuration conflicts.

### 3. Removed Unused Config

Deleted `~/.mcp.json` (not used by Claude Code)

### 4. Updated Documentation

Updated `/Users/ryanoboyle/deftrello/docs/GLOBAL-MCP-SETUP.md` to reflect:
- Correct board ID (`6991a7d595883f5d05fbb90d`)
- Correct config file location (`~/.claude.json` not `~/.claude/mcp.json`)
- Note that project `.mcp.json` is disabled

## Files Modified

1. `~/.claude.json` - Global MCP server configuration
   - Lines 910-920: Updated deftrello board/list/label IDs
   - Lines 926-945: Fixed mcp-cron args and env
   - Line 194: Disabled project .mcp.json loading

2. `~/.mcp.json` - Deleted (unused)

3. `/Users/ryanoboyle/deftrello/docs/GLOBAL-MCP-SETUP.md` - Updated documentation

## Verification Steps

To verify the fix works:

### Test 1: From deftrello directory
```bash
cd /Users/ryanoboyle/deftrello
claude
# In Claude: "Get board snapshot"
# Expected: Shows DefCad 3.0 board
```

### Test 2: From different directory
```bash
cd /Users/ryanoboyle/pew.news
claude
# In Claude: "Get board snapshot"
# Expected: Shows SAME DefCad 3.0 board
```

### Test 3: mcp-cron access
```bash
cd /tmp
claude
# In Claude: "List scheduled tasks"
# Expected: Can access both deftrello and mcp-cron tools
```

## Expected Outcome

After this fix:
- ✅ DefTrello MCP server works from ANY project directory
- ✅ mcp-cron can access deftrello tools from ANY directory
- ✅ Consistent Trello board access (DefCad 3.0 Development Stages)
- ✅ No configuration conflicts between global and project configs
- ✅ Single source of truth in `~/.claude.json`

## Backup

A backup of the original config was created at: `~/.claude.json.backup`

To restore if needed:
```bash
cp ~/.claude.json.backup ~/.claude.json
```

## Next Steps

1. Test the configuration from multiple directories
2. If working correctly, delete the backup: `rm ~/.claude.json.backup`
3. Update other documentation if needed
4. Consider creating a setup script for team members

## Notes

- The deftrello MCP server requires `PROJECT_DIR` environment variable (already configured)
- All file/git operations are rooted in `PROJECT_DIR`, not current working directory
- The server can run from any directory as long as `PROJECT_DIR` is set correctly
