# Architecture Documentation

## Overview

MCP Trigger Gateway is designed to run as a long-running daemon/system service that provides trigger-based automation capabilities through the Model Context Protocol (MCP).

## System Design

### Core Principles

1. **Always Running** - Designed to run 24/7 as a system service
2. **Event-Driven** - Reacts to time, events, webhooks, and file changes
3. **Action-Oriented** - Executes configurable actions when triggered
4. **Extensible** - Easy to add new trigger types and action types

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (Claude)                     │
│                   (Sends tool requests)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ stdio
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server (index.ts)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tool Handlers: create_trigger, list_triggers, etc.  │  │
│  └───────────────────┬───────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Trigger Manager                           │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Storage    │  │  Executor   │  │  Registration    │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└───────┬─────────────────────┬────────────────────┬──────────┘
        │                     │                    │
        ▼                     ▼                    ▼
┌─────────────┐    ┌──────────────────┐   ┌─────────────────┐
│   Storage   │    │ Action Executor  │   │    Listeners    │
│ (JSON File) │    │                  │   │                 │
└─────────────┘    │ • MCP Calls      │   │ • Cron          │
                   │ • HTTP Requests  │   │ • Events        │
                   │ • Shell Commands │   │ • Webhooks      │
                   │ • Chains         │   │ • File Watch    │
                   └──────────────────┘   └─────────────────┘
```

## Component Details

### 1. MCP Server Layer (`src/index.ts`)

**Responsibility**: MCP protocol implementation and tool routing

- Listens on stdio for MCP requests
- Implements MCP tool definitions
- Routes requests to Trigger Manager
- Handles graceful shutdown

**Key Functions**:
- Tool registration and listing
- Request validation with Zod schemas
- Response formatting

### 2. Trigger Manager (`src/lib/trigger-manager.ts`)

**Responsibility**: Trigger lifecycle management

- Create, read, update, delete triggers
- Execute triggers when events occur
- Coordinate between storage and executors

**Key Operations**:
- `createTrigger()` - Validates and stores new triggers
- `executeTrigger()` - Executes trigger actions
- `updateTrigger()` - Modifies existing triggers
- `listTriggers()` - Queries with filters

### 3. Storage Layer (`src/lib/storage.ts`)

**Responsibility**: Persistent trigger configuration

- In-memory cache with file backing
- JSON file storage at `~/.mcp-trigger-gateway/triggers.json`
- Atomic updates

**Features**:
- Fast in-memory reads
- Automatic persistence
- Query by type, status
- Transactional updates

### 4. Action Executor (`src/lib/action-executor.ts`)

**Responsibility**: Execute trigger actions

Supports multiple action types:

**MCP Calls** (TODO):
- Call other MCP servers
- Pass arguments
- Handle responses

**HTTP Requests**:
- GET, POST, PUT, DELETE
- Custom headers
- JSON/text body support

**Shell Commands**:
- Execute system commands
- Environment variable support
- Capture stdout/stderr

**Trigger Chains**:
- Execute other triggers in sequence
- Pass data between triggers

### 5. Listeners

#### Cron Scheduler (`src/cron/cron-scheduler.ts`)

**Responsibility**: Time-based trigger execution

- Parse cron expressions
- Schedule recurring jobs
- Fire triggers on schedule

**Current Implementation**:
- Simple interval-based (needs improvement)
- Basic cron parsing

**TODO**:
- Use node-cron for full cron support
- Timezone handling
- DST awareness

#### Event Listener (`src/listeners/event-listener.ts`)

**Responsibility**: Custom event handling

- In-process event bus
- Event filtering
- Source tracking

**Features**:
- Named events
- Payload filtering
- Multiple listeners per event

#### Webhook Listener (TODO)

**Planned**:
- HTTP server for webhooks
- Path routing
- Authentication
- Request validation

#### File Watch Listener (TODO)

**Planned**:
- Monitor filesystem changes
- Glob pattern matching
- Debouncing
- Event types: create, modify, delete

## Data Flow

### Creating a Trigger

```
1. MCP Client sends create_trigger tool request
2. MCP Server validates with Zod schema
3. Trigger Manager creates trigger with UUID
4. Storage persists to disk
5. Appropriate listener registers the trigger
   - Cron → CronScheduler
   - Event → EventListener
6. Response sent to client
```

### Executing a Trigger

```
1. Event occurs (cron tick, event fired, etc.)
2. Listener creates TriggerEvent
3. Listener calls Trigger Manager
4. Trigger Manager checks status (active?)
5. Action Executor executes each action sequentially
6. Results collected and returned
7. Last triggered time updated
```

### Trigger Lifecycle States

```
                    ┌─────────────┐
                    │   Created   │
                    └──────┬──────┘
                           │
                           ▼
    ┌──────────────┬───────────────┬──────────────┐
    │              │               │              │
    ▼              ▼               ▼              ▼
┌────────┐    ┌────────┐     ┌──────────┐   ┌────────┐
│ Active │◄──►│ Paused │     │ Disabled │   │ Error  │
└────────┘    └────────┘     └──────────┘   └────────┘
    │              │               │              │
    └──────────────┴───────────────┴──────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Deleted   │
                    └─────────────┘
```

## Running as a Service

### Design Considerations for Daemon Operation

1. **No Interactive Output**
   - All output to stderr (stdout reserved for MCP)
   - Structured JSON logging
   - Log level control

2. **Graceful Shutdown**
   - SIGTERM/SIGINT handlers
   - Clean up listeners
   - Save state
   - Close connections

3. **Resource Management**
   - Memory limits (512MB default)
   - File descriptor limits
   - Interval cleanup
   - Connection pooling

4. **Error Recovery**
   - Catch and log errors
   - Continue operation on non-fatal errors
   - Isolate trigger execution
   - Retry logic for failed actions

5. **State Persistence**
   - Auto-save to disk
   - Recovery on restart
   - Reload active triggers

### Service Configuration

**systemd (Linux)**:
- User service isolation
- Automatic restart on failure
- Resource limits
- Journal logging

**launchd (macOS)**:
- KeepAlive for auto-restart
- Background process type
- File-based logging
- Throttle interval

## Security Model

### Isolation

- Runs as user service (not root)
- Limited filesystem access
- No network exposure (MCP over stdio only)

### Input Validation

- All tool inputs validated with Zod schemas
- Type-safe TypeScript throughout
- Sanitize shell commands
- Validate URLs

### Execution Safety

- Shell commands inherit service permissions
- No arbitrary code execution
- Environment variable controls
- Audit logging

## Performance Characteristics

### Memory

- Base: ~50MB
- Per trigger: ~1KB
- In-memory trigger cache
- Event listeners: ~5MB

### CPU

- Idle: <1%
- During execution: varies by action
- Cron tick: minimal overhead

### Disk I/O

- Trigger updates: synchronous writes
- Logs: async writes
- JSON file size: ~1KB per trigger

### Scalability

**Current Limits**:
- Triggers: ~10,000 (memory constraint)
- Concurrent executions: Sequential (by design)
- Event throughput: ~1000/sec

**Future Improvements**:
- Database backend for large deployments
- Parallel action execution
- Trigger execution queue
- Distributed deployment

## Extension Points

### Adding New Trigger Types

1. Define config interface in `src/protocol/types.ts`
2. Add Zod schema in `src/protocol/schemas.ts`
3. Create listener in `src/listeners/`
4. Register in `src/index.ts`

Example: WebSocket trigger

### Adding New Action Types

1. Define action interface in `src/protocol/types.ts`
2. Add Zod schema in `src/protocol/schemas.ts`
3. Add executor method in `src/lib/action-executor.ts`
4. Handle in action switch statement

Example: Database query action

### Adding MCP Client Support

To actually call other MCP servers:

1. Install MCP SDK client components
2. Maintain MCP client connections
3. Implement in `ActionExecutor.executeMcpCall()`
4. Handle connection lifecycle

## Future Architecture

### Phase 2: Advanced Features

- **Webhook HTTP Server**: Express server for webhook endpoints
- **File Watcher**: chokidar integration
- **Advanced Scheduling**: node-cron, timezone support
- **Execution History**: SQLite database for logs
- **Metrics**: Prometheus endpoint
- **Health Checks**: HTTP endpoint for monitoring

### Phase 3: Distributed

- **Multi-node**: Leader election, distributed triggers
- **Queue Backend**: Redis/RabbitMQ for trigger queue
- **State Store**: PostgreSQL/MongoDB for triggers
- **Coordination**: etcd/Consul for distributed config

## Development Guidelines

### Code Organization

- One responsibility per file
- Interfaces in `protocol/`
- Business logic in `lib/`
- External integrations in specific folders

### Error Handling

- Try/catch in all async functions
- Log errors with context
- Return error objects, don't throw
- Graceful degradation

### Testing Strategy

- Unit tests for pure logic
- Integration tests for storage
- E2E tests for MCP protocol
- Load tests for performance

### Logging

- Use structured logger
- Include context (triggerId, action, etc.)
- Log levels: DEBUG, INFO, WARN, ERROR
- Performance metrics

## Monitoring

### Key Metrics

- Trigger execution count
- Action success/failure rate
- Execution duration
- Error rate
- Memory usage
- Trigger count by type/status

### Health Indicators

- Storage accessible
- Listeners running
- Recent execution activity
- No error spikes

## Troubleshooting

### Common Issues

1. **Triggers not firing**
   - Check trigger status (active?)
   - Verify cron expression
   - Check listener registration

2. **High memory**
   - Too many triggers
   - Memory leak in listener
   - Large event payloads

3. **Actions failing**
   - Check action configuration
   - Verify permissions
   - Review error logs

### Debug Mode

```bash
LOG_LEVEL=DEBUG node dist/index.js
```

Enables verbose logging for all operations.
