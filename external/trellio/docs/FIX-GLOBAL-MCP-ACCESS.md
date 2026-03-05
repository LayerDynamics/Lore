# Fix: Make MCP Servers Available Globally

## 🔍 Problem

DefTrello and mcp-cron were configured in `.mcp.json` files but only worked in specific directories, not globally.

## 📚 Research Findings

From the [official Claude Code documentation](https://code.claude.com/docs/en/mcp#mcp-installation-scopes), Claude Code has **3 MCP configuration scopes**:

### Scope Comparison

| Scope | Config Location | When Available | Use Case |
|-------|----------------|----------------|----------|
| **Local** | `~/.claude.json` (under project path) | Only in that project | Personal, project-specific servers |
| **Project** | `.mcp.json` (project root) | Team members in that project | Team-shared, version-controlled |
| **User** | `~/.claude.json` (global) | **ALL projects on your machine** ✅ | Personal tools used everywhere |

### The Solution

Use `--scope user` when adding MCP servers to make them available everywhere!

---

## ✅ Fix Steps

### Step 1: Exit this Claude Code session

Exit the current session (you can't run `claude mcp` from within Claude Code).

### Step 2: Run the setup script

```bash
cd /Users/ryanoboyle/deftrello
./scripts/setup-global-mcp.sh
```

This script will:
1. Add DefTrello with `--scope user`
2. Add mcp-cron with `--scope user`
3. Both will be stored in `~/.claude.json` (global config)

### Step 3: Test from any directory

```bash
cd ~/defcad_dash  # or ANY directory
claude
```

Then ask:
```
"List my Trello board snapshot"
"List all scheduled tasks"
```

Both should work! 🎉

---

## 🔧 Manual Alternative

If you prefer to add them manually:

### Add DefTrello (user scope)

```bash
claude mcp add --scope user --transport stdio deftrello \\
  -- /Users/ryanoboyle/.asdf/shims/node \\
     /Users/ryanoboyle/deftrello/mcp-server/dist/index.js
```

### Add mcp-cron (user scope)

```bash
claude mcp add --scope user --transport stdio mcp-cron \\
  -- npx -y mcp-cron -transport stdio \\
     -db-path /Users/ryanoboyle/.claude/mcp-cron/tasks.db
```

---

## 📝 Configuration File Locations

After setup, your configuration will be:

```
~/.claude.json  (GLOBAL - all projects)
├── deftrello
└── mcp-cron

~/deftrello/.mcp.json  (PROJECT - only deftrello)
[can be removed or kept for local overrides]

~/.mcp.json  (HOME - not used by Claude Code)
[can be removed]
```

---

## 🎯 What This Fixes

**Before:**
- DefTrello only worked in deftrello directory ❌
- mcp-cron only worked in deftrello directory ❌
- Had to configure each project separately ❌

**After:**
- DefTrello works in ALL directories ✅
- mcp-cron works in ALL directories ✅
- Single configuration, global access ✅

---

## 🧪 Verification

After running the script, verify it worked:

```bash
# From ANY directory
cd ~
claude mcp list
```

You should see:
```
deftrello (user scope)
mcp-cron (user scope)
```

---

## 🔗 Resources

- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [MCP Installation Scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)
- [Official MCP Protocol](https://modelcontextprotocol.io/introduction)

---

## 🚀 Next Steps

Once global access is working:
1. Remove project-specific `.mcp.json` files (optional)
2. Configure scheduled tasks via mcp-cron
3. Use DefTrello from any project directory
4. Share the setup script with team members (they'll need their own Trello credentials)
