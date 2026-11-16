# Agent code review in Herdr

Research snapshot: 2026-11-14. Recommendation and implementation proposal, not an installed feature. Based on repository inspection, current upstream documentation, Context7, web searches and source inspection. No candidate was installed or tested with a live agent; no Omarchy or SSH review was exercised.

## Recommendation

For the stated requirement—read agent-authored explanations beside changed code, leave human notes, and receive agent replies—use **Hunk inside a normal Herdr terminal pane or review tab, with a small Herdr adapter**. Start from the existing [Hunk Pane desktop mod](https://github.com/jobace78/herdr-hunk-pane), but treat it as a prototype/reference rather than adopting its delivery behavior unchanged. Hunk already owns the specialized review renderer and attributed note/reply model. Reimplementing that renderer in GPUI would create a second review application to maintain.

If durable feedback, SSH worktrees and GitHub review threads matter more than agent-authored inline explanations, **Herdr Annotator is the stronger ready-made choice**. Its current model does not satisfy the full two-way annotation requirement. Do not install both as competing stores of the same local review.

## What the local setup implies

Inspected [Herdr documentation](../../README.md), [installer](../../install.sh), [keys](../../keys.json), [indicator implementation](../../mods/my-spaces/indicators.js), [mod API snapshot](../../upstream/herdr.d.ts), and [Git worktree workflow](../../../git/README.md). Also read the installed `my-main` layout and shipped Changes/Tabs mods without changing them.

- This setup uses **Herdr App and herdr-core**, distinct from the older `herdr` TUI and its plugin/config system. The installed personal layout was generated from app 0.1.15.
- `my-spaces` supplies worktree grouping, agent urgency bars, PR/CI/review indicators and connected-machine port information. These already provide the workspace overview; the missing piece is reviewing actual changes and exchanging contextual feedback.
- The personal layout retains the shipped Files/Changes stack in a hidden, initially 368px-wide panel. A full review tab or zoomable pane is a better primary reading surface than squeezing a split diff into that width.
- Parallel worktrees and agents mean a review must bind to machine, exact checkout, comparison and source terminal. A repo name or whichever agent currently has focus is insufficient.
- `install.sh` regenerates `my-main` from shipped `main`, replacing Spaces. A manual review block added only to the generated layout would disappear on reinstall. Any adopted integration needs a corresponding tracked installer transformation.
- Tracked mod files, reproducible bootstrap, palette-derived colors and `herdr-update` API checks are established patterns. Hunk is not currently declared in the inspected Brewfile or mise manifest.

Earlier workflow context treats Superpowers as the planning/building default; this proposal adds a review surface without changing that methodology. That preference is from prior context, not a new audit of the installed Superpowers version.

## Candidate comparison

| Candidate | Agent explanations and replies | Human feedback | Fit here |
| --- | --- | --- | --- |
| Hunk + desktop Hunk Pane | Hunk supports agent notes and replies | Wrapper forwards user notes automatically | Closest functional match; adapter needs delivery, storage and routing work |
| Herdr Annotator | No distinct local author/reply model found | Explicit batch send, persistent notes, stale-anchor checks | Best ready-made native feedback tool, especially for SSH/GitHub |
| Herdr Code Review | No documented agent-authored annotation protocol | Saved line/range comments sent to an agent | Useful broader Source Control UI; does not close the agent-note gap |
| Older Hunk/review TUI plugins | Varies | Several offer feedback handoff | Reference implementations; not desktop mods |
| Redpen | Displays Claude's prose response | Block comments on that response | Complement for plans/explanations, not code-diff review |

### Hunk

[Hunk's comment documentation](https://www.hunk.dev/docs/agents/comments-and-annotations/) distinguishes agent comments, launch-time sidecar annotations and human notes. Agents can attach explanations to changed lines and reply to a particular note. Humans create notes in the viewer. Hunk's documented CLI exposes review/comment inspection, so an adapter can collect feedback without scraping the screen. Hunk renders notes; a separate coding agent supplies explanations and makes requested edits.

[Live session control](https://www.hunk.dev/docs/agents/live-session-control/) selects a worktree with `--repo`, or a session ID when that is ambiguous. The daemon listens on loopback and requires a private local credential. Therefore the straightforward remote design runs Hunk and the coding agent on the same remote machine, with Herdr displaying the terminal. A remote agent cannot simply reach the desktop machine's loopback daemon.

**Review content is session-local.** Closing Hunk discards notes. Its persistent application-state file is not review storage. The [review store](https://github.com/modem-dev/hunk/blob/0147a846951627b88f8ddc178e0d23ca58cece76/packages/hunk/src/core/review/store.ts) is in memory. The documented `session review --include-notes --json` export permits an external journal; it is not evidence of automatic restoration. Agent-side launch annotations can be stored separately, but that does not establish full thread round-tripping.

The [README](https://github.com/modem-dev/hunk) documents native Git working-tree/watch reviews, an agent review skill and reusable OpenTUI components. Those components are terminal UI components, not native Herdr GPUI widgets. Running Hunk in a Herdr terminal is the natural integration boundary. Agents must be told to annotate meaningful decisions; opening a viewer alone produces no explanation. Agent notes initially need to be revealed with `a`.

### Existing desktop Hunk Pane

[Hunk Pane's recipe](https://github.com/jobace78/herdr-hunk-pane/blob/55a1dca6132e30a0e0efe8b53c99de1bd920cd30/RECIPE.md) describes a desktop mod, a Python launcher and one Hunk terminal per tab. It generates a synthetic patch for the selected repository every three seconds, including untracked files. Notes route to the terminal that most recently registered that repository. Its prompt requests replies in the Hunk thread. It was tested by its author on macOS with Herdr 0.1.15 and Hunk 0.25.0; Linux is explicitly untested.

The same recipe explicitly identifies adoption limits:

- Reviews cover uncommitted changes against HEAD, rather than the complete committed feature branch.
- Human notes send automatically when the recipient becomes available; an edited note sends again. There is no explicit complete-review submission step.
- It reads an undocumented nested field of `session list` output. Prefer documented review/comment commands in an owned adapter.
- Deduplication is per Herdr window; multiple clients can send duplicates.
- Notes disappear with the Hunk process. A reboot does not restore it as a review session.
- The launcher/patch generator assume local paths; no machine-aware remote execution was found in the inspected source.
- The author documents a race in which a send can reach a shell after the agent exits. Text sanitization also changes comment contents.

These are reasons to reuse its approach selectively, not call it a complete durable review system. Its copy-based asset installation also differs from this repository's current symlink pattern and must be verified before choosing installation wiring.

### Herdr Annotator

The [README](https://github.com/jakub-tucek/herdr-annotator) and [guide](https://github.com/jakub-tucek/herdr-annotator/blob/ced943905c7823cc3837cbdf6118e676de9f34f2/docs/guide.md) describe native sidebar/full-tab review, branch/last-commit/uncommitted scopes, SSH worktrees, explicit batch delivery to the source session and GitHub review-thread handling. These fit the current PR-aware workspace well.

The guide documents atomic, mode-0600 JSON storage with per-worktree locks on the app machine. Identity includes machine, checkout and comparison; stale notes are excluded from sending. Delivery uncertainty is recorded rather than silently retried. Remote reads need no helper installation on the remote host. Saved reviews do not automatically synchronize across app machines.

The gap is semantic: the inspected [request/comment model](https://github.com/jakub-tucek/herdr-annotator/blob/ced943905c7823cc3837cbdf6118e676de9f34f2/src/model.rs) has a JSON `add` interface but no separate author/provenance or reply-parent fields for local comments. The export treats comments as human-requested fixes. Calling that interface from an agent would not establish a supported, attributed agent-explanation thread. GitHub threads are a separate feature.

If choosing Annotator as the foundation, extend it upstream with comment provenance, replies and separate explanation/fix queues. This could eventually be the better native product, but it is substantive model/UI work rather than enabling an existing option.

Its installer also installs a private Tabs integration. Here that must compose with the generated personal layout and `my-spaces`. Its built-in updater modifies its own clone/install; tracked local changes need a deliberate update policy. Optional logical file ordering sends bounded code samples to an AI provider and incurs normal model usage; ordinary local review does not require that feature.

### Other options checked

[Herdr Code Review](https://github.com/sangit0/herdr-code-review) offers persistent inline human feedback plus branch switching, staging, commit/history and push/pull controls. It documents stale snapshot warnings and delivery to agents inside Herdr, rather than external Codex desktop chats. It adds more Git-management UI than this task requires, and its documented feedback loop does not include agent-authored explanations. Its own README still calls out live delivery as needing end-to-end verification.

[jhochenbaum/herdr-hunk-diff](https://github.com/jhochenbaum/herdr-hunk-diff) is a particularly relevant older-TUI reference: it documents human-note collection, associated-agent delivery and periodic unsent-note snapshots. [quantk/herdr-review](https://github.com/quantk/herdr-review) now uses its own review renderer and drafts human feedback without submitting it. Both use the older TUI plugin system. [JonasBaeumer/herdr-file-annotator](https://github.com/JonasBaeumer/herdr-file-annotator) provides an MCP review/verdict protocol, also in the TUI ecosystem. These are not direct desktop mod installations.

[Redpen](https://github.com/imutaroh/herdr-redpen) reviews Claude's latest response block by block and sends feedback through a transcript-hook integration. It is relevant if the desired annotations are on plans or explanations, but does not replace annotations on code changes.

## Proposed bounded implementation

First prove a single local worktree review with Hunk in a normal Herdr terminal, its documented agent skill and no automatic delivery. Ask the agent to annotate a few consequential choices, add human feedback, have the agent read it explicitly and reply in the same thread. Include a committed change in the comparison so the pilot does not prove only an uncommitted workflow.

If that reading experience is useful, implement a thin tracked adapter:

1. A Review action opens/reuses a review terminal pinned to machine, checkout, comparison, Hunk session and source agent. Prefer direct Git-backed Hunk reviews over the existing wrapper's synthetic multi-repository patch. Use a dedicated review tab when width is limited.
2. Show pending human comments and provide explicit Send review, or initially copy/draft a prompt. Keep agent explanations out of the human fix queue. Preserve source text exactly and record uncertain delivery without automatic resend.
3. Journal notes and delivery receipts outside source repos, across all clients. Save enough context to show stale feedback as stale after edits. Export is the first milestone; full reopen/thread restoration is a separate capability to prove before claiming durability.
4. Run remote Hunk and agent together via the appropriate core machine. Verify session discovery, executable availability and worktree identity before claiming Omen support.
5. Track dependency installation, layout transformation and adapter assets in `herdr-app/`; integrate with existing update checks. Keep the workspace sidebar independent.

Do not build a GPUI diff renderer, browser embedding layer, new MCP service or automatic review gate for the initial pilot. The existing CLI is sufficient to validate the interaction.

Adoption checks: correct routing with two agents/two worktrees; no send to a blocked/terminated/wrong agent; branch comparisons; comments surviving journal export and unexpected close; code changes producing stale anchors; two-window duplicate prevention; native runtime checks; then separate macOS, Omarchy and remote verification. Performance and large-repository behavior remain unmeasured.

## Privacy and evidence limits

Treat any installed mod as executable code with the user's access: [Herdr's security documentation](https://github.com/herdrdev/herdr-app/blob/master/docs/security.md) explicitly includes program execution, network and connected-machine access. A local viewer does not remove the existing coding agent's provider data flow. Sending review text to that agent sends the attached code context through its configured model workflow. GitHub posting and optional Annotator AI ordering have separate external data flows.

Upstream snapshots inspected: Hunk `0147a846951627b88f8ddc178e0d23ca58cece76`; Annotator `ced943905c7823cc3837cbdf6118e676de9f34f2`; Hunk Pane `55a1dca6132e30a0e0efe8b53c99de1bd920cd30`; Herdr Code Review `2233079816eef5f5b1e11ce5dc38262a7c379e0b`. Gallery descriptions and star counts were discovery aids, not maturity evidence. This assessment establishes architectural fit and documented/source-level limits, not runtime reliability or measured resource usage.
