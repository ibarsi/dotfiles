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
