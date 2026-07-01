#!/usr/bin/env python3
"""Block broad code-discovery shell searches when Semble is the better tool."""

from __future__ import annotations

import json
import re
import shlex
import sys
from collections.abc import Iterable
from typing import Any


SEMANTIC_SEARCH_MESSAGE = """Use Semble for exploratory code discovery.

Preferred:
  mcp__semble__search with a behavior/symbol query, then read the returned file and line.

CLI fallback:
  semble search "what you are looking for" . --max-snippet-lines 10
  semble search "deployment guide" . --content docs
  semble search "database host port" . --content config

Use rg/grep only for exhaustive literal-string sweeps, and make that intent explicit with a fixed literal and path.
"""

SEARCH_BINARIES = {
    "grep",
    "egrep",
    "fgrep",
    "rgrep",
    "rg",
    "ag",
    "ack",
}

SHELL_BINARIES = {"bash", "sh", "zsh", "fish"}
ALLOW_RG_FLAGS = {
    "--files",
    "--type-list",
    "--version",
    "--help",
}


def main() -> int:
    payload = read_payload()
    commands = list(extract_commands(payload))

    for command in commands:
        reason = blocked_reason(command)
        if reason:
            print(f"{reason}\n\n{SEMANTIC_SEARCH_MESSAGE}", file=sys.stderr)
            return 1

    return 0


def read_payload() -> Any:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}


def extract_commands(value: Any) -> Iterable[str]:
    if isinstance(value, dict):
        for key, child in value.items():
            lowered = str(key).lower()
            if lowered in {"command", "cmd"} and isinstance(child, str):
                yield child
            elif lowered == "argv" and isinstance(child, list):
                yield shlex.join(str(part) for part in child)
            else:
                yield from extract_commands(child)
    elif isinstance(value, list):
        for item in value:
            yield from extract_commands(item)


def blocked_reason(command: str) -> str | None:
    words = split_command(command)
    if not words:
        return None

    words = unwrap_shell(words)
    if not words:
        return None

    executable = basename(words[0])

    if executable == "find":
        return block_find(words)

    if executable in SEARCH_BINARIES:
        return block_search_binary(executable, words)

    return None


def split_command(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError:
        return command.split()


def unwrap_shell(words: list[str]) -> list[str]:
    if basename(words[0]) not in SHELL_BINARIES:
        return words

    for index, word in enumerate(words[1:], start=1):
        if word in {"-c", "-lc", "-ic"} and index + 1 < len(words):
            return split_command(words[index + 1])

    return words


def basename(path: str) -> str:
    return path.rsplit("/", 1)[-1]


def block_find(words: list[str]) -> str | None:
    command = " ".join(words)
    if re.search(r"(^|\s)-name\s+['\"]?[*?]", command):
        return "Blocked broad filename discovery through find."
    if any(part in {"-name", "-iname", "-path", "-ipath"} for part in words):
        return "Blocked exploratory filename discovery through find."
    return None


def block_search_binary(executable: str, words: list[str]) -> str | None:
    if executable == "rg" and any(flag in words for flag in ALLOW_RG_FLAGS):
        return None

    if looks_like_exact_literal_sweep(words):
        return None

    if executable == "rg":
        return "Blocked broad ripgrep discovery."

    return f"Blocked broad {executable} discovery."


def looks_like_exact_literal_sweep(words: list[str]) -> bool:
    non_flag_args = [word for word in words[1:] if not word.startswith("-")]

    if len(non_flag_args) < 2:
        return False

    pattern = non_flag_args[0]
    paths = non_flag_args[1:]

    if any(path in {".", "./"} for path in paths):
        return False

    if any(char.isspace() for char in pattern):
        return False

    return bool(re.fullmatch(r"[A-Za-z0-9_./:@#-]+", pattern))


if __name__ == "__main__":
    raise SystemExit(main())
