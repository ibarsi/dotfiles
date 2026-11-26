"""Config preservation and installed-CLI pricing regression checks."""

from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parent
CATALOG = json.loads((ROOT / "global-pricing.json").read_text())
spec = importlib.util.spec_from_file_location("configure_pricing", ROOT / "configure-pricing.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConfigurationTests(unittest.TestCase):
    def test_preserves_personal_prices_and_settings(self):
        original = {"currency": "USD", "modelAliases": {"personal": "gpt-5.5"},
                    "priceOverrides": {"gpt-5.5": {"input": 123, "output": 456}},
                    "discounts": {"grok": 5}}
        result = module.merge_pricing(original, CATALOG)
        self.assertEqual(result["priceOverrides"]["gpt-5.5"], original["priceOverrides"]["gpt-5.5"])
        self.assertEqual(result["modelAliases"], original["modelAliases"])
        self.assertEqual(result["discounts"], original["discounts"])
        self.assertEqual(module.merge_pricing(result, CATALOG), result)
        self.assertNotIn("claude-haiku-5-5", result["priceOverrides"])

    def test_rejects_double_discount_and_flat_haiku(self):
        for config in [{"discounts": {"claude": 50}},
                       {"discounts": {"claude-opus-5-5:cacheRead": 50}},
                       {"priceOverrides": {"claude-haiku-5-5": {"input": 0.1, "output": 0.5}}}]:
            with self.subTest(config=config), self.assertRaises(ValueError):
                module.merge_pricing(config, CATALOG)

    def test_rejects_unlisted_gemini_override(self):
        catalog = {**CATALOG, "priceOverrides": {**CATALOG["priceOverrides"], "gemini-4-argon": {"input": 2, "output": 10}}}
        with self.assertRaises(ValueError):
            module.merge_pricing({}, catalog)
        self.assertIn("gemini-4-neon", module.merge_pricing({}, CATALOG)["priceOverrides"])

    def test_apply_is_backed_up_and_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "config.json"
            original = '{"currency":"USD","modelAliases":{"mine":"gpt-5.5"}}\n'
            config.write_text(original)
            command = [os.sys.executable, str(ROOT / "configure-pricing.py"), "--config", str(config)]
            subprocess.run(command + ["--apply"], check=True, capture_output=True)
            backups = list(Path(directory).glob("config.json.backup.*"))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_text(), original)
            timestamp = config.stat().st_mtime_ns
            subprocess.run(command + ["--apply"], check=True, capture_output=True)
            self.assertEqual(config.stat().st_mtime_ns, timestamp)
            self.assertEqual(len(list(Path(directory).glob("config.json.backup.*"))), 1)
            subprocess.run(command + ["--check"], check=True, capture_output=True)


class InstalledCliTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which("codeburn"):
            raise unittest.SkipTest("Install CodeBurn before running CLI pricing checks")
        # Resolve mise's shim before replacing HOME for the synthetic account.
        cls.cli = shutil.which("codeburn")
        if "shims" in Path(cls.cli).parts:
            cls.cli = subprocess.check_output(["mise", "which", "codeburn"], text=True).strip()

    def price(self, model, usage, configured=True):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            config_dir = home / ".config/codeburn"
            config_dir.mkdir(parents=True)
            config = module.merge_pricing({}, CATALOG) if configured else {}
            (config_dir / "config.json").write_text(json.dumps(config))
            project = home / ".claude/projects/pricing-fixture"
            project.mkdir(parents=True)
            entry = {"type": "assistant", "uuid": "pricing-message", "requestId": "pricing-request",
                     "sessionId": "pricing-session", "timestamp": datetime.now(timezone.utc).isoformat(),
                     "message": {"id": "pricing-message", "role": "assistant", "model": model,
                                 "content": [], "usage": usage}}
            (project / "session.jsonl").write_text(json.dumps(entry) + "\n")
            env = {**os.environ, "HOME": str(home), "XDG_CONFIG_HOME": str(home / ".config"),
                   "XDG_CACHE_HOME": str(home / ".cache"), "CLAUDE_CONFIG_DIR": str(home / ".claude"),
                   "CODEBURN_PRICING_SNAPSHOT_ONLY": "1"}
            env.pop("CLAUDE_CONFIG_DIRS", None)
            result = subprocess.run([self.cli, "models", "--provider", "claude", "--period", "all",
                                     "--min-cost", "0", "--format", "json"], env=env, text=True, capture_output=True,
                                    check=True, timeout=30)
            rows = json.loads(result.stdout)
            self.assertEqual(len(rows), 1, result.stdout + result.stderr)
            return rows[0]["costUSD"]

    def test_flat_rates_and_one_hour_cache(self):
        for model, rates in CATALOG["priceOverrides"].items():
            usage = {"input_tokens": 1000, "output_tokens": 1000,
                     "cache_read_input_tokens": 1000, "cache_creation_input_tokens": 2000,
                     "cache_creation": {"ephemeral_5m_input_tokens": 1000,
                                        "ephemeral_1h_input_tokens": 1000}}
            expected = (rates["input"] + rates["output"] + rates["cacheRead"]
                        + rates["cacheCreation"] * 2.6) / 1000
            with self.subTest(model=model):
                self.assertAlmostEqual(self.price(model, usage), expected, places=8)

    def test_haiku_context_boundary(self):
        for tokens, rate in [(100000, 0.1), (100001, 0.5)]:
            with self.subTest(tokens=tokens):
                self.assertAlmostEqual(self.price("claude-haiku-5-5", {"input_tokens": tokens,
                                       "output_tokens": 1000}),
                                       tokens * rate / 1e6 + (0.5 if tokens == 100000 else 2.5) / 1000,
                                       places=8)

    def test_gpt_and_grok_default_prices_are_unchanged(self):
        for model in ["gpt-5.5", "grok-4.6"]:
            usage = {"input_tokens": 1000, "output_tokens": 1000, "cache_read_input_tokens": 1000}
            with self.subTest(model=model):
                self.assertEqual(self.price(model, usage), self.price(model, usage, configured=False))


if __name__ == "__main__":
    unittest.main()
