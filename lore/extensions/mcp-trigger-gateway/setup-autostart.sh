#!/bin/bash
set -e

# MCP Trigger Gateway - Auto-Start Setup Script
# Configures the service to start automatically on boot

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

echo "=========================================="
echo "MCP Trigger Gateway - Auto-Start Setup"
echo "=========================================="
echo ""
echo "Project directory: $PROJECT_DIR"
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
    echo "Platform: Linux (systemd)"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
    echo "Platform: macOS (launchd)"
else
    echo "❌ Error: Unsupported platform: $OSTYPE"
    echo "This script supports macOS and Linux only."
    exit 1
fi

echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

NODE_PATH=$(which node)
echo "Node.js: $NODE_PATH ($(node --version))"
echo ""

# Build the project
echo "Step 1: Building project..."
echo "----------------------------"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Building TypeScript..."
npm run build

if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Configure based on platform
if [ "$PLATFORM" == "macos" ]; then
    echo "Step 2: Configuring macOS LaunchAgent..."
    echo "----------------------------------------"

    # Create directories
    mkdir -p ~/Library/LaunchAgents
    mkdir -p ~/.mcp-trigger-gateway/logs

    PLIST_FILE=~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

    # Create the plist file with correct paths
    cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mcp.trigger-gateway</string>

    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_DIR/dist/index.js</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>LOG_LEVEL</key>
        <string>INFO</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>

    <key>StandardOutPath</key>
    <string>$HOME/.mcp-trigger-gateway/logs/stdout.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/.mcp-trigger-gateway/logs/stderr.log</string>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

    echo "✅ Created: $PLIST_FILE"
    echo ""

    echo "Step 3: Installing and starting service..."
    echo "------------------------------------------"

    # Unload if already loaded
    if launchctl list | grep -q "com.mcp.trigger-gateway"; then
        echo "Stopping existing service..."
        launchctl unload "$PLIST_FILE" 2>/dev/null || true
    fi

    # Load the service
    launchctl load "$PLIST_FILE"

    # Give it a moment to start
    sleep 2

    # Check if running
    if launchctl list | grep -q "com.mcp.trigger-gateway"; then
        echo "✅ Service installed and running"
        echo ""
        echo "Service details:"
        launchctl list | grep mcp-trigger-gateway
    else
        echo "⚠️  Service installed but may not be running"
        echo "Check logs: tail -f ~/.mcp-trigger-gateway/logs/stderr.log"
    fi

    echo ""
    echo "=========================================="
    echo "✅ macOS Auto-Start Configuration Complete!"
    echo "=========================================="
    echo ""
    echo "The service will now:"
    echo "  • Start automatically when you log in"
    echo "  • Restart automatically if it crashes"
    echo "  • Run in the background continuously"
    echo ""
    echo "Useful commands:"
    echo "  Start:   launchctl start com.mcp.trigger-gateway"
    echo "  Stop:    launchctl stop com.mcp.trigger-gateway"
    echo "  Status:  launchctl list | grep mcp-trigger-gateway"
    echo "  Logs:    tail -f ~/.mcp-trigger-gateway/logs/stderr.log"
    echo ""
    echo "To disable auto-start:"
    echo "  launchctl unload ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist"
    echo ""

elif [ "$PLATFORM" == "linux" ]; then
    echo "Step 2: Configuring systemd service..."
    echo "---------------------------------------"

    SERVICE_FILE=/etc/systemd/system/mcp-trigger-gateway.service

    # Create the service file content
    SERVICE_CONTENT="[Unit]
Description=MCP Trigger Gateway - Automation trigger service for Model Context Protocol
Documentation=https://github.com/yourusername/mcp-trigger-gateway
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR

# Command to run
ExecStart=$NODE_PATH $PROJECT_DIR/dist/index.js

# Environment
Environment=\"NODE_ENV=production\"
Environment=\"LOG_LEVEL=INFO\"
Environment=\"PATH=/usr/local/bin:/usr/bin:/bin\"

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=0
StartLimitBurst=5

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$HOME/.mcp-trigger-gateway

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mcp-trigger-gateway

# Resource limits
LimitNOFILE=65536
MemoryMax=512M

[Install]
WantedBy=multi-user.target"

    echo "Creating service file (requires sudo)..."
    echo "$SERVICE_CONTENT" | sudo tee "$SERVICE_FILE" > /dev/null

    echo "✅ Created: $SERVICE_FILE"
    echo ""

    echo "Step 3: Installing and starting service..."
    echo "------------------------------------------"

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable auto-start
    sudo systemctl enable mcp-trigger-gateway

    # Start the service
    sudo systemctl start mcp-trigger-gateway

    # Give it a moment to start
    sleep 2

    # Check status
    if sudo systemctl is-active --quiet mcp-trigger-gateway; then
        echo "✅ Service installed and running"
        echo ""
        echo "Service status:"
        sudo systemctl status mcp-trigger-gateway --no-pager -l
    else
        echo "⚠️  Service installed but may not be running"
        echo "Check status: sudo systemctl status mcp-trigger-gateway"
        echo "Check logs: journalctl -u mcp-trigger-gateway -n 50"
    fi

    echo ""
    echo "=========================================="
    echo "✅ Linux Auto-Start Configuration Complete!"
    echo "=========================================="
    echo ""
    echo "The service will now:"
    echo "  • Start automatically on system boot"
    echo "  • Restart automatically if it crashes"
    echo "  • Run in the background continuously"
    echo ""
    echo "Useful commands:"
    echo "  Start:   sudo systemctl start mcp-trigger-gateway"
    echo "  Stop:    sudo systemctl stop mcp-trigger-gateway"
    echo "  Restart: sudo systemctl restart mcp-trigger-gateway"
    echo "  Status:  sudo systemctl status mcp-trigger-gateway"
    echo "  Logs:    journalctl -u mcp-trigger-gateway -f"
    echo ""
    echo "To disable auto-start:"
    echo "  sudo systemctl disable mcp-trigger-gateway"
    echo ""
fi

# Final instructions
echo "Next Steps:"
echo "==========="
echo ""
echo "1. View logs to confirm it's running:"
if [ "$PLATFORM" == "macos" ]; then
    echo "   tail -f ~/.mcp-trigger-gateway/logs/stderr.log"
else
    echo "   journalctl -u mcp-trigger-gateway -f"
fi
echo ""
echo "2. Add to Claude Desktop config:"
echo "   File: ~/.config/claude-desktop/config.json (Linux)"
echo "   File: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)"
echo ""
echo "   Add this:"
echo '   {'
echo '     "mcpServers": {'
echo '       "trigger-gateway": {'
echo '         "command": "node",'
echo "         \"args\": [\"$PROJECT_DIR/dist/index.js\"]"
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "3. Restart Claude Desktop to load the MCP server"
echo ""
echo "Installation complete! 🎉"
