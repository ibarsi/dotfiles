#!/usr/bin/env python3
from __future__ import annotations

import difflib
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
DOCS_FILES = [ROOT / "docs" / "site-data.json", ROOT / "docs" / "site-data.js", ROOT / "README.md"]


def prose(text: str) -> str:
    """Exclude fenced code and comments, preserving line numbers for diagnostics."""
    result = []
    fence = ""
    for line in text.splitlines():
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker and not fence:
            fence = marker[1]
            result.append("")
        elif fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence):
                fence = ""
            result.append("")
        else:
            result.append(line)
    return re.sub(r"<!--.*?-->", lambda m: "\n" * m[0].count("\n"), "\n".join(result), flags=re.S)


def heading_ids(text: str) -> set[str]:
    """GitHub-style heading slugs, including suffixes for duplicate headings."""
    ids = set()
    lines = prose(text).splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$", line)
        heading = match[1] if match else None
        if heading is None and index + 1 < len(lines) and line.strip():
            if re.fullmatch(r" {0,3}(?:=+|-+)\s*", lines[index + 1]):
                heading = line.strip()
        if heading is None:
            continue
        heading = re.sub(r"<[^>]+>", "", heading).lower()
        heading = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", heading)
        base = "".join(c for c in heading if c in "-_ " or unicodedata.category(c)[0] in "LN").replace(" ", "-")
        slug = base
        suffix = 0
        while slug in ids:
            suffix += 1
            slug = f"{base}-{suffix}"
        ids.add(slug)
    ids.update(re.findall(r'<(?:a|[a-z][\w-]*)\b[^>]*\b(?:id|name)=["\']([^"\']+)["\']', prose(text), re.I))
    return ids


def markdown_targets(text: str) -> list[tuple[int, str]]:
    text = prose(text)
    text = re.sub(r"(`+)([^`]|(?!\1)`)*?\1", lambda m: " " * len(m[0]), text)
    # Inline links/images; allow a parenthesized component in a destination.
    pattern = r"!?\[[^\]\n]*\]\(\s*(<[^>]+>|(?:[^\s()]|\([^()]*\))+)"
    targets = [(text.count("\n", 0, m.start()) + 1, m[1].strip("<>")) for m in re.finditer(pattern, text)]
    # Reference definitions are destinations too, including unused definitions.
    for match in re.finditer(r"^ {0,3}\[[^]\n]+\]:\s*(<[^>]+>|\S+)", text, re.M):
        targets.append((text.count("\n", 0, match.start()) + 1, match[1].strip("<>")))
    return targets


def documentation_errors(root: Path, markdown_files: list[Path]) -> list[str]:
    errors = []
    for installer in sorted(root.glob("*/install.sh")):
        if not (installer.parent / "README.md").is_file():
            errors.append(f"{installer.parent.name}/README.md: missing documentation for installable topic")

    anchors = {}
    for path in markdown_files:
        text = path.read_text()
        targets = markdown_targets(text)
        # Agent imports are plain @path lines, rather than Markdown links.
        for match in re.finditer(r"^@([^\s]+)\s*$", prose(text), re.M):
            targets.append((prose(text).count("\n", 0, match.start()) + 1, match[1]))
        for line, target in targets:
            url = urlsplit(target)
            if url.scheme or url.netloc:
                continue
            destination = (path.parent / unquote(url.path)).resolve() if url.path else path.resolve()
            location = f"{path.relative_to(root)}:{line}"
            if not destination.exists():
                errors.append(f"{location}: missing local target {target}")
            elif url.fragment and destination.is_file() and destination.suffix.lower() == ".md":
                if destination not in anchors:
                    anchors[destination] = heading_ids(destination.read_text())
                if unquote(url.fragment) not in anchors[destination]:
                    errors.append(f"{location}: missing heading anchor {target}")
    return errors


def repository_markdown(root: Path) -> list[Path]:
    output = subprocess.check_output(
        ["git", "-C", str(root), "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        text=True,
    )
    return sorted({root / name for name in output.split("\0") if name.endswith(".md") and (root / name).is_file()})


def read_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


def main() -> int:
    errors = documentation_errors(ROOT, repository_markdown(ROOT))
    if errors:
        print("Documentation structure/link checks failed:")
        for error in errors:
            print(f"  {error}")
        return 1

    before = {path: read_text(path) for path in DOCS_FILES}
    subprocess.run([sys.executable, str(ROOT / "scripts" / "generate-docs.py")], check=True)
    after = {path: read_text(path) for path in DOCS_FILES}

    changed = [path for path in DOCS_FILES if before[path] != after[path]]
    if not changed:
        print("Documentation coverage, local links/anchors, agent imports and generated output are current.")
        return 0

    print("Generated docs were stale. Run `mise run docs-build` and keep the updated docs files.")
    for path in changed:
        print(f"\nDiff for {path.relative_to(ROOT)}:")
        diff = difflib.unified_diff(
            before[path].splitlines(),
            after[path].splitlines(),
            fromfile=f"a/{path.relative_to(ROOT)}",
            tofile=f"b/{path.relative_to(ROOT)}",
            lineterm="",
        )
        for line in diff:
            print(line)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
