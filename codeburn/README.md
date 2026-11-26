# CodeBurn

Employment Vertex pricing in USD, applied at current contract rates to all matching
history. Personal GPT and Grok usage retains CodeBurn's default pricing. The CLI is
installed through [mise](../mise/README.md) and updated by [aiup](../zsh/README.md#updates).

These rates feed herdr-app's [Code Burn panel](../herdr-app/README.md#code-burn-panel),
which shows what they add up to across devices and agents.

## Pricing evidence

[global-pricing.json](global-pricing.json) records rates derived from the billing
CSV exported on 2026-11-16, covering August through November 2026, cross-checked
against a second CSV exported 2026-11-18 covering November 1-18. Prices are USD
per million tokens, calculated from unrounded subtotal divided by usage. Account
identifiers, billing totals and the raw export are not tracked. These are historical
effective rates, not an automated feed of future contract changes.

The catalog distinguishes executable overrides, native Haiku context tiers and
reference-only Gemini standard/priority rates. Gemini reference prices already
include the observed contract savings; another 50% discount would double-discount
them. Gemini 4 Carbon and Gemini 4 Hydrogen are installed as flat overrides: both
exports show priority-tier billing exclusively (0 standard-tier dollars), so one
rate prices them correctly. Gemini 4 Argon and 3.8 Flash mix standard and priority
traffic under the same model name and stay reference-only, since CodeBurn's Gemini
parser can't tell which tier a given call billed at — a flat override would
misprice whichever tier isn't chosen. Gemini 4 Neon is the exception to
that rule. It mixes tiers (about 72% priority spend in November), but it is
installed at a blended rate: spend divided by tokens for each token kind in the
2026-11-25 export. That rate reproduces November exactly and drifts if the tier
mix changes, so re-derive it from each export. Without it, the panel showed
Neon at 1/23 of its billed cost. Small Flash Lite samples need a pricing-table
export before their exact rates can be configured.

## Apply the verified subset

`bootstrap.sh` (macOS) and `bootstrap-omarchy.sh` (Omen) both run
[install.sh](install.sh), which applies the verified subset idempotently. A refusal
(existing flat Haiku override or discount) warns instead of failing bootstrap. The
rates assume the employment Vertex account with **global endpoints**. To run by hand:

```bash
python3 codeburn/configure-pricing.py
python3 codeburn/configure-pricing.py --apply
python3 codeburn/configure-pricing.py --check
codeburn price-override --list
codeburn models --period all
```

The first command previews. Applying merges the verified flat model rates
into `~/.config/codeburn/config.json`, preserving unrelated configuration. Existing
files receive a timestamped backup; unchanged files are not rewritten. Restore the
backup to undo an update, or remove the catalog keys from `priceOverrides`
if the config did not exist beforehand. Re-running bootstrap is safe.

## Background sharing

[install.sh](install.sh) also keeps `codeburn share --always` running so paired
devices can reach this one: a systemd user unit (`codeburn-share.service`) on
Omarchy and a launchd agent (`dev.ibarsi.codeburn-share`) on macOS. Both call the
mise `latest` install symlink (the shim fails outside a mise-activated directory),
so CLI updates need no change. Pairing stays manual (`codeburn share --pair`).

```bash
systemctl --user status codeburn-share   # Omarchy
launchctl list | grep codeburn-share     # macOS
```

## Accuracy boundaries

Verified against CodeBurn 0.9.28:

- Native flat overrides disable long-context tiers. Haiku 5.5 therefore retains
  CodeBurn's tiered pricing, whose bundled global rates match the catalog. The
  applicator refuses an existing flat Haiku 5.5 override.
- Claude one-hour cache writes cost 1.6 times the configured five-minute rate
  when the logs retain the duration split. Opus 5.5 is thus $5/1M for five minutes
  and $8/1M for one hour. Missing metadata cannot be recovered from aggregate tokens.
- The Gemini CLI parser always reports standard service. One model override cannot
  distinguish its standard and priority requests, so Argon and 3.8 Flash — which
  both bill at a mix of tiers — stay reference-only until the actual service tier
  and raw model-to-SKU mappings can be established. Carbon and Hydrogen are the
  exception: two independent exports show them billing exclusively at the
  priority tier, so a flat override at that rate is installed for both. In
  particular, local 3.5/3.6/3.7 Flash IDs are not assumed to mean billed 3.8 Flash.
- CodeBurn stores each Antigravity call's cost when it first parses the call,
  in two caches. A new or changed override does not reprice those calls. After
  `--apply`, remove both Antigravity caches so CodeBurn parses again:

  ```bash
  rm ~/.cache/codeburn/antigravity-results.v*.json ~/.cache/codeburn/session-cache.v*/antigravity.*
  ```

  If you remove only one of them, CodeBurn keeps the old costs. A rebuild only
  reprices conversations whose files still exist.
- Antigravity CLI before 1.5.15 deleted all but the 500 most recent conversations
  at startup, and CodeBurn drops cached calls whose conversation file is gone.
  CodeBurn therefore has no Omen Antigravity history before 2026-11-18. Later
  versions keep all conversations. If you delete old conversations, their
  history also leaves CodeBurn, so delete them only after a billing month is
  reconciled.
- Pi can retain agent-recorded costs. Native overrides do not guarantee that every
  Pi history entry is repriced. Compare a known session before treating its total
  as a contract-cost estimate.
- Models not covered by the billing evidence retain defaults, including older
  Claude models. Model-based overrides also affect other agents using those same
  model IDs; they do not filter by billing project or route.
- Global rates apply to matching historical US calls under the chosen current-rate
  policy. Review pricing before migrating to US endpoints; the catalog is not a US
  profile. Changing endpoints does not automatically change these overrides.

This is a verified partial native configuration, not complete invoice reconciliation.
Priority attribution, unrecorded endpoint metadata and Pi's recorded costs require
collector/upstream work for comprehensive repricing.

## Verification

```bash
python3 -m unittest discover -s codeburn -p 'test_*.py'
python3 codeburn/configure-pricing.py --check
```

The tests exercise the installed CLI on isolated synthetic logs, including cache
lifetimes, context thresholds and retention of personal-model pricing.

Sources: [CodeBurn configuration](https://github.com/getagentseal/codeburn/blob/main/docs/configuration.md),
[Claude cache pricing](https://github.com/getagentseal/codeburn/blob/main/docs/providers/claude.md),
and the locally installed 0.9.28 parser and pricing implementation.

[Repository index](../README.md)
