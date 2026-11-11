"""Generate the NAS-specific Compose addition, alerts and dashboard."""
import json

PROM = "af9khpjsum800f"
LOKI = "dfslje6sjgef4f"
BASE = "/volume3/docker/configs/grafana"

COMPOSE = f'''
  # BEGIN download-client-monitor (managed by dotfiles)
  download-client-monitor:
    image: python:3.13-alpine
    container_name: download-client-monitor
    command: ["python", "-B", "/app/monitor.py"]
    networks:
      - grafana-net
    user: 1026:101
    read_only: true
    mem_limit: 96m
    cpu_shares: 128
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    environment:
      TZ: America/Toronto
      NO_PROGRESS_SECONDS: "2700"
      POSTPROCESSING_SECONDS: "7200"
    volumes:
      - {BASE}/download-client-monitor/monitor.py:/app/monitor.py:ro
      - {BASE}/download-client-monitor/secrets.json:/run/secrets/download-clients.json:ro
      - {BASE}/download-client-monitor/state:/state:rw
      - /volume3/docker/configs/sabnzbd/logs:/sab-logs:ro
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:9813/-/healthy', timeout=5).read()"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"
    restart: unless-stopped
  # END download-client-monitor
'''

ALLOY = r'''
// Download-client execution events. SAB messages already arrive via Docker.
local.file_match "qbittorrent_logs" {
  path_targets = [{
    "__path__" = "/var/log/qbittorrent/qbittorrent.log",
    "job" = "qbittorrent",
    "client" = "qbittorrent",
    "host" = sys.env("HOST_NAME"),
  }]
}

loki.source.file "qbittorrent_logs" {
  targets = local.file_match.qbittorrent_logs.targets
  tail_from_end = true
  forward_to = [loki.process.qbittorrent_logs.receiver]
}

loki.process "qbittorrent_logs" {
  stage.regex {
    expression = `^[(][A-Z][)] (?P<event_time>[0-9T:-]+) -`
  }
  stage.timestamp {
    source = "event_time"
    format = "2006-01-02T15:04:05"
    location = "America/Toronto"
    action_on_failure = "skip"
  }
  stage.replace {
    expression = `(?i)(https?|udp|wss?)://[^\s"<>]+|magnet:\?[^\s"<>]+`
    replace = "[URL redacted]"
  }
  stage.replace {
    expression = `(?i)(password|passwd|apikey|api_key|passkey|token|authorization)\s*[=:]\s*[^\s,;<]+`
    replace = "[credential redacted]"
  }
  stage.replace {
    expression = `\b([0-9]{1,3}[.]){3}[0-9]{1,3}\b`
    replace = "[IP redacted]"
  }
  stage.replace {
    expression = `([a-fA-F0-9]{0,4}:){2,}[a-fA-F0-9:]+`
    replace = "[IP redacted]"
  }
  stage.drop {
    older_than = "168h"
    drop_counter_reason = "old_qbittorrent_event"
  }
  forward_to = [loki.write.local.receiver]
}
'''


def rule(uid, title, expr, duration="2m", severity="warning", datasource=PROM, description="", labels=None):
    loki = datasource == LOKI
    model = {"datasource": {"type": "loki" if loki else "prometheus", "uid": datasource},
             "expr": expr, "instant": True, "refId": "A", "intervalMs": 1000, "maxDataPoints": 43200}
    if loki:
        model["queryType"] = "instant"
    return {"uid": uid, "title": title, "version": 1, "condition": "B", "for": duration,
            "noDataState": "OK", "execErrState": "KeepLast", "isPaused": False,
            "labels": {"severity": severity, "incident_group": "download_clients", "stack": "nas",
                       "provisioned_by": "codex", **(labels or {})},
            "annotations": {"summary": title + "{{ with $labels.client }} · {{ . }}{{ end }}{{ with $labels.reason }} · {{ . }}{{ end }}{{ with $labels.name }} · {{ . }}{{ end }}",
                            "description": description,
                            "first_check": "Open NAS → NAS Download Clients. Inspect the diagnostic events and job table; verify intentional pauses and queue waiting before acting.",
                            "__dashboardUid__": "nas-download-clients", "__panelId__": "1"},
            "data": [{"refId": "A", "datasourceUid": datasource,
                      "relativeTimeRange": {"from": 600, "to": 0}, "model": model},
                     {"refId": "B", "datasourceUid": "__expr__", "relativeTimeRange": {"from": 0, "to": 0},
                      "model": {"type": "threshold", "expression": "A", "refId": "B",
                                "conditions": [{"evaluator": {"params": [0], "type": "gt"}}]}}]}


def alerts():
    rules = [
        rule("dl_monitor_unavailable", "Download client monitor unavailable",
             '(up{job="download-client-monitor"} == bool 0) or absent(up{job="download-client-monitor"})', "3m", "critical"),
        rule("dl_api_unavailable", "Download client API unavailable",
             '(download_client_api_up == bool 0) or (time() - download_client_last_success_timestamp_seconds > bool 180)', "3m"),
        rule("dl_download_blocked", "Download client needs attention",
             'download_client_attention * on(client) group_left() (download_client_api_up == 1)', "2m",
             description="Sustained eligible download stall (45 minutes observed), metadata wait, post-processing delay (2 hours), provider failure, missing file or storage error. Job details and tracker messages are in diagnostic events. Paused/queued/checking/moving torrents and completed seeds do not qualify as transfer stalls."),
        rule("dl_recent_failure", "Download client processing failure",
             'download_client_recent_failures', "1m",
             description="New terminal failure evidence was observed in the last 30 minutes. API and log fallback evidence may describe the same job; this is not a unique-job count. Resolution means the notification window expired, not proof that a replacement completed."),
        rule("dl_sab_low_space", "Download directory below reserve",
             'download_client_free_bytes < bool download_client_reserve_bytes', "5m",
             description="Free space is below the configured SAB temporary/completed reserve. Check NAS Download Clients before deleting anything."),
        rule("dl_history_gap", "SAB diagnostic collection incomplete",
             '(download_client_history_complete == bool 0) or (download_client_log_source_up == bool 0) or (download_client_log_backlog_bytes > bool 2097152) or ((time() - download_client_log_gap_timestamp_seconds) < bool 600)', "2m", labels={"client": "sabnzbd"}),
        rule("dl_qb_file_error", "qBittorrent file operation failed",
             'sum(count_over_time({job="qbittorrent"} |~ "(?i)(file error|I/O error|permission denied|no space left|failed to move|missing files|read-only file system)"[10m]))',
             "1m", datasource=LOKI, labels={"client": "qbittorrent", "reason": "storage_error"}),
        rule("dl_actual_oom", "Downloader container OOM event",
             'sum by (name) (increase(container_oom_events_total{name=~"sabnzbd|qbittorrent|gluetun-downloaders"}[10m]))',
             "0s", "critical", description="cAdvisor observed an actual cgroup OOM event. Corroborate Docker state and the VPN namespace; this is separate from log-language matching."),
        rule("dl_container_restart", "Downloader container restarted",
             'sum by (name) (changes(container_start_time_seconds{name=~"sabnzbd|qbittorrent|gluetun-downloaders"}[10m]))',
             "1m", description="Container start time changed. Check maintenance history and Docker state before diagnosing a crash."),
    ]
    assert all(len(r["uid"]) <= 40 for r in rules)
    return {"apiVersion": 1, "groups": [{"orgId": 1, "name": "download-client-health", "folder": "NAS",
                                         "interval": "1m", "rules": rules}]}


def dashboard():
    panels = []

    def panel(title, expr, kind="timeseries", unit="short", height=8, width=12, datasource=PROM, description=""):
        index = len(panels)
        y = sum(p["gridPos"]["h"] for p in panels if p["gridPos"]["x"] == 0)
        if width == 12 and index and panels[-1]["gridPos"]["w"] == 12 and panels[-1]["gridPos"]["x"] == 0:
            x, y = 12, panels[-1]["gridPos"]["y"]
        else:
            x = 0
        panels.append({"id": index + 1, "title": title, "type": kind, "description": description,
                       "gridPos": {"x": x, "y": y, "w": width, "h": height},
                       "datasource": {"type": "loki" if datasource == LOKI else "prometheus", "uid": datasource},
                       "targets": [{"refId": "A", "expr": expr, "legendFormat": "{{client}} {{reason}} {{state}} {{directory}}",
                                    **({"queryType": "range"} if datasource == LOKI else {})}],
                       "fieldConfig": {"defaults": {"unit": unit}, "overrides": []},
                       "options": {"showTime": True, "wrapLogMessage": True, "sortOrder": "Descending"} if kind == "logs" else {}})

    panel("Authenticated API reachable · 1 = yes", "download_client_api_up", "stat", height=4)
    panel("Issues requiring attention", "sum by (client,reason) (download_client_attention + download_client_recent_failures)", "stat", height=4)
    panel("Jobs by current state", "download_client_jobs > 0")
    panel("Transfer speed", "download_client_speed_bytes", unit="Bps")
    panel("Oldest continuously observed qB download stall", "download_client_oldest_no_progress_seconds", unit="s")
    panel("qB tracker entries · a failure alone is not a stalled download", "download_client_trackers")
    panel("Download-directory free space", "download_client_free_bytes", unit="bytes")
    panel("Poll age · seconds since last successful client collection", "time() - download_client_last_success_timestamp_seconds", unit="s")
    panel("Latest qB job snapshots in selected time range",
          '{job="docker",container="download-client-monitor"} | json | client="qbittorrent" | event="download_snapshot"',
          "table", height=9, width=24, datasource=LOKI,
          description="Latest observed row per job within the selected time range; removed jobs can remain as historical rows. The Jobs by current state panel shows the current count.")
    panels[-1]["transformations"] = [
        {"id": "extractFields", "options": {"source": "Line", "format": "json", "replaceFields": True, "keepTime": True}},
        {"id": "sortBy", "options": {"sort": [{"field": "Time", "desc": False}]}},
        {"id": "groupBy", "options": {"fields": {
            "job_id": {"operation": "groupby", "aggregations": []},
            **{key: {"operation": "aggregate", "aggregations": ["lastNotNull"]}
               for key in ("Time", "job", "state", "progress_percent", "connected_seeds", "connected_peers",
                           "availability", "observed_no_progress_seconds", "reason", "tracker_failed")}}}},
    ]
    panel("qB diagnostic snapshots · progress, availability, seeds, trackers",
          '{job="docker",container="download-client-monitor"} | json | client="qbittorrent" | event="download_snapshot"',
          "logs", height=12, width=24, datasource=LOKI,
          description="Snapshots refresh every 15 minutes and on issue transitions. Expand a JSON event for job identity, percentage, observed stall time, connected seeds/peers, availability and redacted tracker errors. Stalls only age while continuously observed. The internal /status endpoint provides the latest one-minute view.")
    panel("SAB failures and active processing stages",
          '{job="docker",container="download-client-monitor"} | json | client="sabnzbd"',
          "logs", height=10, width=24, datasource=LOKI)
    panel("Issue openings and recoveries",
          '{job="docker",container="download-client-monitor"} | json | event=~"issue_opened|issue_resolved|download_failed|collection_failed"',
          "logs", height=10, width=24, datasource=LOKI)
    panel("qB execution log · file errors, completions, moves",
          '{job="qbittorrent"}', "logs", height=10, width=24, datasource=LOKI)
    panel("SAB application log · warning/error and processing context",
          '{job="docker",container="sabnzbd"} |~ "(?i)(warning|error|failed|repair|unpack|diskspace)"',
          "logs", height=10, width=24, datasource=LOKI)
    return {"uid": "nas-download-clients", "title": "NAS Download Clients", "schemaVersion": 39,
            "version": 1, "tags": ["nas", "downloaders"], "timezone": "America/Toronto",
            "refresh": "1m", "time": {"from": "now-6h", "to": "now"}, "editable": False, "panels": panels}


if __name__ == "__main__":
    print(json.dumps({"alerts": alerts(), "dashboard": dashboard()}, indent=2))
