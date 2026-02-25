#!/bin/bash
set -e

# Installation script for MCP Trigger Gateway as a system service

echo "MCP Trigger Gateway - Service Installation"
echo "=========================================="

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
else
    echo "Unsupported platform: $OSTYPE"
    exit 1
fi

# Build the project
echo "Building project..."
npm install
npm run build

# Install based on platform
if [ "$PLATFORM" == "linux" ]; then
    echo "Installing systemd service..."

    # Copy service file
    sudo cp service/mcp-trigger-gateway.service /etc/systemd/system/

    # Update paths in service file
    INSTALL_PATH=$(pwd)
    sudo sed -i "s|/path/to/mcp-trigger-gateway|$INSTALL_PATH|g" /etc/systemd/system/mcp-trigger-gateway.service
    sudo sed -i "s|%i|$USER|g" /etc/systemd/system/mcp-trigger-gateway.service

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable service
    sudo systemctl enable mcp-trigger-gateway

    echo ""
    echo "Service installed! Use these commands:"
    echo "  Start:   sudo systemctl start mcp-trigger-gateway"
    echo "  Stop:    sudo systemctl stop mcp-trigger-gateway"
    echo "  Status:  sudo systemctl status mcp-trigger-gateway"
    echo "  Logs:    journalctl -u mcp-trigger-gateway -f"

elif [ "$PLATFORM" == "macos" ]; then
    echo "Installing macOS LaunchAgent..."

    # Create directories
    mkdir -p ~/Library/LaunchAgents
    mkdir -p ~/.mcp-trigger-gateway/logs

    # Copy and update plist
    cp service/com.mcp.trigger-gateway.plist ~/Library/LaunchAgents/
    INSTALL_PATH=$(pwd)
    sed -i '' "s|YOUR_USERNAME|$USER|g" ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist
    sed -i '' "s|/Users/YOUR_USERNAME/.mcp-trigger-gateway|$INSTALL_PATH|g" ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

    # Load the agent
    launchctl load ~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

    echo ""
    echo "Service installed! Use these commands:"
    echo "  Start:   launchctl start com.mcp.trigger-gateway"
    echo "  Stop:    launchctl stop com.mcp.trigger-gateway"
    echo "  Status:  launchctl list | grep mcp-trigger-gateway"
    echo "  Logs:    tail -f ~/.mcp-trigger-gateway/logs/stderr.log"
fi

echo ""
echo "Installation complete!"
