#!/usr/bin/env python3
"""Expose completed Arr queue items that require a manual import.

The Arr applications intentionally keep some automatic-import refusals in the
queue API rather than their logs. This exporter reads each local config.xml for
its API key, polls the queue read-only at scrape time, and exposes only bounded
app/reason labels for Prometheus.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


ARRS = (
    ("sonarr", os.environ.get("SONARR_URL", "http://192.168.0.39:8989"), "/sonarr-config/config.xml"),
    ("radarr", os.environ.get("RADARR_URL", "http://192.168.0.39:7878"), "/radarr-config/config.xml"),
)
REASON = "automatic_import_not_possible"
WARNING = "automatic import is not possible"


def api_key(config_path: str) -> str:
    key = ET.parse(config_path).findtext("ApiKey")
    if not key:
        raise RuntimeError("ApiKey missing from Arr config")
    return key


def queue_items(base_url: str, key: str) -> list[dict]:
    query = urllib.parse.urlencode(
        {"page": 1, "pageSize": 1000, "includeUnknownSeriesItems": "true"}
    )
    request = urllib.request.Request(
        f"{base_url}/api/v3/queue?{query}",
        headers={"X-Api-Key": key, "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.load(response)
    return payload.get("records", payload if isinstance(payload, list) else [])


def needs_manual_import(item: dict) -> bool:
    if item.get("status", "").lower() != "completed":
        return False
    for status in item.get("statusMessages") or []:
        for message in status.get("messages") or []:
            if WARNING in message.lower():
                return True
    return False


def metrics() -> str:
    lines = [
        "# HELP arr_queue_monitor_up Whether the Arr queue API was reachable and readable.",
        "# TYPE arr_queue_monitor_up gauge",
        "# HELP arr_queue_attention_required Completed downloads that require manual import.",
        "# TYPE arr_queue_attention_required gauge",
    ]

    for app, base_url, config_path in ARRS:
        try:
            seen = set()
            for item in queue_items(base_url, api_key(config_path)):
                if needs_manual_import(item):
                    seen.add(item.get("downloadId") or item.get("id"))
            lines.append(f'arr_queue_monitor_up{{app="{app}"}} 1')
            lines.append(
                f'arr_queue_attention_required{{app="{app}",reason="{REASON}"}} {len(seen)}'
            )
        except Exception:
            lines.append(f'arr_queue_monitor_up{{app="{app}"}} 0')
            lines.append(
                f'arr_queue_attention_required{{app="{app}",reason="{REASON}"}} 0'
            )

    return "\n".join(lines) + "\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path not in ("/", "/metrics", "/-/healthy"):
            self.send_error(404)
            return
        body = metrics().encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; version=0.0.4")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format: str, *_args: object) -> None:
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 9808), Handler).serve_forever()
