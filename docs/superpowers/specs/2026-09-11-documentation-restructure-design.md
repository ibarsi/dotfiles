# Documentation Restructure — Design

**Date:** 2026-09-11
**Status:** Approved, pending implementation plan

## Problem

`README.md` has grown to 621 lines across 24 sections, covering everything from
installation to Codex configuration to NVMe benchmarking. The repository now
targets two platforms that are used daily as peers: macOS and Omarchy (Arch).

The concrete failure, as stated by the repo owner, is applicability:

> Reading a section, I cannot tell whether it is live on the machine in front of me.

This is not primarily a findability problem. Only one section (Hardware
Benchmarking, 56 lines) is wholly platform-specific. The remaining 23 are shared
content carrying incidental platform asides, and it is that scattering — not the
volume — that makes applicability unreadable.

### Current state

| Fact | Value |
|------|-------|
| `README.md` | 621 lines, 24 sections |
| Topics with an `install.sh` | 20 |
| Topics installed by `bootstrap.sh` (macOS) | 20 (it globs `*/install.sh`) |
| Topics installed by `bootstrap-omarchy.sh` | 5 |
| Sections that are wholly platform-specific | 1 |
| Documents stating which topics are live where | 0 |

`bootstrap-omarchy.sh` installs `bash`, `git` (aliases only), `gitmoji`, `tmux`,
and `voice-to-text`. The other 15 topics have configuration in this repository
that is never linked on Omarchy. This is intentional — those tools are managed
natively on Omarchy — but no document says so, which is exactly the ambiguity.

### Constraints discovered

- `scripts/generate-docs.py` does **not** read `README.md`. It builds
  `docs/site-data.{json,js}` from source files. Restructuring prose is therefore
  generator-safe.
- `FEATURE_NOTES` in `scripts/generate-docs.py` is a hand-maintained dict of 14
  features. README has a separate hand-maintained Features list of ~25 bullets.
  Two lists of the same thing, in two languages, synced by hand.
- `docs/` is served as a static site by `mise run docs-serve`.
- `mise run docs-check` already fails the build when generated data is stale.
  This is the enforcement hook the design relies on.

## Goals

1. Any reader can determine, for any topic, whether it applies to macOS,
   Omarchy, or both — without reading prose.
2. That determination is derived from the code that performs the installation,
   so it cannot drift.
3. Shared content is platform-neutral by construction, not by convention.
4. Neither platform is privileged as the default. They are peers.

## Non-goals

- Wiring the 15 unlinked topics into `bootstrap-omarchy.sh`. They are
  intentionally macOS-only; the matrix records this without implying a TODO.
- Splitting shared workflow content into per-topic files. Findability is not the
  reported pain. If it becomes the pain, split then.
- Redirects or anchor-compatibility shims for moved sections.

## Design

### 1. File layout

```
README.md                    ~130 lines, landing page
docs/guides/macos.md         macOS-specific
docs/guides/omarchy.md       Omarchy-specific
docs/guides/workflows.md     shared, platform-neutral
```

Guides live in `docs/guides/` rather than `docs/` so hand-written prose is never
confused with the generated site assets (`index.html`, `app.js`, `site-data.*`)
that already occupy `docs/`.

**The governing rule**, which makes the structure self-enforcing:

> Content in `workflows.md` must be platform-neutral. A platform caveat that
> fits on one line may stay as a `**macOS:**` / `**Omarchy:**` aside. Anything
> longer belongs in a platform guide.

### 2. Content mapping

Every current section has an explicit destination. Line counts are current.

**README.md** (landing)

| Section | Treatment |
|---------|-----------|
| Installation (20) | Rewritten: both platforms side by side, pointing at the guides |
| Quick Commands (20) | Kept as-is |
| Structure (24) | Kept as-is |
| Features (32) | Generated from `FEATURE_NOTES` (Phase D); stays hand-written if D is dropped |
| *(new)* Platform matrix | Generated (Section 3) |

**docs/guides/macos.md**

| Source | Notes |
|--------|-------|
| Obsidian Workflow (12) | macOS app |
| Extracted from Installation | Homebrew install, `brew bundle`, `chsh` to zsh |
| Extracted from Features | macOS keyboard tuning, Caps Lock remap |
| Extracted from Structure | `macos/`, `launchagents/` |

**docs/guides/omarchy.md**

| Source | Notes |
|--------|-------|
| Hardware Benchmarking (56) | `benchall`; Arch/tmpfs/pacman specifics |
| Extracted from Installation | `bootstrap-omarchy.sh` additive behaviour |
| Extracted from Structure | VoxType systemd timer, Gitmoji on Linux |

**docs/guides/workflows.md** — the remaining 18 sections (~429 lines): Docs Site,
Ghostty, cmux, Markdown, tmux, SSH, Networking, Kubernetes, FZF, Git Worktree,
AI Diagnostics, Pre-commit, Mise, Local Environment Conventions, Codex, Claude,
Agy, Zed.

`workflows.md` remains large. That is acceptable and deliberate: its size is no
longer the problem, because every line in it applies to both platforms.

### 3. Generated platform matrix

The component that must not rot.

**Inputs**

- `bootstrap.sh` — globs `*/install.sh`, so macOS support is *derived*: every
  topic with an `install.sh` is macOS-supported. Adding a topic requires no
  matrix edit.
- `bootstrap-omarchy.sh` — explicit lines of the form
  `bash "$DOTFILES_ROOT/<topic>/<script>.sh"`. Parsed for topic names.
- `*/install.sh` — presence defines the topic set (currently 20).

**Three states**, because `git` is genuinely partial:

| State | Meaning |
|-------|---------|
| `✅` | Installed by that platform's bootstrap |
| `◐ <detail>` | Partially installed, e.g. `git` → `◐ aliases only` |
| `— macOS only` | Not wired on Omarchy, intentionally |

Partial states cannot be derived from a glob; `bootstrap-omarchy.sh` references
`git/install-aliases.sh` rather than `git/install.sh`. Rule: when the referenced
script is not `install.sh`, the topic is partial, and the detail text comes from
an explicit table in the generator rather than from string munging:

```python
PARTIAL_DETAIL = {"install-aliases.sh": "aliases only"}
```

If a partial installer appears that is not in the table, the generator raises
rather than inventing a label. There is currently exactly one such case, and a
silent wrong label is worse than a failed build.

**Output** — written into `README.md` between markers, matching the existing
generated-data convention:

```markdown
<!-- BEGIN GENERATED: platform-matrix -->
| Topic | macOS | Omarchy |
|-------|-------|---------|
| bash | ✅ | ✅ |
| git | ✅ | ◐ aliases only |
| zed | ✅ | — macOS only |
<!-- END GENERATED: platform-matrix -->
```

The same structure is added to `site-data.json` under a `platforms` key so the
docs site can render it.

### 4. Remove the FEATURE_NOTES duplication (Phase D)

Separable; may be cut without affecting Phases A, B, or C.

1. Migrate the ~11 features present in README but absent from `FEATURE_NOTES`
   into `FEATURE_NOTES`.
2. Generate README's Features section from `FEATURE_NOTES` between
   `<!-- BEGIN GENERATED: features -->` markers.
3. `FEATURE_NOTES` becomes the single source; the docs site and README can no
   longer disagree.

### 5. Enforcement

`scripts/check-docs.py` gains two assertions:

1. The matrix embedded in `README.md` matches a freshly generated one.
2. Every directory containing an `install.sh` appears in the matrix.

Assertion 2 is the one that catches the realistic failure: adding a topic to
`bootstrap-omarchy.sh` without regenerating docs fails `mise run docs-check`.

`AGENTS.md` currently instructs agents to "Update README when user-facing
behavior changes." This must be reworded to name the correct destination guide,
or agents will keep appending to `README.md` and undo the restructure.

## Testing

| Check | Method |
|-------|--------|
| Matrix correctness | Assert generated matrix lists 20 topics, 5 Omarchy-supported, `git` partial |
| Staleness detection | Add a topic line to `bootstrap-omarchy.sh` in a temp copy; `check-docs.py` must fail |
| Topic coverage | Assert every `*/install.sh` dir appears in the matrix |
| No regression | `mise run check`, `mise run docs-check`, `mise run lint-shell` stay green |
| Link integrity | Every `docs/guides/*.md` link in README resolves to an existing file |

## Risks

| Risk | Mitigation |
|------|------------|
| Section anchors break | Accepted. Personal repo; no external inbound links. |
| Content lost while moving 621 lines | Section-level checklist: all 24 current headings must be accounted for in the Section 2 mapping, and each verified present in its destination before README is trimmed. Total line count is expected to *grow* (~700) from the matrix and cross-links, so line count is not a useful loss signal. |
| Emoji in the matrix renders poorly in some terminals | `✅ ◐ —` are widely supported; the text detail beside `◐` and `—` carries the meaning regardless. |
| `workflows.md` becomes the new dumping ground | The governing rule in Section 1 plus the reworded `AGENTS.md` are the controls. |

## Implementation order

Phases are lettered to avoid collision with the section numbers above.

| Phase | Work | Spec section |
|-------|------|--------------|
| **A** | Create the three guides; move content; shrink README. No generator changes. Verify no section lost. | 1, 2 |
| **B** | Matrix generation in `generate-docs.py`; markers in README; `site-data.json` key. | 3 |
| **C** | `check-docs.py` assertions; reword `AGENTS.md`. | 5 |
| **D** | FEATURE_NOTES dedup. Optional; last, being cleanup rather than restructure. | 4 |

Phases A, B, and C are the approved scope. Phase D is adjacent cleanup and may
be dropped.
