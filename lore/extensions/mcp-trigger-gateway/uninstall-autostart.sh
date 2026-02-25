#!/bin/bash
set -e

# MCP Trigger Gateway - Auto-Start Removal Script

echo "=========================================="
echo "MCP Trigger Gateway - Uninstall Auto-Start"
echo "=========================================="
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
    exit 1
fi

echo ""

if [ "$PLATFORM" == "macos" ]; then
    PLIST_FILE=~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

    if [ ! -f "$PLIST_FILE" ]; then
        echo "ℹ️  Service not installed (plist file not found)"
        exit 0
    fi

    echo "Stopping service..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true

    echo "Removing plist file..."
    rm "$PLIST_FILE"

    echo ""
    echo "✅ Auto-start removed successfully!"
    echo ""
    echo "The service will no longer start on login."
    echo "Logs are still available at: ~/.mcp-trigger-gateway/logs/"
    echo ""
    echo "To remove logs and data:"
    echo "  rm -rf ~/.mcp-trigger-gateway"
    echo ""

elif [ "$PLATFORM" == "linux" ]; then
    SERVICE_FILE=/etc/systemd/system/mcp-trigger-gateway.service

    if [ ! -f "$SERVICE_FILE" ]; then
        echo "ℹ️  Service not installed (service file not found)"
        exit 0
    fi

    echo "Stopping service..."
    sudo systemctl stop mcp-trigger-gateway 2>/dev/null || true

    echo "Disabling auto-start..."
    sudo systemctl disable mcp-trigger-gateway 2>/dev/null || true

    echo "Removing service file..."
    sudo rm "$SERVICE_FILE"

    echo "Reloading systemd..."
    sudo systemctl daemon-reload

    echo ""
    echo "✅ Auto-start removed successfully!"
    echo ""
    echo "The service will no longer start on boot."
    echo "To remove data:"
    echo "  rm -rf ~/.mcp-trigger-gateway"
    echo ""
fi

echo "To reinstall auto-start, run:"
echo "  ./setup-autostart.sh"
echo ""
