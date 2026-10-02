# Documentation

Handwritten documentation lives beside the configuration it describes. This folder owns the generated reference site and the documentation maintenance rules.

## Ownership and navigation

- Every installable topic has a `README.md` covering purpose, platform support, managed files, installation, usage and verification.
- Keep short topics in one README. Put larger workflows under the owning topic’s `docs/` directory and link them from its README.
- Document each workflow once. Cross-link related topics even when its helpers are implemented in `system/.functions`.
- [macOS](../macos/README.md) and [Omarchy](../omarchy/README.md) explain bootstrap and link to topic setup; detailed tool behavior belongs to its topic.
- The root [README](../README.md) is the entry point: installation, quick commands, topic index and generated platform matrix.
- Historical decisions belong under the owning topic’s `docs/research/` or `design/archive/`, with a date and explicit historical status.
- Keep `AGENTS.md` and `CLAUDE.md` at the root for agent discovery; shared RTK guidance lives under [.rtk](../.rtk/README.md).

Use relative Markdown links to real files and headings. Commands assume the repository root unless stated otherwise. Link to checked-in config rather than maintaining another exhaustive copy of volatile settings.

## Docs Site

The static app inventories aliases, functions, Git shortcuts, mise tasks, bootstrap links, feature summaries and platform support from repository sources. Handwritten topic READMEs are browsed through the [repository index](../README.md#structure) or `mdf`; the site remains the generated command reference.

- Generator: [scripts/generate-docs.py](../scripts/generate-docs.py)
- Generated outputs: `site-data.json`, `site-data.js`, root README platform matrix
- Site sources: [index.html](index.html), [app.js](app.js), [styles.css](styles.css)

Refresh after aliases, functions, tasks, installers or feature summaries change:

```bash
mise run docs-build
mise run docs-check
```

Serve locally from the repository root:

```bash
mise install
mise run docs-serve
```

Open `http://localhost:4173`. From any directory, `dotdocs` starts the server if needed and opens the same URL.

## Validation

`mise run docs-check` checks generated output freshness, README coverage for every `*/install.sh` topic, local Markdown links and heading anchors, and agent `@` imports. It includes tracked and nonignored new Markdown files so new docs are checked before staging. It does not fetch external URLs.

Run the full [repository validation](../scripts/README.md#required-validation) before submitting changes. The link checker has [fixture tests](../scripts/README.md#checker-tests).

## Historical design

The [previous platform-guide design](design/archive/2026-09-11-documentation-restructure-design.md) is superseded by topic ownership. It is retained as historical context, not current maintenance guidance.
