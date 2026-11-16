# CodeBurn

Employment Vertex pricing in USD, applied at current contract rates to all matching
history. Personal GPT and Grok usage retains CodeBurn's default pricing. The CLI is
installed through [mise](../mise/README.md) and updated by [aiup](../zsh/README.md#updates).

## Pricing evidence

[global-pricing.json](global-pricing.json) records rates derived from the billing
CSV exported on 2026-11-16, covering August through November 2026. Prices are USD
per million tokens, calculated from unrounded subtotal divided by usage. Account
identifiers, billing totals and the raw export are not tracked. These are historical
effective rates, not an automated feed of future contract changes.

The catalog distinguishes executable overrides, native Haiku context tiers and
reference-only Gemini standard/priority rates. Gemini reference prices already
include the observed contract savings; another 50% discount would double-discount
them. Small Hydrogen and Flash Lite samples need a pricing-table export before
their exact rates can be configured.

## Apply the verified subset

On a machine using the employment Vertex account with **global endpoints**:

```bash
python3 codeburn/configure-pricing.py
python3 codeburn/configure-pricing.py --apply
python3 codeburn/configure-pricing.py --check
codeburn price-override --list
codeburn models --period all
```

The first command previews. Applying merges four verified flat Claude model rates
into `~/.config/codeburn/config.json`, preserving unrelated configuration. Existing
files receive a timestamped backup; unchanged files are not rewritten. Restore the
backup to undo an update, or remove the four catalog keys from `priceOverrides`
if the config did not exist beforehand. This is a manual step on macOS or Linux,
not an automatic bootstrap action on every computer.

## Accuracy boundaries

Verified against CodeBurn 0.9.28:

- Native flat overrides disable long-context tiers. Haiku 5.5 therefore retains
  CodeBurn's tiered pricing, whose bundled global rates match the catalog. The
  applicator refuses an existing flat Haiku 5.5 override.
- Claude one-hour cache writes cost 1.6 times the configured five-minute rate
  when the logs retain the duration split. Opus 5.5 is thus $5/1M for five minutes
  and $8/1M for one hour. Missing metadata cannot be recovered from aggregate tokens.
- The Gemini CLI parser always reports standard service. One model override cannot
  distinguish its standard and priority requests. Gemini rates are reference-only
  until the actual service tier and raw model-to-SKU mappings can be established.
  In particular, local 3.5/3.6/3.7 Flash IDs are not assumed to mean billed 3.8 Flash.
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
