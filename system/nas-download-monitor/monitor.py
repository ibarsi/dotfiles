#!/usr/bin/env python3
"""Read-only downloader monitoring. Stdlib only; credentials never enter events."""
from __future__ import annotations

import collections
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CLIENTS = ("sabnzbd", "qbittorrent")
REASONS = (
    "no_progress", "metadata_wait", "postprocessing_stuck", "storage_error",
    "missing_files", "provider_error", "disk_pause", "job_failed", "tracker_blocked",
    "missing_articles", "repair_failed", "unpack_failed", "script_failed", "nzb_fetch_failed",
)
QB_STATES = {
    "error", "missingFiles", "uploading", "pausedUP", "queuedUP", "stalledUP",
    "checkingUP", "forcedUP", "allocating", "downloading", "metaDL", "pausedDL",
    "queuedDL", "stalledDL", "checkingDL", "forcedDL", "checkingResumeData",
    "moving", "unknown", "stoppedDL", "stoppedUP", "forcedMetaDL",
}
SAB_STATES = {
    "Downloading", "Paused", "Queued", "Checking", "Fetching", "QuickCheck",
    "Verifying", "Repairing", "Extracting", "Moving", "Running", "Completed", "Failed",
}
PP_STATES = {"Queued", "QuickCheck", "Verifying", "Repairing", "Fetching", "Extracting", "Moving", "Running"}


def clean(value):
    """Redact URL credentials/passkeys, magnets, network addresses and HTML."""
    s = str(value)
    s = re.sub(r"(?i)(?:https?|udp|wss?)://[^\s<>\"']+|magnet:\?[^\s<>\"']+", "[URL redacted]", s)
    s = re.sub(r"(?i)(password|passwd|apikey|api_key|passkey|token|authorization)(\s*[=:]\s*)[^\s,;<]+", r"\1\2[redacted]", s)
    s = re.sub(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", "[IP redacted]", s)
    s = re.sub(r"(?<![\w:])(?:[a-fA-F0-9]{0,4}:){2,}[a-fA-F0-9:]+(?:%\w+)?", "[IP redacted]", s)
    return re.sub(r"<[^>]*>", " ", s)[:2000]


def classify(message):
    s = str(message).lower()
    if any(x in s for x in ("space", "disk full", "permission", "read-only", "i/o error", "errno 28")):
        return "storage_error"
    if any(x in s for x in ("repair failed", "repair blocks", "repairing failed")):
        return "repair_failed"
    if any(x in s for x in ("unpack", "crc", "checksum", "password")):
        return "unpack_failed"
    if any(x in s for x in ("missing article", "malformed article", "cannot be completed", "not on your server")):
        return "missing_articles"
    if any(x in s for x in ("script",)):
        return "script_failed"
    if any(x in s for x in ("fetch nzb", "fetching failed", "url fetching")):
        return "nzb_fetch_failed"
    return "job_failed"


class Engine:
    def __init__(self, path, now=None, emit=None):
        self.path = Path(path)
        now = time.time() if now is None else now
        if self.path.exists():
            # Fail visibly on corrupt state rather than silently replaying failures.
            self.state = json.loads(self.path.read_text())
        else:
            self.state = {"started": now, "jobs": {}, "episodes": {}, "totals": {}, "log": {}}
        self.emit = emit or (lambda event: print(json.dumps(event, ensure_ascii=True), flush=True))
        self.rows = {c: [] for c in CLIENTS}
        self.values = {}
        self.issues = {c: collections.Counter() for c in CLIENTS}
        self.lock = threading.Lock()
        self.no_progress = int(os.environ.get("NO_PROGRESS_SECONDS", "2700"))
        self.pp_stuck = int(os.environ.get("POSTPROCESSING_SECONDS", "7200"))

    def event(self, client, event, **fields):
        self.emit({"client": client, "event": event, **fields})

    def metric(self, name, client, value, **labels):
        key = (name, tuple(sorted({"client": client, **labels}.items())))
        self.values[key] = float(value)

    def observe(self, client, ident, value, eligible, now, stage=""):
        key = client + ":" + ident
        old = self.state["jobs"].get(key, {})
        continuity = old and 0 <= now - old.get("seen", 0) <= 180
        unchanged = old.get("value") == value and old.get("stage") == stage
        since = old.get("since", now) if continuity and eligible and old.get("eligible") and unchanged else now
        obj = {"seen": now, "since": since, "value": value, "stage": stage, "eligible": eligible,
               "issue": old.get("issue", ""), "snapshot": old.get("snapshot", 0)}
        self.state["jobs"][key] = obj
        return max(0, now - since) if eligible else 0, obj

    def transition(self, client, obj, row, issue, now):
        previous = obj.get("issue", "")
        if issue != previous:
            self.event(client, "issue_opened" if issue else "issue_resolved", reason=issue or previous, **row)
        if issue or now - obj.get("snapshot", 0) >= 900:
            if issue != previous or now - obj.get("snapshot", 0) >= 900:
                self.event(client, "download_snapshot", reason=issue, **row)
                obj["snapshot"] = now
        obj["issue"] = issue

    def failure(self, client, ident, message, now, source="api", **context):
        # Terminal outcomes only. Log fallback and API evidence remain distinct.
        key = f"{client}:{source}:{ident}"
        if key in self.state["episodes"]:
            return
        reason = classify(message)
        self.state["episodes"][key] = {"time": now, "client": client, "reason": reason}
        counter = f"{client}:{reason}:{source}"
        self.state["totals"][counter] = self.state["totals"].get(counter, 0) + 1
        self.event(client, "download_failed", reason=reason, source=source, message=clean(message), **context)

    def begin(self, client):
        self.issues[client] = collections.Counter()

    def finish(self, client, rows, states, now):
        self.rows[client] = rows
        for reason in REASONS:
            self.metric("download_client_attention", client, self.issues[client][reason], reason=reason)
        for state in sorted(SAB_STATES | {"other"}) if client == "sabnzbd" else sorted(QB_STATES | {"other"}):
            self.metric("download_client_jobs", client, states.get(state, 0), state=state)
        self.metric("download_client_api_up", client, 1)
        self.metric("download_client_last_success_timestamp_seconds", client, now)

    def sab(self, queue, history, status, now):
        self.begin("sabnzbd")
        rows, states = [], collections.Counter()
        paused = bool(queue.get("paused") or queue.get("paused_all") or status.get("pp_pause_event"))
        servers = status.get("servers", [])
        errors = [clean(s.get("servererror", "")) for s in servers
                  if s.get("serveractive") and s.get("servererror")]
        warning_text = " ".join(str(w.get("text", w)) if isinstance(w, dict) else str(w) for w in status.get("warnings", []))
        primary = [s for s in servers if s.get("serveractive") and not s.get("serveroptional")]
        blocked = bool(queue.get("slots")) and float(queue.get("kbpersec", 0)) == 0
        self.issues["sabnzbd"]["provider_error"] = int(blocked and not paused and bool(primary)
                                                       and all(s.get("servererror") for s in primary))
        self.issues["sabnzbd"]["disk_pause"] = int(paused and "disk" in warning_text.lower())
        for key in ("diskspace1", "diskspace2"):
            if key in queue:
                self.metric("download_client_free_bytes", "sabnzbd", float(queue[key]) * 1024**3,
                            directory="temporary" if key == "diskspace1" else "completed")
        self.metric("download_client_paused", "sabnzbd", int(paused))
        self.metric("download_client_speed_bytes", "sabnzbd", float(queue.get("kbpersec", 0)) * 1024, direction="download")
        for item, pp in [(x, False) for x in queue.get("slots", [])] + [(x, True) for x in history]:
            state = str(item.get("status", "other"))
            ident = str(item.get("nzo_id", ""))
            if not ident:
                continue
            if pp and state in ("Completed", "Failed"):
                completed = float(item.get("completed") or 0)
                if state == "Failed" and completed >= self.state["started"]:
                    self.failure("sabnzbd", ident + ":" + str(completed), item.get("fail_message", "Download failed"), now,
                                 job=clean(item.get("name", "")), job_id=ident,
                                 stages=[{"name": clean(x.get("name", "")), "actions": [clean(a) for a in x.get("actions", [])]}
                                         for x in item.get("stage_log", [])])
                continue
            if pp and state not in PP_STATES:
                continue
            states[state if state in SAB_STATES else "other"] += 1
            eligible = (pp and state in PP_STATES) or (not pp and not paused and state == "Downloading")
            value = str(item.get("action_line", "")) if pp else str(item.get("mbleft", ""))
            age, obj = self.observe("sabnzbd", ident, value, eligible, now, state)
            reason = ("postprocessing_stuck" if pp else "no_progress") if age >= (self.pp_stuck if pp else self.no_progress) else ""
            if reason:
                self.issues["sabnzbd"][reason] += 1
            row = {"job": clean(item.get("filename", item.get("name", ""))), "job_id": ident,
                   "state": state, "stage": clean(item.get("action_line", "")), "observed_no_progress_seconds": age,
                   "reason": reason, "remaining_mb": item.get("mbleft")}
            self.transition("sabnzbd", obj, {k: v for k, v in row.items() if k != "reason"}, reason, now)
            rows.append(row)
        self.metric("download_client_provider_errors", "sabnzbd", len(errors))
        self.finish("sabnzbd", rows, states, now)
        self.sab_status = {"paused": paused, "provider_errors": errors, "warnings": clean(warning_text)}
        previous = self.state.get("sab_status", {})
        if previous.get("value") != self.sab_status or now - previous.get("time", 0) >= 900:
            self.event("sabnzbd", "client_status", **self.sab_status)
            self.state["sab_status"] = {"value": self.sab_status, "time": now}

    def qb(self, torrents, trackers, transfer, now):
        self.begin("qbittorrent")
        rows, states = [], collections.Counter()
        max_age = 0
        tracker_counts = collections.Counter()
        for item in torrents:
            state = str(item.get("state", "unknown"))
            states[state if state in QB_STATES else "other"] += 1
            ident = str(item["hash"])
            incomplete = float(item.get("progress", 0)) < 1 and int(item.get("amount_left", 1)) > 0
            eligible = incomplete and state in {"downloading", "stalledDL", "forcedDL", "metaDL", "forcedMetaDL"}
            # Piece completion/progress and downloaded bytes; never last_activity (uploads count).
            value = [item.get("downloaded", 0), item.get("progress", 0)]
            age, obj = self.observe("qbittorrent", ident, value, eligible, now)
            max_age = max(max_age, age)
            real = [x for x in trackers.get(ident, []) if urllib.parse.urlsplit(x.get("url", "")).hostname]
            failed = [x for x in real if x.get("status") == 4]
            working = sum(x.get("status") == 2 for x in real)
            tracker_counts.update({"failed": len(failed), "working": working, "total": len(real)})
            peers = int(item.get("num_seeds", 0)) + int(item.get("num_leechs", 0))
            reason = ""
            if state == "error":
                reason = "storage_error"
            elif state == "missingFiles":
                reason = "missing_files"
            elif eligible and age >= self.no_progress:
                reason = "metadata_wait" if state in {"metaDL", "forcedMetaDL"} else "no_progress"
                if real and len(failed) == len(real) and peers == 0:
                    self.issues["qbittorrent"]["tracker_blocked"] += 1
            if reason:
                self.issues["qbittorrent"][reason] += 1
            row = {"job": clean(item.get("name", "")), "job_id": ident, "state": state,
                   "progress_percent": round(float(item.get("progress", 0)) * 100, 2),
                   "observed_no_progress_seconds": age, "reason": reason,
                   "connected_seeds": item.get("num_seeds", 0), "connected_peers": item.get("num_leechs", 0),
                   "availability": item.get("availability", 0), "tracker_working": working,
                   "tracker_failed": len(failed), "tracker_total": len(real),
                   "tracker_errors": [{"host": urllib.parse.urlsplit(t.get("url", "")).hostname,
                                       "message": clean(t.get("msg", ""))} for t in failed]}
            self.transition("qbittorrent", obj, {k: v for k, v in row.items() if k != "reason"}, reason, now)
            rows.append(row)
        for state in ("working", "failed", "total"):
            self.metric("download_client_trackers", "qbittorrent", tracker_counts[state], state=state)
        self.metric("download_client_oldest_no_progress_seconds", "qbittorrent", max_age)
        self.metric("download_client_connected", "qbittorrent", int(transfer.get("connection_status") == "connected"))
        for direction, field in (("download", "dl_info_speed"), ("upload", "up_info_speed")):
            self.metric("download_client_speed_bytes", "qbittorrent", transfer.get(field, 0), direction=direction)
        self.finish("qbittorrent", rows, states, now)

    def tail_sab(self, directory, now):
        """Fallback for failed jobs removed by Arr before the history poll."""
        path = Path(directory) / "sabnzbd.log"
        stat = path.stat()
        cursor = self.state["log"]
        if not cursor:
            cursor.update(inode=stat.st_ino, offset=stat.st_size)
            return
        sources = []
        if cursor["inode"] != stat.st_ino:
            old = next((p for p in Path(directory).glob("sabnzbd.log*") if p.stat().st_ino == cursor["inode"]), None)
            if old:
                sources.append((old, cursor["offset"]))
                # A burst may rotate multiple times between polls. Make the gap visible.
                if old.name not in ("sabnzbd.log.1", "sabnzbd.log"):
                    self.metric("download_client_log_gap_timestamp_seconds", "sabnzbd", now)
            else:
                self.metric("download_client_log_gap_timestamp_seconds", "sabnzbd", now)
            sources.append((path, 0))
        else:
            sources.append((path, cursor["offset"] if stat.st_size >= cursor["offset"] else 0))
        for source, offset in sources:
            with source.open("rb") as f:
                f.seek(offset)
                # Bounded input; metric exposes falling behind a debug-log burst.
                buf = f.read(2 * 1024 * 1024)
                if buf and not buf.endswith(b"\n"):
                    buf = buf[:buf.rfind(b"\n") + 1]
                offset += len(buf)
                if source != path and source.stat().st_size > offset:
                    self.metric("download_client_log_gap_timestamp_seconds", "sabnzbd", now)
            for line in buf.decode(errors="replace").splitlines():
                if re.search(r"(?i)(Repair failed, not enough repair blocks|Unpacking failed|Aborted, cannot be completed|Download failed - Not on your server|Failed to fetch NZB|URL Fetching failed)", line):
                    # Exact log record identity survives restarts/rotation; not per-line failure totals.
                    ident = hashlib.sha256(line.encode()).hexdigest()
                    self.failure("sabnzbd", ident, line, now, source="log")
            if source == path:
                cursor.update(inode=stat.st_ino, offset=offset)
                self.metric("download_client_log_backlog_bytes", "sabnzbd", max(0, stat.st_size - offset))

    def save(self, now):
        self.state["jobs"] = {k: v for k, v in self.state["jobs"].items() if now - v["seen"] < 86400}
        # API terminal identity is retained for 60 days; old history is excluded separately by completed time.
        self.state["episodes"] = {k: v for k, v in self.state["episodes"].items() if now - v["time"] < 60 * 86400}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(json.dumps(self.state))
        os.chmod(temp, 0o600)
        temp.replace(self.path)

    def render(self, now):
        values = dict(self.values)
        for c in CLIENTS:
            for reason in REASONS:
                n = sum(v["client"] == c and v["reason"] == reason and 0 <= now - v["time"] < 1800
                        for v in self.state["episodes"].values())
                values[("download_client_recent_failures", (("client", c), ("reason", reason)))] = n
        for key, count in self.state["totals"].items():
            c, reason, source = key.split(":")
            values[("download_client_failure_evidence_total", (("client", c), ("reason", reason), ("source", source)))] = count
        out = []
        for (name, labels), value in sorted(values.items()):
            out.append(name + "{" + ",".join(k + "=" + json.dumps(v) for k, v in labels) + "} " + str(value))
        return "\n".join(out) + "\n"


class API:
    def __init__(self, secrets):
        self.secrets = secrets
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def sab(self, mode, **kwargs):
        s = self.secrets
        url = s["sab_url"] + "/api?" + urllib.parse.urlencode(dict(apikey=s["sab_key"], output="json", mode=mode, **kwargs))
        with urllib.request.urlopen(url, timeout=10) as r:
            return json.load(r)

    def qb(self, endpoint):
        s = self.secrets
        url = s["qb_url"] + "/api/v2/"
        headers = {"Referer": s["qb_url"], "User-Agent": "NAS-download-monitor/1"}
        if not list(self.jar):
            data = urllib.parse.urlencode({"username": s["qb_username"], "password": s["qb_password"]}).encode()
            with self.opener.open(urllib.request.Request(url + "auth/login", data=data, headers=headers), timeout=10) as r:
                r.read()
            # Versions return either 200 Ok. or 204. The cookie and authenticated GET are authoritative.
            if not list(self.jar):
                raise PermissionError("No session cookie")
        try:
            with self.opener.open(urllib.request.Request(url + endpoint, headers=headers), timeout=10) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                self.jar.clear()
            raise

    def history(self, engine, now):
        records = {}
        complete = True
        # Persisted watermark ensures outages don't silently skip removed/archived outcomes.
        cutoff = engine.state.get("history_watermark", engine.state["started"]) - 120
        for archive in (0, 1):
            for page in range(10):
                payload = self.sab("history", archive=archive, start=page * 200, limit=200)["history"]
                slots = payload.get("slots", [])
                for x in slots:
                    if x.get("status") not in ("Completed", "Failed") or float(x.get("completed") or 0) >= cutoff:
                        records[(x.get("nzo_id"), x.get("status"), x.get("completed"))] = x
                if len(slots) < 200 or any(float(x.get("completed") or now) < cutoff for x in slots):
                    break
            else:
                complete = False
        if complete:
            engine.state["history_watermark"] = now
        engine.metric("download_client_history_complete", "sabnzbd", int(complete))
        return list(records.values())


def run():
    secrets_path = Path(os.environ.get("SECRETS_FILE", "/run/secrets/download-clients.json"))
    engine = Engine(os.environ.get("STATE_FILE", "/state/state.json"))
    api = API(json.loads(secrets_path.read_text()))
    cache = {"metrics": "", "status": {}, "poll": 0}

    def poll():
        while True:
            started = time.monotonic()
            now = time.time()
            with engine.lock:
                for directory, reserve in api.secrets.get("reserve_bytes", {}).items():
                    engine.metric("download_client_reserve_bytes", "sabnzbd", reserve, directory=directory)
                for client in CLIENTS:
                    try:
                        if client == "sabnzbd":
                            q = api.sab("queue", limit=1000)["queue"]
                            if int(q.get("noofslots_total", 0)) > len(q.get("slots", [])):
                                raise ValueError("Queue pagination exceeds safety bound")
                            history = api.history(engine, now)
                            status = api.sab("fullstatus")["status"]
                            engine.sab(q, history, status, now)
                        else:
                            ts = api.qb("torrents/info")
                            trackers = {x["hash"]: api.qb("torrents/trackers?" + urllib.parse.urlencode({"hash": x["hash"]}))
                                        for x in ts if float(x.get("progress", 0)) < 1}
                            engine.qb(ts, trackers, api.qb("transfer/info"), now)
                    except Exception as exc:
                        engine.metric("download_client_api_up", client, 0)
                        # Exception text/URLs may contain credentials. Emit the class only.
                        engine.event(client, "collection_failed", error_type=type(exc).__name__, http_status=getattr(exc, "code", None))
                try:
                    engine.tail_sab(os.environ.get("SAB_LOG_DIR", "/sab-logs"), now)
                    engine.metric("download_client_log_source_up", "sabnzbd", 1)
                except Exception as exc:
                    engine.metric("download_client_log_source_up", "sabnzbd", 0)
                    engine.event("sabnzbd", "log_collection_failed", error_type=type(exc).__name__)
                engine.save(now)
                with cache_lock:
                    cache.update(metrics=engine.render(now), status={"updated": now, "clients": engine.rows,
                                 "sab_status": getattr(engine, "sab_status", {})}, poll=time.time())
            time.sleep(max(1, 60 - (time.monotonic() - started)))

    cache_lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            with cache_lock:
                stale = time.time() - cache["poll"] > 180
                if self.path == "/metrics":
                    body, content, code = cache["metrics"], "text/plain; version=0.0.4", 200
                elif self.path == "/status":
                    body, content, code = json.dumps(cache["status"]), "application/json", 200
                elif self.path == "/-/healthy":
                    body, content, code = ("stale" if stale else "ok"), "text/plain", (503 if stale else 200)
                else:
                    self.send_error(404)
                    return
            encoded = body.encode()
            self.send_response(code)
            self.send_header("Content-Type", content)
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def log_message(self, *_args):
            pass

    threading.Thread(target=poll, daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", 9813), Handler).serve_forever()


if __name__ == "__main__":
    run()
