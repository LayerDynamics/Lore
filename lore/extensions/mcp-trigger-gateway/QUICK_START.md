# Quick Start Guide - MCP Trigger Gateway

## What You've Built

An MCP server that runs as a background service/daemon and provides trigger-based automation capabilities:

- **Cron Triggers** - Schedule recurring tasks
- **Event Triggers** - React to custom events
- **Webhook Triggers** - HTTP endpoints (coming soon)
- **File Watch Triggers** - Monitor filesystem (coming soon)
- **Manual Triggers** - On-demand execution

Each trigger can execute:
- **MCP calls** to other MCP servers
- **HTTP requests** to REST APIs
- **Shell commands**
- **Trigger chains** to execute multiple triggers

## Installation & Setup

### 1. Install Dependencies & Build

```bash
npm install
npm run build
```

### 2. Test the Server

Test the MCP server works:

```bash
# Run the server (it will start and wait for input on stdin)
node dist/index.js
```

The server should start without errors. Press Ctrl+C to stop.

### 3. Install as System Service

#### macOS

```bash
./service/install.sh
```

Or manually:

```bash
# Edit the plist file
vim service/com.mcp.trigger-gateway.plist
# Update YOUR_USERNAME to your actual username

# Copy to LaunchAgents
cp service/com.mcp.trigger-gateway.plist ~/Library/LaunchAgents/

# Load and start
launchctl load ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist
launchctl start com.mcp.trigger-gateway

# Check it's running
launchctl list | grep mcp-trigger-gateway
```

#### Linux

```bash
./service/install.sh
```

Or manually:

```bash
# Edit service file
sudo vim service/mcp-trigger-gateway.service
# Update paths

# Install
sudo cp service/mcp-trigger-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mcp-trigger-gateway
sudo systemctl start mcp-trigger-gateway

# Check status
sudo systemctl status mcp-trigger-gateway
```

### 4. Configure MCP Client

Add to your Claude Desktop or MCP client config:

**~/.config/claude-desktop/config.json** (Linux):
```json
{
  "mcpServers": {
    "trigger-gateway": {
      "command": "node",
      "args": ["/path/to/mcp-trigger-gateway/dist/index.js"]
    }
  }
}
```

**~/Library/Application Support/Claude/claude_desktop_config.json** (macOS):
```json
{
  "mcpServers": {
    "trigger-gateway": {
      "command": "node",
      "args": ["/Users/yourusername/mcp-trigger-gateway/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop to load the server.

## Usage Examples

### Example 1: Create a Daily Backup Trigger

```javascript
// Use the create_trigger tool
{
  "name": "Daily Backup",
  "description": "Backup database every day at 2 AM",
  "type": "cron",
  "config": {
    "type": "cron",
    "schedule": "0 2 * * *"
  },
  "actions": [
    {
      "type": "shell",
      "command": "pg_dump mydb -f /backups/daily.sql"
    }
  ]
}
```

### Example 2: Event-Based Notification

```javascript
{
  "name": "Deployment Alert",
  "type": "event",
  "config": {
    "type": "event",
    "eventName": "deployment.complete",
    "filter": {
      "environment": "production"
    }
  },
  "actions": [
    {
      "type": "http",
      "url": "https://slack.com/api/chat.postMessage",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      },
      "body": {
        "channel": "#deployments",
        "text": "Deployment complete!"
      }
    }
  ]
}
```

### Example 3: Fire an Event

```javascript
// Use fire_event tool to trigger event-based triggers
{
  "eventName": "deployment.complete",
  "payload": {
    "environment": "production",
    "version": "1.2.3"
  }
}
```

### Example 4: Chain MCP Servers

```javascript
{
  "name": "Data Pipeline",
  "type": "manual",
  "config": {
    "type": "manual"
  },
  "actions": [
    {
      "type": "mcp_call",
      "server": "database-tools",
      "tool": "export_data",
      "arguments": {
        "table": "users"
      }
    },
    {
      "type": "mcp_call",
      "server": "cloud-storage",
      "tool": "upload_file",
      "arguments": {
        "file": "/tmp/export.csv"
      }
    }
  ]
}
```

## Managing the Service

### macOS

```bash
# Start
launchctl start com.mcp.trigger-gateway

# Stop
launchctl stop com.mcp.trigger-gateway

# View logs
tail -f ~/.mcp-trigger-gateway/logs/stderr.log

# Unload
launchctl unload ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist
```

### Linux

```bash
# Start
sudo systemctl start mcp-trigger-gateway

# Stop
sudo systemctl stop mcp-trigger-gateway

# Restart
sudo systemctl restart mcp-trigger-gateway

# View logs
journalctl -u mcp-trigger-gateway -f

# Disable
sudo systemctl disable mcp-trigger-gateway
```

## Available MCP Tools

Once running, these tools are available to MCP clients:

1. **create_trigger** - Create a new trigger
2. **list_triggers** - List all triggers (with optional filtering)
3. **get_trigger** - Get details of a specific trigger
4. **update_trigger** - Update trigger configuration or status
5. **delete_trigger** - Delete a trigger
6. **fire_event** - Manually fire an event
7. **execute_trigger** - Manually execute a trigger

## Data Storage

Trigger configurations are stored in:
```
~/.mcp-trigger-gateway/triggers.json
```

This file is automatically created and persisted.

## Logging

Set the log level with environment variable:

```bash
export LOG_LEVEL=DEBUG  # DEBUG, INFO, WARN, ERROR
```

Logs are written to:
- **macOS**: `~/.mcp-trigger-gateway/logs/stderr.log`
- **Linux**: System journal (view with `journalctl`)

## Next Steps

1. **Add Webhook Server** - HTTP server to receive webhook triggers
2. **Add File Watcher** - Monitor filesystem changes
3. **Implement MCP Client Calls** - Actually call other MCP servers
4. **Add Better Cron Parsing** - Use node-cron or similar
5. **Add Execution History** - Track trigger execution results
6. **Add Retry Logic** - Handle failed actions gracefully
7. **Add Rate Limiting** - Prevent trigger spam

## Troubleshooting

### Server won't start

Check logs:
```bash
# macOS
cat ~/.mcp-trigger-gateway/logs/stderr.log

# Linux
journalctl -u mcp-trigger-gateway -n 50
```

### Triggers not executing

1. Check trigger status: `list_triggers`
2. Verify trigger is 'active'
3. Check cron schedule is valid
4. View logs for errors

### MCP client can't connect

1. Verify build completed: `npm run build`
2. Check dist/index.js exists
3. Verify path in MCP config is correct
4. Restart MCP client

## Development

```bash
# Watch mode (rebuilds on change)
npm run dev

# Build
npm run build

# Run directly
npm start
```

## Architecture

```
mcp-trigger-gateway/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── protocol/             # Type definitions & Zod schemas
│   ├── lib/                  # Core logic
│   │   ├── storage.ts        # Trigger storage
│   │   ├── trigger-manager.ts # Trigger lifecycle management
│   │   └── action-executor.ts # Action execution
│   ├── listeners/            # Event listeners
│   ├── cron/                 # Cron scheduler
│   └── utils/                # Logger, etc.
├── service/                  # System service files
├── examples/                 # Example trigger configs
└── dist/                     # Compiled output
```

## Security Notes

- Shell commands run with service user permissions
- Store secrets in environment variables, not trigger configs
- Validate all HTTP URLs before calling
- Only call trusted MCP servers
- Review trigger configs before activation

## Support

For issues: https://github.com/yourusername/mcp-trigger-gateway/issues
