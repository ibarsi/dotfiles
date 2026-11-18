#!/usr/bin/env python3
"""Merge the verified global Claude rates into CodeBurn's local config."""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import tempfile


# Gemini models confirmed priority-tier-only across every billing export seen so
# far (zero standard-tier dollars). Every other Gemini model mixes standard and
# priority traffic under one model name, which CodeBurn's Gemini parser cannot
# distinguish (see global-pricing.json's limitations), so a flat override would
# systematically misprice one tier. Do not add a model here without export
# evidence that it has never billed standard-tier.
UNAMBIGUOUS_GEMINI_MODELS = {"gemini-4-carbon", "gemini-4-hydrogen"}


def merge_pricing(config, catalog):
    """Preserve all settings except the explicitly managed model rates."""
    desired = catalog["priceOverrides"]
    if catalog["currency"] != "USD" or catalog["endpoint"] != "global":
        raise ValueError("Only the verified USD/global catalog is supported")
    if any(not (model.startswith("claude-") or model in UNAMBIGUOUS_GEMINI_MODELS) for model in desired):
        raise ValueError("This catalog must not override personal GPT/Grok or ambiguous Gemini usage")
    existing = config.get("priceOverrides", {})
    if not isinstance(existing, dict):
        raise ValueError("Existing priceOverrides is not an object")
    # A provider/model discount would be applied on top of these net rates.
    discounts = config.get("discounts", {})
    scopes = {"claude", "pi", "omp", *desired}
    for scope, discount in discounts.items():
        if scope.split(":", 1)[0] in scopes and discount:
            raise ValueError(f"Review existing discount {scope!r} before applying net rates")
    tiered = catalog["nativeTieredPricing"]
    for model in existing:
        if any(model.startswith(name) for name in tiered):
            raise ValueError(f"Existing flat override {model!r} disables native context tiers")
    return {**config, "priceOverrides": {**existing, **desired}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Back up and write local configuration")
    mode.add_argument("--check", action="store_true", help="Exit 1 if managed rates differ")
    parser.add_argument("--config", type=Path, default=Path.home() / ".config/codeburn/config.json")
    args = parser.parse_args()
    catalog = json.loads(Path(__file__).with_name("global-pricing.json").read_text())
    path = args.config.expanduser()
    # Preserve an existing config symlink by replacing its target.
    path = path.resolve()
    original = json.loads(path.read_text()) if path.exists() else {}
    if not isinstance(original, dict):
        raise ValueError("Existing CodeBurn config is not an object")
    updated = merge_pricing(original, catalog)
    print("Verified global Claude overrides (USD per million tokens):")
    print(json.dumps(catalog["priceOverrides"], indent=2))
    print("Haiku 5.5 keeps native context tiers; Gemini Argon/3.8 Flash/Flash Lite rates remain reference-only.")
    print("GPT/Grok defaults and unrelated settings are preserved.")
    if updated == original:
        print("Managed rates are current.")
        return 0
    if args.check:
        print("Managed rates differ; run with --apply.")
        return 1
    if not args.apply:
        print("Preview only. Run with --apply to write the verified subset.")
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup = path.with_name(f"{path.name}.backup.{stamp}")
        shutil.copy2(path, backup)
        os.chmod(backup, 0o600)
        print(f"Backup: {backup}")
    fd, temporary = tempfile.mkstemp(prefix=".pricing-", dir=path.parent)
    try:
        with os.fdopen(fd, "w") as output:
            json.dump(updated, output, indent=2)
            output.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(f"Applied verified subset to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
