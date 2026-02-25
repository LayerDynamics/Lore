#!/usr/bin/env python3
"""SessionStart hook: log session begin + list enabled plugins."""

import sys
import os
import json
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
from logger import make_event, write_event, read_stdin_json

def main():
    try:
        ctx = read_stdin_json()
        
        # Try to read enabled plugins from settings.json
        settings_path = Path.home() / ".claude" / "settings.json"
        enabled_plugins = []
        try:
            with open(settings_path) as f:
                settings = json.load(f)
            enabled_plugins = [k for k, v in settings.get("enabledPlugins", {}).items() if v]
        except Exception:
            pass

        event = make_event(
            event_type="SessionStart",
            meta={
                "enabled_plugins": enabled_plugins,
                "cwd": ctx.get("cwd"),
                "permission_mode": ctx.get("permission_mode"),
            }
        )
        write_event(event)
    except Exception:
        pass  # Never block on telemetry errors
    sys.exit(0)

if __name__ == "__main__":
    main()
