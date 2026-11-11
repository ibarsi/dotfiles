import http.server
import json
from pathlib import Path
import tempfile
import threading
import unittest

from monitor import API, Engine, clean, classify
from provision import alerts, dashboard


class MonitoringTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.events = []
        self.path = Path(self.temp.name) / "state.json"
        self.e = Engine(self.path, now=1000, emit=self.events.append)
        self.t = {"hash": "abc", "name": "Example", "state": "stalledDL", "progress": .2,
                  "downloaded": 100, "amount_left": 400, "num_seeds": 0, "num_leechs": 0}

    def qb(self, now, **changes):
        self.t.update(changes)
        self.e.qb([self.t], {}, {"connection_status": "connected"}, now)

    def advance(self, end=3760):
        for now in range(1000, end + 1, 60):
            self.qb(now)

    def test_stall_requires_observation_and_resolves_on_download(self):
        self.advance()
        self.assertEqual(self.e.issues["qbittorrent"]["no_progress"], 1)
        self.qb(3820, downloaded=110)
        self.assertEqual(self.e.issues["qbittorrent"]["no_progress"], 0)
        self.assertTrue(any(x["event"] == "issue_resolved" for x in self.events))

    def test_upload_activity_does_not_hide_stall(self):
        self.advance()
        self.qb(3820, last_activity=3820, uploaded=999999)
        self.assertEqual(self.e.issues["qbittorrent"]["no_progress"], 1)

    def test_expected_states_and_completed_seed_are_quiet(self):
        for state in ("queuedDL", "stoppedDL", "pausedDL", "checkingDL", "moving", "stalledUP", "uploading"):
            for now in range(1000, 5000, 60):
                self.qb(now, state=state)
            self.assertFalse(any(self.e.issues["qbittorrent"].values()), state)
        self.qb(5100, state="forcedDL", progress=1, amount_left=0)
        self.assertFalse(any(self.e.issues["qbittorrent"].values()))

    def test_pause_and_outage_reset_observation_window(self):
        self.advance()
        self.qb(3820, state="stoppedDL")
        self.qb(3880, state="stalledDL")
        self.assertEqual(self.e.rows["qbittorrent"][0]["observed_no_progress_seconds"], 0)
        self.advance()
        self.qb(9000)
        self.assertEqual(self.e.rows["qbittorrent"][0]["observed_no_progress_seconds"], 0)

    def test_restart_retains_short_continuous_observation(self):
        self.advance()
        self.e.save(3760)
        self.e = Engine(self.path, now=3800, emit=self.events.append)
        self.qb(3820)
        self.assertEqual(self.e.issues["qbittorrent"]["no_progress"], 1)

    def test_metadata_is_separate_and_storage_is_immediate(self):
        self.t["state"] = "metaDL"
        self.advance()
        self.assertEqual(self.e.issues["qbittorrent"]["metadata_wait"], 1)
        self.qb(3820, state="error")
        self.assertEqual(self.e.issues["qbittorrent"]["storage_error"], 1)
        self.qb(3880, state="missingFiles")
        self.assertEqual(self.e.issues["qbittorrent"]["missing_files"], 1)

    def test_single_bad_tracker_does_not_alert_on_working_download(self):
        trackers = [{"url": "https://tracker.example/secret/announce?passkey=secret", "status": 4, "msg": "Timeout"},
                    {"url": "udp://working.example:80", "status": 2}]
        for now in range(1000, 4000, 60):
            self.t["downloaded"] += 1
            self.e.qb([self.t], {"abc": trackers}, {}, now)
        self.assertFalse(any(self.e.issues["qbittorrent"].values()))
        self.assertNotIn("passkey=secret", json.dumps(self.events))

    def test_all_trackers_failed_requires_stall_and_no_peers(self):
        trackers = {"abc": [{"url": "udp://tracker.example:80", "status": 4, "msg": "Timeout"}]}
        for now in range(1000, 4000, 60):
            self.e.qb([self.t], trackers, {}, now)
        self.assertEqual(self.e.issues["qbittorrent"]["tracker_blocked"], 1)
        self.t["num_leechs"] = 1
        self.e.qb([self.t], trackers, {}, 4000)
        self.assertEqual(self.e.issues["qbittorrent"]["tracker_blocked"], 0)

    def test_sab_repaired_success_and_old_failure_do_not_alert(self):
        history = [{"nzo_id": "old", "status": "Failed", "completed": 999, "fail_message": "Repair failed"},
                   {"nzo_id": "success", "status": "Completed", "completed": 1010,
                    "stage_log": [{"name": "Repair", "actions": ["Quick-check failed", "Repair successful"]}]}]
        self.e.sab({}, history, {}, 1020)
        self.assertFalse(self.e.state["episodes"])

    def test_sab_terminal_failure_once_across_restart(self):
        history = [{"nzo_id": "new", "status": "Failed", "completed": 1010,
                    "fail_message": "Unpacking failed: https://example/secret?apikey=sensitive"}]
        self.e.sab({}, history, {}, 1020)
        self.e.save(1020)
        self.e = Engine(self.path, now=1030, emit=self.events.append)
        self.e.sab({}, history, {}, 1080)
        failures = [x for x in self.events if x["event"] == "download_failed"]
        self.assertEqual(len(failures), 1)
        self.assertNotIn("sensitive", json.dumps(failures))

    def test_postprocessing_has_separate_timeout_and_download_pause(self):
        history = [{"nzo_id": "repair", "status": "Repairing", "action_line": "Repairing"}]
        queue = {"slots": [{"nzo_id": "waiting", "status": "Downloading", "mbleft": "10"}]}
        for now in range(1000, 8400, 60):
            self.e.sab(queue, history, {"pp_pause_event": True}, now)
        self.assertEqual(self.e.issues["sabnzbd"]["no_progress"], 0)
        self.assertEqual(self.e.issues["sabnzbd"]["postprocessing_stuck"], 1)

    def test_log_fallback_detects_removed_job_and_handles_rotation(self):
        root = Path(self.temp.name)
        log = root / "sabnzbd.log"
        log.write_text("old Repair failed, not enough repair blocks\n")
        self.e.tail_sab(root, 1000)
        self.assertFalse(self.e.state["episodes"])
        with log.open("a") as f:
            f.write("2026-11-11 INFO Repair failed, not enough repair blocks (18 short)\n")
        log.rename(root / "sabnzbd.log.1")
        log.write_text("2026-11-11 INFO Unpacking failed\n")
        self.e.tail_sab(root, 1060)
        self.e.tail_sab(root, 1120)
        self.assertEqual(len(self.e.state["episodes"]), 2)

    def test_log_quickcheck_failure_is_not_terminal(self):
        root = Path(self.temp.name)
        log = root / "sabnzbd.log"
        log.write_text("")
        self.e.tail_sab(root, 1000)
        log.write_text("Quick-check of file failed!\nRepair successful\n")
        self.e.tail_sab(root, 1060)
        self.assertFalse(self.e.state["episodes"])

    def test_metrics_have_no_job_or_tracker_labels(self):
        self.advance()
        text = self.e.render(4000)
        self.assertNotIn("Example", text)
        self.assertNotIn("abc", text)
        self.assertIn('reason="no_progress"', text)

    def test_redaction(self):
        result = clean('magnet:?xt=urn:secret https://a/announce?passkey=secret password=secret 192.168.0.39 2001:db8::1')
        self.assertNotIn("secret", result)
        self.assertNotIn("192.168", result)
        self.assertNotIn("2001:db8", result)

    def test_terminal_reason_categories(self):
        for message, reason in [("Repair failed, not enough repair blocks (18 short)", "repair_failed"),
                                ("Unpacking failed, see logfile", "unpack_failed"),
                                ("Aborted, cannot be completed", "missing_articles"),
                                ("Download failed - Not on your server(s)", "missing_articles"),
                                ("Post-processing script failed", "script_failed"),
                                ("URL Fetching failed", "nzb_fetch_failed"),
                                ("No space left on device", "storage_error")]:
            self.assertEqual(classify(message), reason)

    def test_history_pagination_and_archive(self):
        api = API({})
        calls = []

        def sab(mode, **kwargs):
            calls.append(kwargs)
            slots = [{"nzo_id": f"{kwargs['archive']}-{i}", "status": "Failed", "completed": 1100} for i in range(200)]
            return {"history": {"slots": slots if kwargs["start"] == 0 else []}}

        api.sab = sab
        self.assertEqual(len(api.history(self.e, 1200)), 400)
        self.assertEqual(len(calls), 4)
        self.assertEqual(self.e.state["history_watermark"], 1200)


class AuthenticationTests(unittest.TestCase):
    def test_login_204_with_cookie_is_success_and_cookie_is_reused(self):
        calls = []

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                calls.append(self.path)
                self.rfile.read(int(self.headers.get("Content-Length", 0)))
                self.send_response(204)
                self.send_header("Set-Cookie", "SID=test-session; Path=/")
                self.end_headers()

            def do_GET(self):
                assert self.headers.get("Cookie") == "SID=test-session"
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"[]")

            def log_message(self, *_args):
                pass

        with http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            api = API({"qb_url": f"http://127.0.0.1:{server.server_port}", "qb_username": "test", "qb_password": "test"})
            self.assertEqual(api.qb("torrents/info"), [])
            self.assertEqual(api.qb("torrents/info"), [])
            self.assertEqual(len(calls), 1)
            server.shutdown()


class ProvisionTests(unittest.TestCase):
    def test_rule_links_and_unique_short_identifiers(self):
        rules = alerts()["groups"][0]["rules"]
        ids = [r["uid"] for r in rules]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(len(uid) <= 40 for uid in ids))
        panel_ids = {str(p["id"]) for p in dashboard()["panels"]}
        for rule in rules:
            annotations = rule["annotations"]
            self.assertEqual(annotations["__dashboardUid__"], dashboard()["uid"])
            self.assertIn(annotations["__panelId__"], panel_ids)
            self.assertEqual(rule["condition"], "B")

    def test_dashboard_panels_do_not_overlap(self):
        panels = dashboard()["panels"]
        for i, a in enumerate(panels):
            a = a["gridPos"]
            for b in panels[i+1:]:
                b = b["gridPos"]
                overlap = a["x"] < b["x"] + b["w"] and a["x"] + a["w"] > b["x"] and a["y"] < b["y"] + b["h"] and a["y"] + a["h"] > b["y"]
                self.assertFalse(overlap)


if __name__ == "__main__":
    unittest.main()
