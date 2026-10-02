# scripts

Repository maintenance scripts and validation. Run commands from the repository root.

## AI Diagnostics

Scripts under `scripts/`:

- `doctor-ai.sh` → checks binaries, config presence, and env presence
- `bootstrap-verify.sh` → validates expected post-bootstrap symlinks/files

## Deterministic Checks (Pre-commit)

Optional pre-commit config is included in `.pre-commit-config.yaml`:

- merge conflict checks
- trailing whitespace / EOF hygiene
- `shellcheck`
- `shfmt`
- `gitleaks` secret scanning on staged changes

Setup:
```bash
pre-commit install
pre-commit run --all-files
```

## Required validation

From the repository root:

```bash
mise run check
mise run docs-check
mise run ai-doctor
mise run bootstrap-verify
```

`check` runs shell lint, formatting, documentation checks and shell syntax validation. `verify` runs AI doctor plus bootstrap verification. These inspect the current host; bootstrap verification does not install missing configuration.

## Dependency updates

[Dependabot](../.github/dependabot.yml) checks the hook revisions in
[.pre-commit-config.yaml](../.pre-commit-config.yaml) every Monday at 09:00
America/Toronto, after a seven-day release cooldown. Minor and patch updates
share a PR; major updates get individual PRs. At most three version-update PRs
stay open, assigned to `ibarsi`.

Review release notes and run `mise run precommit-run` plus the required validation
above before merging. The configuration does not enable automatic merging. Hook
updates can change formatting and lint behavior, including on major releases.

The configuration takes effect once it reaches the repository's default branch.
Dependabot currently supports
[pre-commit version updates, but not security updates](https://github.com/github/docs/blob/main/data/reusables/dependabot/supported-package-managers.md).
Weekly updates help keep hooks current; they do not provide vulnerability-triggered
fixes or guarantee that a release is safe.

Dependabot's [supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
do not include Homebrew or mise. Keep installed packages current through the
existing [`upall` workflow](../system/README.md), and review pinned tool versions in
[mise.toml](../mise.toml) separately. Add other Dependabot ecosystems when their
manifests are checked in; this repository currently has no GitHub Actions workflows
or application package manifests.

## Documentation automation

[generate-docs.py](generate-docs.py) builds site data and the root README platform matrix. [check-docs.py](check-docs.py) checks generated freshness, README coverage for installable topics, local Markdown links and anchors, and agent document imports. See the [docs maintenance guide](../docs/README.md).

## Checker tests

```bash
python3 -m unittest discover -s scripts -p 'test_check_docs.py'
```

Tests use temporary fixtures and do not change live configuration.

## Verification

Use the required validation commands above after changes. Inspect failures against the specific host or source file before changing unrelated configuration.

## Related documentation

[mise tasks](../mise/README.md) · [Documentation conventions](../docs/README.md)

[Repository index](../README.md)
