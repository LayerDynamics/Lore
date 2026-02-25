#!/usr/bin/env python3
"""UserPromptSubmit hook: detect /skill invocations, log prompt hash + length."""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))
from logger import make_event, write_event, read_stdin_json, hash_text


def main():
    try:
        ctx = read_stdin_json()
        # CC hook field: user_prompt (not "prompt")
        prompt = ctx.get("user_prompt", "")
        if not isinstance(prompt, str):
            prompt = str(prompt)

        # Detect skill invocations: lines starting with /word
        skill_match = re.search(r"^/([a-zA-Z0-9_:-]+)", prompt.strip(), re.MULTILINE)
        skill_name = f"/{skill_match.group(1)}" if skill_match else None

        prompt_hash = hash_text(prompt) if prompt else None
        prompt_len = len(prompt)

        # Count lines and words for activity metrics
        line_count = len(prompt.splitlines())
        word_count = len(prompt.split())

        event = make_event(
            event_type="UserPromptSubmit",
            skill=skill_name,
            meta={
                "prompt_hash": prompt_hash,
                "prompt_len": prompt_len,
                "prompt_lines": line_count,
                "prompt_words": word_count,
                "has_skill": skill_name is not None,
                "cwd": ctx.get("cwd"),
            }
        )
        write_event(event)
    except Exception:
        pass  # Never block on telemetry errors
    sys.exit(0)


if __name__ == "__main__":
    main()
