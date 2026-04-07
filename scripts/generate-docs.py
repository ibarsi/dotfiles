#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import hashlib
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
DATA_PATH = DOCS_DIR / "site-data.json"
DATA_JS_PATH = DOCS_DIR / "site-data.js"


FEATURE_NOTES = {
    "bootstrap": {
        "title": "Bootstrap workflow",
        "summary": "Installs Homebrew dependencies, creates config symlinks, applies themes, and runs macOS setup.",
        "source": "bootstrap.sh",
        "details": [
            "Installs Homebrew when missing and reuses the repo root for path-safe runs.",
            "Uses Brewfile as the package source of truth.",
            "Installs the theme, sets zsh as the default shell, and applies macOS defaults.",
        ],
    },
    "shell": {
        "title": "Modular zsh shell",
        "summary": "Loads path, zsh modules, system aliases/functions, plugin integrations, and shell quality-of-life defaults.",
        "source": "zsh/.zshrc",
        "details": [
            "Sources topic files from the repo instead of duplicating config into the home directory.",
            "Enables history sharing, cached completion, case-insensitive globbing, and tool init for zoxide, starship, and mise.",
            "Loads Codex shell completion when available.",
        ],
    },
    "plugins": {
        "title": "Shell plugin integrations",
        "summary": "Wires autosuggestions, syntax highlighting, and fzf shell integration through Homebrew-managed paths.",
        "source": "zsh/plugins.zsh",
        "details": [
            "Loads zsh-autosuggestions when installed.",
            "Loads zsh-syntax-highlighting when installed.",
            "Sources ~/.fzf.zsh for shell keybindings and completion.",
        ],
    },
    "theme": {
        "title": "Catppuccin terminal theme",
        "summary": "Installs the repository-managed shell prompt and terminal theming assets.",
        "source": "theme/install.sh",
        "details": [
            "Bootstraps the theme during setup when the installer script is present.",
            "Pairs with starship and the theme assets stored in theme/.",
        ],
    },
    "ghostty": {
        "title": "Ghostty terminal config",
        "summary": "Ships a managed Ghostty configuration with Catppuccin styling, keybindings, and shell integration defaults.",
        "source": "ghostty/config",
        "details": [
            "Symlinked into ~/.config/ghostty/config during bootstrap.",
        ],
    },
    "zed": {
        "title": "Zed editor config",
        "summary": "Stores editor settings and keybindings in-repo and links them into ~/.config/zed.",
        "source": "zed/settings.json",
        "details": [
            "Bootstrap links both settings.json and keymap.json.",
        ],
    },
    "codex": {
        "title": "Codex CLI config",
        "summary": "Maintains Codex defaults in-repo with trusted project settings and experimental workflow features.",
        "source": "codex/config.toml",
        "details": [
            "Bootstrap links ~/.codex/config.toml to the repository-managed file.",
        ],
    },
    "claude": {
        "title": "Claude Code config",
        "summary": "Stores Claude Code settings in the repo and links them into ~/.claude during bootstrap.",
        "source": "claude/settings.json",
        "details": [
            "AI doctor validates both the config path and API key presence.",
        ],
    },
    "opencode": {
        "title": "OpenCode local model config",
        "summary": "Targets a local LM Studio endpoint through the OpenAI-compatible /v1 interface.",
        "source": "opencode/opencode.json",
        "details": [
            "Bootstrap links ~/.config/opencode/opencode.json.",
        ],
    },
    "validation": {
        "title": "Validation scripts",
        "summary": "Provides deterministic checks for AI tooling and bootstrap results.",
        "source": "scripts/doctor-ai.sh",
        "details": [
            "doctor-ai checks binaries, config files, env vars, and endpoint reachability.",
            "bootstrap-verify checks expected post-bootstrap files and symlinks.",
        ],
    },
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def read_lines(path: Path) -> list[str]:
    return path.read_text().splitlines()


def shell_quote(text: str) -> str:
    return text.strip().strip('"').strip("'")


def parse_aliases(path: Path, source_kind: str) -> list[dict]:
    aliases = []
    current_group = "General"
    for line in read_lines(path):
        stripped = line.strip()
        if stripped.startswith("#") and not stripped.startswith("#!"):
            comment = stripped.lstrip("#").strip()
            if (
                comment
                and len(comment) <= 40
                and "." not in comment
                and ":" not in comment
                and "(" not in comment
                and "`" not in comment
                and "shellcheck" not in comment.lower()
                and "zsh/" not in comment
                and "system/" not in comment
                and not comment.lower().startswith(("detect ", "always ", "enable ", "print ", "clear ", "note"))
            ):
                current_group = comment
            continue
        match = re.match(r"""alias\s+([A-Za-z0-9_.-]+)=(['"])(.*)\2$""", stripped)
        if not match:
            continue
        name = match.group(1)
        command = match.group(3)
        aliases.append(
            {
                "name": name,
                "command": command,
                "group": current_group,
                "source": rel(path),
                "source_kind": source_kind,
            }
        )
    return aliases


def extract_comment_block(lines: list[str], index: int) -> str:
    comments = []
    i = index - 1
    while i >= 0:
        stripped = lines[i].strip()
        if not stripped:
            if comments:
                break
            i -= 1
            continue
        if stripped.startswith("#"):
            comments.append(stripped.lstrip("#").strip())
            i -= 1
            continue
        break
    comments.reverse()
    return " ".join(part for part in comments if part)


def parse_function_records(path: Path) -> list[dict]:
    lines = read_lines(path)
    items = []
    for index, line in enumerate(lines):
        match = re.match(r"\s*function\s+([A-Za-z0-9_-]+)\s*\(\)\s*\{", line)
        if not match:
            continue
        name = match.group(1)
        summary = extract_comment_block(lines, index) or "Shell helper."
        usage = ""
        body_lines = []
        depth = 0
        seen_open = False
        for body_line in lines[index:]:
            body_lines.append(body_line)
            depth += body_line.count("{")
            depth -= body_line.count("}")
            if "{" in body_line:
                seen_open = True
            if seen_open and depth == 0:
                break
        body = "\n".join(body_lines)
        usage_match = re.search(rf'Usage:\s*{re.escape(name)}\s+([^"\n]+)', body)
        if usage_match:
            usage = f"{name} {usage_match.group(1).strip()}"
        items.append(
            {
                "name": name,
                "summary": summary,
                "usage": usage,
                "body": body,
                "source": rel(path),
                "source_kind": "system function",
            }
        )
    return items


def parse_functions(path: Path) -> list[dict]:
    items = parse_function_records(path)
    return [{k: v for k, v in item.items() if k != "body"} for item in items]


def parse_git_aliases(path: Path) -> list[dict]:
    items = []
    lines = read_lines(path)
    in_alias_section = False
    current_summary = ""

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("["):
            in_alias_section = stripped == "[alias]"
            current_summary = ""
            continue
        if not in_alias_section:
            continue
        if not stripped:
            current_summary = ""
            continue
        if stripped.startswith("#"):
            comment = stripped.lstrip("#").strip()
            current_summary = f"{current_summary} {comment}".strip() if current_summary else comment
            continue
        match = re.match(r"([A-Za-z0-9_.-]+)\s*=\s*(.+)", stripped)
        if not match:
            current_summary = ""
            continue
        items.append(
            {
                "name": match.group(1),
                "command": match.group(2).strip(),
                "summary": current_summary or "Git alias.",
                "kind": "git alias",
                "source": rel(path),
            }
        )
    return items


def parse_git_shortcuts(alias_paths: list[tuple[Path, str]], functions_path: Path) -> list[dict]:
    items = parse_git_aliases(ROOT / "git/.gitconfig")
    git_pattern = re.compile(r"(?<![A-Za-z0-9_.-])git(?![A-Za-z0-9_.-])|\bgh\b|gitmoji")

    for path, source_kind in alias_paths:
        for alias in parse_aliases(path, source_kind):
            haystack = f"{alias['name']} {alias['command']}"
            if not git_pattern.search(haystack):
                continue
            items.append(
                {
                    "name": alias["name"],
                    "command": alias["command"],
                    "summary": f"{alias['source_kind']} from {alias['group']}",
                    "kind": alias["source_kind"],
                    "source": alias["source"],
                }
            )

    for func in parse_function_records(functions_path):
        haystack = func["body"]
        if not git_pattern.search(haystack):
            continue
        items.append(
            {
                "name": func["name"],
                "command": func["usage"] or func["name"],
                "summary": func["summary"],
                "kind": "function",
                "source": func["source"],
            }
        )

    return sorted(items, key=lambda item: (item["kind"], item["name"]))


def parse_tasks(path: Path) -> list[dict]:
    tasks = []
    current_name = None
    current_description = ""
    current_run: list[str] = []
    in_run_block = False
    for raw in read_lines(path):
        line = raw.strip()
        section = re.match(r"\[tasks\.([A-Za-z0-9_-]+)\]", line)
        if section:
            if current_name:
                tasks.append(
                    {
                        "name": current_name,
                        "description": current_description,
                        "run": current_run,
                        "source": rel(path),
                    }
                )
            current_name = section.group(1)
            current_description = ""
            current_run = []
            in_run_block = False
            continue
        if not current_name:
            continue
        desc_match = re.match(r'description\s*=\s*"(.*)"', line)
        if desc_match:
            current_description = desc_match.group(1)
            continue
        if line.startswith("run = ["):
            in_run_block = True
            continue
        if line.startswith("run = "):
            current_run = [shell_quote(line.split("=", 1)[1])]
            continue
        if in_run_block:
            if line == "]":
                in_run_block = False
                continue
            cmd_match = re.match(r'"(.*)"[,]?$', line)
            if cmd_match:
                current_run.append(cmd_match.group(1))
    if current_name:
        tasks.append(
            {
                "name": current_name,
                "description": current_description,
                "run": current_run,
                "source": rel(path),
            }
        )
    return tasks


def parse_bootstrap_links(path: Path) -> list[dict]:
    links = []
    for line in read_lines(path):
        match = re.search(r'ln -sf "\$DOTFILES_ROOT/([^"]+)" "\$HOME/([^"]+)"', line)
        if match:
            source_path = match.group(1)
            target_path = "~/" + match.group(2)
            links.append(
                {
                    "source_path": source_path,
                    "target_path": target_path,
                    "source": rel(path),
                }
            )
    return links


def parse_brewfile(path: Path) -> dict:
    brews = []
    casks = []
    taps = []
    for line in read_lines(path):
        stripped = line.strip()
        if stripped.startswith("tap "):
            taps.append(shell_quote(stripped.split(" ", 1)[1]))
        elif stripped.startswith("brew "):
            brews.append(shell_quote(stripped.split(" ", 1)[1]))
        elif stripped.startswith("cask "):
            casks.append(shell_quote(stripped.split(" ", 1)[1]))
    return {"taps": taps, "brews": brews, "casks": casks}


def build_features() -> list[dict]:
    entries = []
    for slug, note in FEATURE_NOTES.items():
        entries.append(
            {
                "slug": slug,
                "title": note["title"],
                "summary": note["summary"],
                "details": note["details"],
                "source": note["source"],
            }
        )
    return entries


def git_revision() -> str:
    try:
        return (
            subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True)
            .strip()
        )
    except Exception:
        return "unknown"


def source_hash(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(rel(path).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()[:12]


def main() -> None:
    alias_sources = [
        (ROOT / "system/.aliases", "system alias"),
        (ROOT / "zsh/aliases.zsh", "zsh alias"),
    ]
    aliases = []
    for path, source_kind in alias_sources:
        aliases.extend(parse_aliases(path, source_kind))
    aliases.sort(key=lambda item: item["name"])

    functions = parse_functions(ROOT / "system/.functions")
    functions.sort(key=lambda item: item["name"])
    git = parse_git_shortcuts(alias_sources, ROOT / "system/.functions")

    tasks = parse_tasks(ROOT / "mise.toml")
    tasks.sort(key=lambda item: item["name"])

    bootstrap_links = parse_bootstrap_links(ROOT / "bootstrap.sh")
    bootstrap_links.sort(key=lambda item: item["target_path"])

    packages = parse_brewfile(ROOT / "Brewfile")

    docs = {
        "git_revision": git_revision(),
        "source_hash": source_hash(
            [
                ROOT / "Brewfile",
                ROOT / "bootstrap.sh",
                ROOT / "git/.gitconfig",
                ROOT / "mise.toml",
                ROOT / "system/.aliases",
                ROOT / "system/.functions",
                ROOT / "zsh/aliases.zsh",
                ROOT / "zsh/plugins.zsh",
                ROOT / "scripts/doctor-ai.sh",
                ROOT / "scripts/bootstrap-verify.sh",
            ]
        ),
        "stats": {
            "aliases": len(aliases),
            "functions": len(functions),
            "git": len(git),
            "features": len(FEATURE_NOTES),
            "tasks": len(tasks),
            "bootstrap_links": len(bootstrap_links),
            "brews": len(packages["brews"]),
            "casks": len(packages["casks"]),
        },
        "aliases": aliases,
        "functions": functions,
        "git": git,
        "features": build_features(),
        "tasks": tasks,
        "bootstrap_links": bootstrap_links,
        "packages": packages,
    }

    DOCS_DIR.mkdir(exist_ok=True)
    serialized = json.dumps(docs, indent=2) + "\n"
    DATA_PATH.write_text(serialized)
    DATA_JS_PATH.write_text(f"window.DOTFILES_DOCS_DATA = {serialized};")


if __name__ == "__main__":
    main()
