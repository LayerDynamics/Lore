# MCP Trigger Gateway

A Model Context Protocol (MCP) server that enables trigger-based automation. Set up cron schedules, webhooks, file watchers, and custom events that can trigger actions across multiple MCP servers, HTTP APIs, and shell commands.

## Features

- 🕐 **Cron Triggers** - Schedule recurring tasks with cron expressions
- 🪝 **Webhook Triggers** - HTTP endpoints to trigger automation
- 📡 **Event Triggers** - Custom event-based triggering system
- 👀 **File Watch Triggers** - Monitor filesystem changes
- ✋ **Manual Triggers** - On-demand execution

### Actions

Execute any combination of:
- **MCP Calls** - Trigger other MCP servers' tools
- **HTTP Requests** - Call REST APIs
- **Shell Commands** - Run system commands
- **Trigger Chains** - Execute multiple triggers in sequence

## Running as a System Service

The MCP Trigger Gateway is designed to run continuously as a background service/daemon.

### Quick Install

```bash
# Clone and install
git clone <repo-url> ~/.mcp-trigger-gateway
cd ~/.mcp-trigger-gateway
npm install
npm run build

# Install as system service
./service/install.sh
```

### Manual Installation

#### macOS (LaunchAgent)

```bash
# Build the project
npm run build

# Copy LaunchAgent
cp service/com.mcp.trigger-gateway.plist ~/Library/LaunchAgents/

# Edit the plist file and update YOUR_USERNAME and paths
vim ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

# Load the service
launchctl load ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

# Start the service
launchctl start com.mcp.trigger-gateway
```

#### Linux (systemd)

```bash
# Build the project
npm run build

# Copy service file
sudo cp service/mcp-trigger-gateway.service /etc/systemd/system/

# Edit service file and update paths
sudo vim /etc/systemd/system/mcp-trigger-gateway.service

# Reload systemd
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable mcp-trigger-gateway
sudo systemctl start mcp-trigger-gateway
```

### Service Management

#### macOS
```bash
# Start
launchctl start com.mcp.trigger-gateway

# Stop
launchctl stop com.mcp.trigger-gateway

# View logs
tail -f ~/.mcp-trigger-gateway/logs/stderr.log
```

#### Linux
```bash
# Start
sudo systemctl start mcp-trigger-gateway

# Stop
sudo systemctl stop mcp-trigger-gateway

# Restart
sudo systemctl restart mcp-trigger-gateway

# View logs
journalctl -u mcp-trigger-gateway -f
```

## MCP Integration

Add to your Claude Desktop or MCP client configuration:

**~/.config/claude-desktop/config.json** (Linux/macOS):
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
      "args": ["/Users/yourusername/.mcp-trigger-gateway/dist/index.js"]
    }
  }
}
```

## Available Tools

### create_trigger

Create a new trigger with actions.

```typescript
{
  name: "Daily Backup",
  description: "Backup database every day at 2am",
  type: "cron",
  config: {
    type: "cron",
    schedule: "0 2 * * *",
    timezone: "America/New_York"
  },
  actions: [
    {
      type: "shell",
      config: {
        type: "shell",
        command: "pg_dump",
        args: ["mydb", "-f", "/backups/daily.sql"]
      }
    }
  ]
}
```

### list_triggers

List all triggers with optional filtering:

```typescript
{
  type: "cron",  // Filter by type
  status: "active"  // Filter by status
}
```

### get_trigger

Get details of a specific trigger:

```typescript
{
  id: "trigger-uuid"
}
```

### update_trigger

Update an existing trigger:

```typescript
{
  id: "trigger-uuid",
  status: "paused",  // Pause the trigger
  config: { /* new config */ }
}
```

### delete_trigger

Delete a trigger:

```typescript
{
  id: "trigger-uuid"
}
```

### fire_event

Manually fire an event to trigger event-based triggers:

```typescript
{
  eventName: "deployment.complete",
  payload: {
    environment: "production",
    version: "1.2.3"
  }
}
```

### execute_trigger

Manually execute a specific trigger:

```typescript
{
  id: "trigger-uuid",
  payload: { /* optional data */ }
}
```

## Examples

### Example 1: Scheduled API Health Check

```json
{
  "name": "API Health Check",
  "type": "cron",
  "config": {
    "type": "cron",
    "schedule": "*/5 * * * *"
  },
  "actions": [
    {
      "type": "http",
      "config": {
        "type": "http",
        "url": "https://api.example.com/health",
        "method": "GET"
      }
    }
  ]
}
```

### Example 2: Event-Driven Notification

```json
{
  "name": "Error Alert",
  "type": "event",
  "config": {
    "type": "event",
    "eventName": "error.critical",
    "filter": {
      "severity": "critical"
    }
  },
  "actions": [
    {
      "type": "http",
      "config": {
        "type": "http",
        "url": "https://slack.com/api/chat.postMessage",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_TOKEN"
        },
        "body": {
          "channel": "#alerts",
          "text": "Critical error detected!"
        }
      }
    }
  ]
}
```

### Example 3: Chain Multiple MCP Servers

```json
{
  "name": "Data Pipeline",
  "type": "manual",
  "config": {
    "type": "manual"
  },
  "actions": [
    {
      "type": "mcp_call",
      "config": {
        "type": "mcp_call",
        "server": "database-tools",
        "tool": "export_data",
        "arguments": {
          "table": "users",
          "format": "csv"
        }
      }
    },
    {
      "type": "mcp_call",
      "config": {
        "type": "mcp_call",
        "server": "cloud-storage",
        "tool": "upload_file",
        "arguments": {
          "path": "/exports/users.csv",
          "bucket": "backups"
        }
      }
    }
  ]
}
```

## Configuration

### Data Storage

Triggers are stored in `~/.mcp-trigger-gateway/triggers.json`

### Environment Variables

- `LOG_LEVEL` - Set logging level (DEBUG, INFO, WARN, ERROR)
- `NODE_ENV` - Set environment (development, production)

### Logging

Logs are written to:
- **macOS**: `~/.mcp-trigger-gateway/logs/stderr.log`
- **Linux**: System journal (view with `journalctl`)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development with watch mode
npm run dev

# Run directly
npm start
```

## Architecture

```
src/
├── cron/              # Cron scheduler
├── lib/               # Core logic (storage, trigger manager, executor)
├── listeners/         # Event listeners
├── prompts/           # MCP prompts (future)
├── protocol/          # Type definitions and schemas
├── scheduler/         # Advanced scheduling (future)
├── triggers/          # Trigger type implementations
└── utils/             # Utilities (logger, etc.)
```

## Security Considerations

- **Shell Commands**: Be cautious with shell action execution
- **HTTP Actions**: Validate URLs and sanitize inputs
- **MCP Calls**: Only call trusted MCP servers
- **File Permissions**: Service runs with limited permissions
- **Secrets**: Store sensitive data in environment variables, not in trigger configs

## Roadmap

- [ ] Webhook HTTP server for webhook triggers
- [ ] File system watcher implementation
- [ ] Advanced cron parsing with timezone support
- [ ] Trigger execution history and logging
- [ ] Retry logic and error handling
- [ ] Trigger templates and presets
- [ ] Web UI for trigger management
- [ ] Prometheus metrics endpoint
- [ ] Rate limiting and concurrency control

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
