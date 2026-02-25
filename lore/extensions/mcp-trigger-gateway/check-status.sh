#!/bin/bash

# MCP Trigger Gateway - Status Check Script

echo "=========================================="
echo "MCP Trigger Gateway - Status Check"
echo "=========================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
else
    echo "❌ Unsupported platform: $OSTYPE"
    exit 1
fi

# Check build
echo "Build Status:"
echo "-------------"
if [ -f "dist/index.js" ]; then
    echo "✅ Project is built (dist/index.js exists)"
    BUILD_SIZE=$(du -h dist/index.js | cut -f1)
    echo "   Size: $BUILD_SIZE"
else
    echo "❌ Project not built (run: npm run build)"
fi
echo ""

# Check dependencies
echo "Dependencies:"
echo "-------------"
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
    PKG_COUNT=$(ls -1 node_modules | wc -l | xargs)
    echo "   Packages: $PKG_COUNT"
else
    echo "❌ Dependencies not installed (run: npm install)"
fi
echo ""

# Platform-specific checks
if [ "$PLATFORM" == "macos" ]; then
    echo "macOS Service Status:"
    echo "--------------------"

    PLIST_FILE=~/Library/LaunchAgents/com.mcp.trigger-gateway.plist

    if [ -f "$PLIST_FILE" ]; then
        echo "✅ Service installed"
        echo "   File: $PLIST_FILE"
        echo ""

        if launchctl list | grep -q "com.mcp.trigger-gateway"; then
            echo "✅ Service is running"
            echo ""
            launchctl list | grep mcp-trigger-gateway | while read line; do
                echo "   $line"
            done
            echo ""

            # Check logs
            if [ -f ~/.mcp-trigger-gateway/logs/stderr.log ]; then
                LOG_SIZE=$(du -h ~/.mcp-trigger-gateway/logs/stderr.log | cut -f1)
                LOG_LINES=$(wc -l < ~/.mcp-trigger-gateway/logs/stderr.log)
                echo "📝 Log file: ~/.mcp-trigger-gateway/logs/stderr.log"
                echo "   Size: $LOG_SIZE, Lines: $LOG_LINES"
                echo ""
                echo "   Last 5 log entries:"
                tail -n 5 ~/.mcp-trigger-gateway/logs/stderr.log | sed 's/^/   /'
            fi
        else
            echo "❌ Service not running"
            echo ""
            echo "Start with: launchctl start com.mcp.trigger-gateway"
        fi
    else
        echo "❌ Service not installed"
        echo ""
        echo "Install with: ./setup-autostart.sh"
    fi

    echo ""
    echo "Auto-Start:"
    if [ -f "$PLIST_FILE" ]; then
        if grep -q "<key>RunAtLoad</key>" "$PLIST_FILE" && \
           grep -A1 "<key>RunAtLoad</key>" "$PLIST_FILE" | grep -q "<true/>"; then
            echo "✅ Will start automatically on login"
        else
            echo "⚠️  Auto-start disabled"
        fi
    else
        echo "❌ Service not configured for auto-start"
    fi

elif [ "$PLATFORM" == "linux" ]; then
    echo "Linux Service Status:"
    echo "--------------------"

    SERVICE_FILE=/etc/systemd/system/mcp-trigger-gateway.service

    if [ -f "$SERVICE_FILE" ]; then
        echo "✅ Service installed"
        echo "   File: $SERVICE_FILE"
        echo ""

        if sudo systemctl is-active --quiet mcp-trigger-gateway; then
            echo "✅ Service is running"
            echo ""
            sudo systemctl status mcp-trigger-gateway --no-pager -l | head -20 | sed 's/^/   /'
        else
            echo "❌ Service not running"
            echo ""
            echo "Start with: sudo systemctl start mcp-trigger-gateway"
        fi
    else
        echo "❌ Service not installed"
        echo ""
        echo "Install with: ./setup-autostart.sh"
    fi

    echo ""
    echo "Auto-Start:"
    if sudo systemctl is-enabled --quiet mcp-trigger-gateway 2>/dev/null; then
        echo "✅ Will start automatically on boot"
    else
        echo "❌ Auto-start disabled"
    fi
fi

echo ""

# Check data directory
echo "Data Storage:"
echo "-------------"
if [ -d ~/.mcp-trigger-gateway ]; then
    echo "✅ Data directory exists: ~/.mcp-trigger-gateway"

    if [ -f ~/.mcp-trigger-gateway/triggers.json ]; then
        TRIGGER_COUNT=$(jq '. | length' ~/.mcp-trigger-gateway/triggers.json 2>/dev/null || echo "?")
        echo "   Triggers configured: $TRIGGER_COUNT"
    else
        echo "   Triggers configured: 0 (no triggers.json yet)"
    fi
else
    echo "ℹ️  Data directory not created yet"
    echo "   Will be created on first run"
fi

echo ""
echo "=========================================="
echo ""

# Provide helpful commands
if [ "$PLATFORM" == "macos" ]; then
    echo "Useful Commands:"
    echo "  View logs:      tail -f ~/.mcp-trigger-gateway/logs/stderr.log"
    echo "  Start service:  launchctl start com.mcp.trigger-gateway"
    echo "  Stop service:   launchctl stop com.mcp.trigger-gateway"
    echo "  Restart:        launchctl stop com.mcp.trigger-gateway && launchctl start com.mcp.trigger-gateway"
else
    echo "Useful Commands:"
    echo "  View logs:      journalctl -u mcp-trigger-gateway -f"
    echo "  Start service:  sudo systemctl start mcp-trigger-gateway"
    echo "  Stop service:   sudo systemctl stop mcp-trigger-gateway"
    echo "  Restart:        sudo systemctl restart mcp-trigger-gateway"
fi

echo ""
