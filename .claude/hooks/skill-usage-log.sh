#!/usr/bin/env bash
# PostToolUse(Skill__.*) — silent skill-usage logger. Records which skills are invoked so the
# /skill-audit skill can later surface workflows worth capturing as a committed project skill.
# Silent + non-blocking: always exits 0, never interrupts. Log is per-developer (gitignored).
input=$(cat)
name=$(printf '%s' "$input" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"Skill__\([^"]*\)".*/\1/p' | head -1)
[ -z "$name" ] && exit 0
printf '%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$name" >> .claude/skill-usage.log
exit 0
