# NAS download-client observability audit

Historical pre-implementation assessment. Monitoring was subsequently deployed; see [current behavior and operations](../../nas-download-monitor/README.md). The qB API authentication limitation below was resolved: successful login returns HTTP 204 with a session cookie, and the application API reports v5.2.3 rather than the theme installer’s 5.3.0 message.

Read-only assessment, 2026-11-11, America/Toronto. No NAS configuration, queue, download, tracker or alert changes were made. Authentication attempts generated qBittorrent login events. Findings describe the inspected provisioned monitoring configuration; dynamically created Grafana rules were not independently enumerated.

## Assessment

Infrastructure monitoring exists, but download outcomes and ongoing progress have major gaps. SABnzbd application messages already reach Loki through Docker stdout. qBittorrent execution-file logs are not collected. Neither client has an application API metrics collector. A working WebUI or healthy container cannot establish that downloads are progressing.

## Evidence and collection paths

Inspected live inputs:

- `/volume3/docker/configs/grafana/config.alloy`, Alloy container mounts, and `prometheus.yml`.
- `provisioning/alerting/nas-sre-alerts.json`, `arr-queue-exporter.py`, and `loki-config.yaml` below the same Grafana directory.
- Docker state/logs for SABnzbd and qBittorrent; application log inventories and relevant records.
- SABnzbd 5.1.3 read-only queue, warnings, fullstatus, ordinary history and archived failed-history API views.
- qBittorrent configuration and retained execution logs; image startup reports version 5.3.0. Authenticated API inspection was unsuccessful, so live torrent/tracker/peer status remains unverified.
- Prometheus metric-name inventory contains no SABnzbd/qBittorrent/torrent/tracker application metric names. Its scrape configuration contains WebUI probes, infrastructure exporters, and the narrow Arr queue exporter, but no downloader API exporter.

Alloy discovers Docker containers and forwards their stdout/stderr under `job="docker"`. File targets exist for Plex, Arr applications, selected DSM kernel messages and Hyper Backup. There are no SABnzbd or qBittorrent file targets or mounts. Loki retention is configured as 1440 hours (60 days); that is configuration, not proof of complete retention. Docker logging uses Synology's `db` driver for both downloaders, with no explicit per-container rotation settings visible in inspect.

| Signal | Collected now | Coverage limit |
|---|---|---|
| Client container stdout/stderr | Docker → Alloy → Loki | Only messages actually emitted to stdout/stderr |
| SAB application repair/unpack/disk messages | Yes, demonstrated in Loki | No dedicated outcome or stall rules found |
| SAB queue, post-processing stages, warnings, provider status and job history | Available through API; no continuous collector found | No retained state/progress series or categorized terminal outcomes |
| qB execution log | Local file, outside Alloy file ingestion | Completion, move, file-error and other execution events can be missing from Loki |
| qB trackers, seeds/peers, availability and byte progress | Supported by API; no collector found | Cannot explain stalled jobs historically |
| Published WebUI reachability | Blackbox probes and dedicated alerts | Does not establish authenticated API or transfer health |
| VPN health | Gluetun startup-loop rule, healthchecks and namespace guard containers | Does not establish individual job health |
| Arr manual-import refusals | Exporter and alert | Exporter matches completed queue items containing “automatic import is not possible”; does not cover general failed/stalled downloads |

The generic panic/fatal/OOM log rule does not match ordinary “Repair failed” or “Too little diskspace” messages. No dedicated client storage, repair, provider, tracker or progress rules were found in the provisioned alert file. Disk health is monitored via SNMP; disk hardware status is distinct from download-directory capacity. A dedicated cgroup OOM rule found in this file applies to OpenClaw, not the downloaders.

## Retained incidents and current observations

### SABnzbd

- **November 3, 05:26 EST:** `Repair failed, not enough repair blocks (18 short)` and a PAR verification failure. Confirmed in local application log, Docker log and historical Loki query. These are real processing errors without panic/fatal/OOM language.
- **November 7, 01:09 EST:** `Too little diskspace forcing PAUSE`. Loki contains three related records in the incident window (notification + warning + notification), representing one episode, not three independent failures.
- Local logs contain quick-check/PAR failures. A quick-check failure alone must not be treated as terminal failure: successful repair can follow. Terminal history and processing stages provide the outcome.
- At inspection: queue empty, status Idle, no active warnings, provider `news.eweka.nl` active with an empty server-error field. Free space reported around 160.9 GB temporary and 2.2 TB completed. These are point-in-time observations.
- Current configured reserves: temporary 10G, completed 20G, disk-full auto-resume enabled; pause while post-processing enabled. Consequently zero download speed during post-processing can be expected.
- Ordinary history had one Completed record and no failed jobs. Archived failed-only query returned 19 older failures, including unavailable articles and unpack failures. The newest retained archived failure was February 2026; this archive is not a complete record of recent failures. The November repair incident survives in logs even though it is absent from current failed history.
- Six local log files occupy approximately 27 MiB. Five rotated files are around 5 MiB each. Several rotations span only roughly ten seconds during an October 31 burst: size-bounded rotation does not guarantee a useful number of days of history. Avoid assuming local logs are a durable incident archive.
- Native email configuration is disabled/unconfigured. Other notification transports were not comprehensively audited; do not interpret this as proof that every native notification channel is disabled.

### qBittorrent

- Execution log path: `/volume3/docker/configs/qbittorrent/qBittorrent/logs/qbittorrent.log`. File logging, backup and age deletion are enabled; configured rollover threshold is 66,560 bytes. Approximately 4.3 MiB across 61 retained files was observed. Rotation names and modification dates are not a guaranteed retention window.
- The file log records a torrent being added, moved successfully, completed and removed on November 11. A historical Loki Docker-stream query for `Torrent download finished` over the corresponding day returned no results. This corroborates the missing execution-event collection path.
- Scanned retained warning/critical records contained translation warnings and an authentication failure from this audit, with no matching tracker or file-I/O warnings. This does not establish tracker health: tracker state is separate API data, and the retained file logs are finite.
- Incomplete path is `/incomplete`, backed by the dedicated NVMe mount; completed path is `/downloads`. Queueing is enabled, with maximum active downloads set to 10. Waiting in the queue must not be misclassified as a stalled active transfer.
- Attempted API reads without authentication were rejected. Existing integration credentials did not establish an authenticated session; no credentials were printed, reset or changed. This does not prove the existing Arr integration is broken: the file log also contains recurring successful integration logins. Current torrent counts, tracker errors, seed availability and actual stalls are therefore unverified.

## Recommended additions

These are proposed starting policies, not vendor defaults or deployed changes.

1. **Preserve qB execution events in Loki.** Mount the application log directory read-only and tail the active execution log, handling rotation and parsing its Toronto event timestamps. Redact tracker passkeys, credentials, URLs with secrets and unnecessary network addresses. Do not duplicate SAB's already captured stdout unless testing establishes a real file-only gap.
2. **Add a small downloader API collector.** Poll about once a minute, retaining progress state between polls and across collector restart. Separate collection from scrape serving; expose API reachability, last successful poll time and collection failure metrics. Keep credentials in existing secret/config loading paths. Resolve qB authentication before implementation.
3. **SAB: record terminal outcomes before cleanup removes them.** Categorize unavailable/malformed articles, insufficient repair blocks, unpack/CRC/password failures, disk/permission errors, failed scripts and NZB URL acquisition. Read active post-processing as well as the queue, with ordinary and archived history handled explicitly. Deduplicate by stable job identity and terminal outcome. Log fallback or native failure notifications are useful because short-lived/removed records can fall between polls. Do not count repaired successes as failures.
4. **SAB: watch actionable blockage.** Warn on persistent low-space pause, provider connection/authentication failures, or an eligible queue making no progress. Track repair, fetch-PAR, unpack, move and script stages separately; start with a long stage-specific threshold and tune from measured job sizes and durations. Explicit pause, propagation wait, speed schedules and pause-on-post-processing need distinct handling.
5. **qB: measure real incomplete-download progress.** Track downloaded bytes/selected-piece progress over time; `last_activity` includes uploading. Begin with a 30–60 minute no-progress warning for eligible active jobs, plus a separate metadata-acquisition timeout. Exclude completed seeds, deliberate stop/pause, ordinary queue waiting, checking, moving and expected scheduler limits. Use observed time, with a startup grace period, rather than pretending first-seen stalls have a known duration.
6. **qB: explain each stall.** Attach state, available pieces, connected seeds/peers, reported swarm counts and tracker status/message to the diagnostic event. A single failing tracker is dashboard context when another discovery path works. Warn when sustained failure affects an incomplete job and usable discovery/peers/progress are absent; respect private-torrent discovery restrictions. Reannounce only after diagnosing the failure class; automatic repeated reannounce is not a monitoring substitute.
7. **Alert on storage and ingestion failures explicitly.** File-I/O warnings, missing files, permission errors, download-folder reserves, API collector freshness and actual OOM/restart signals deserve separate detection. A log-language “Fatal” alert should describe an application error until corroborated as a crash.
8. **Keep notifications low-noise.** One warning per job/issue episode, update or resolve on recovery; batch repeated failures. Maintain bounded client/state/reason metric labels. Store job names, IDs and detailed failure text in diagnostic events rather than unbounded Prometheus series. Never label metrics with complete tracker URLs or peer IPs. Track how much history the collector successfully covers, including pagination/cleanup gaps.

Suggested dashboard: client/API/VPN/storage health; active versus queued/paused/stalled jobs; failed outcomes by reason; oldest eligible no-progress duration; current processing stage and age; a drill-down table with tracker and peer explanations. Keep warnings for individual job failures, with critical severity reserved for sustained widespread inability to download, severe storage failures or confirmed process failures.

Acceptance cases before deploying: SAB unrecoverable repair, recoverable quick-check failure followed by success, disk pause/resume, provider outage, prolonged post-processing, and a deleted-history event; qB no peers, all useful trackers failed, one tracker failed while download progresses, prolonged metadata, intentional stop, queue wait, healthy idle seeding, file error, collector restart and API failure. Historical November SAB incidents provide real replay fixtures.

## Primary references

- [SABnzbd 5.1 API](https://sabnzbd.org/wiki/configuration/5.1/api): queue/history, stage logs, server status and warnings.
- [SABnzbd switches](https://sabnzbd.org/wiki/configuration/5.1/switches): unrepairable jobs and intended waiting behavior.
- [SABnzbd notifications](https://sabnzbd.org/wiki/configuration/5.1/notifications): separate failure and disk-full events.
- [qBittorrent WebUI API 5.0+](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-%28qBittorrent-5.0%29): torrent state, tracker status, transfer data and execution logs.
- [qB file logger source](https://raw.githubusercontent.com/qbittorrent/qBittorrent/master/src/app/filelogger.cpp), [logger source](https://raw.githubusercontent.com/qbittorrent/qBittorrent/master/src/base/logger.cpp): file logging and bounded memory buffers.
- [qB session source](https://raw.githubusercontent.com/qbittorrent/qBittorrent/master/src/base/bittorrent/sessionimpl.cpp): warning-level file errors.

Documentation establishes available diagnostic data, not current collection. Upstream source can differ from installed versions; validate fields and state spellings against the actual API before implementing a collector. Live NAS evidence above takes precedence for current coverage.
