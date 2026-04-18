#!/usr/bin/env python3
from __future__ import annotations

import difflib
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DOCS_FILES = [ROOT / "docs" / "site-data.json", ROOT / "docs" / "site-data.js"]


def read_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


def main() -> int:
    before = {path: read_text(path) for path in DOCS_FILES}
    subprocess.run([sys.executable, str(ROOT / "scripts" / "generate-docs.py")], check=True)
    after = {path: read_text(path) for path in DOCS_FILES}

    changed = [path for path in DOCS_FILES if before[path] != after[path]]
    if not changed:
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
