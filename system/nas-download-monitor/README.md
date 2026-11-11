# NAS download-client monitoring

Read-only monitoring for SABnzbd and qBittorrent on the Synology NAS. It extends the existing Grafana stack; it is not installed by the workstation bootstrap.

Open [NAS Download Clients](http://192.168.0.39:3340/d/nas-download-clients) or navigate to **Grafana → Dashboards → NAS → NAS Download Clients**. Expand a diagnostic event for the affected job, state, observed stall duration, available pieces, seeds/peers, and tracker failure messages. The job table contains the latest snapshot for each job in the selected time range; removed jobs may remain as historical rows. Current job counts come from the state metrics.

## Behavior

- Poll both authenticated APIs every minute; Prometheus scrapes cached metrics every 30 seconds. Scrapes do not trigger application calls. The internal service exposes `/metrics`, `/status`, and `/-/healthy` on port 9813, with no published host port.
- Warn after **45 minutes of continuously observed no progress** in an eligible active download or metadata acquisition. Upload activity does not reset the download timer. Explicit stops/pauses, ordinary queue waiting, completed seeding, checks and moves are excluded from torrent stall detection. A short monitor restart preserves the timer; gaps longer than three minutes reset it because the missing interval was not observed.
- Give SAB post-processing a separate **two-hour** threshold, reset by stage/action changes. Pause-on-post-processing suppresses download-stall warnings while repair/unpack runs. Terminal history records retain redacted stage details. Failed article acquisition, repair, unpack, scripts, NZB fetches and storage errors have bounded reason categories.
- Collect SAB queue, ordinary/archived recent history, active post-processing, warnings, provider errors and directory free space. A local log follower supplies fallback failure evidence when Arr deletes history between polls. Old history/logs are baselined at first startup rather than generating a burst of historical failure alerts. API and log evidence can describe the same job and are explicitly counted as **evidence**, not distinct failed jobs.
- Track qB download bytes/progress, metadata and transfer states, availability, connected seeds/peers, and individual tracker status/messages. One bad tracker does not trigger an alert. `tracker_blocked` additionally requires a sustained incomplete-download stall, no connected peers, and every actual tracker failing; the general stall warning also catches failures where a nominally working tracker cannot supply usable pieces.
- Emit job snapshots every 15 minutes and on issue transitions. Detailed current state refreshes every minute at the internal `/status` endpoint. Global SAB status emits on change and every 15 minutes. Removing a job clears its count from the next metrics snapshot; disappearance is not proof of successful completion.
- Send new failure-evidence warnings for a 30-minute window. Their resolution means the window expired, not that a replacement succeeded. Current blockage resolves when the observed condition clears. Existing email routing groups the new rules by client (or container name) with a 12-hour repeat interval.
- Keep the existing SAB Docker→Alloy→Loki path. Add a read-only qB execution-log mount and Alloy follower with original event timestamps. URLs/magnets, credential assignments and network addresses are redacted before the new file stream enters Loki. Existing SAB Docker logs are retained under the existing policy.
- Monitor collector/API freshness, history/log coverage gaps, low directory reserves, qB file-operation errors, and actual downloader/VPN cgroup OOM/restart counters. The older panic/fatal log-language rule remains separate and does not prove a crash.

Thresholds are in [provision.py](provision.py). Low-space reserves are copied from SAB's live `download_free` and `complete_free` settings at deployment. Change them in SAB and redeploy to refresh the monitoring values. Pending timers in Grafana add one or two minutes to most warnings. No reannounce, resume, cleanup, deletion or download retry is automated.

## Files and deployment

- [monitor.py](monitor.py): stdlib collector, persistent observation/episode state and cached HTTP service.
- [provision.py](provision.py): Compose service, Alloy pipeline, nine alert rules, and dashboard definition.
- [deploy.py](deploy.py): NAS-specific, backed-up deployment into Portainer stack 21 (`grafana` project).
- [test_monitor.py](test_monitor.py): controlled-time failure/recovery fixtures, authentication and provisioning checks.
- [Historical audit](../docs/research/2026-11-11-download-client-observability.md): evidence before implementation. Its qB authentication/version limitations were subsequently resolved; the application API reports v5.2.3 and accepts HTTP 204 login with a session cookie.

From the repository root:

```sh
rtk proxy python3 -m unittest discover -s system/nas-download-monitor -p 'test_*.py'
rtk proxy python3 system/nas-download-monitor/deploy.py
```

Deployment reads current live files, checks their hashes for concurrent edits, backs them up outside watched provisioning, and validates staged Prometheus/Alloy configuration with the running images. It checks JSON and Compose configuration, increments existing rule/dashboard versions, recreates only Alloy, Prometheus and the monitor, then restarts Grafana. Downloader and VPN containers stay running. Post-deploy readiness checks roll back configuration if Grafana, Prometheus or authenticated client collection cannot become ready. Follow with the fresh evaluation and ingestion checks below; readiness does not replace them.

On the NAS, `/volume3/docker/configs/grafana/download-client-monitor/` holds the collector, private `secrets.json`, and `/state/state.json`. Deployment extracts the SAB API key and existing Sonarr qB integration credentials **on the NAS**, into a mode-0600 file; no secret values are transferred to this checkout. The service runs as UID 1026/GID 101, with a read-only root filesystem, dropped capabilities, 96 MiB memory limit, and a writable state directory. Application credentials permit broader operations than monitoring needs; the code limits requests to reads plus qB session login. Rotate keys/passwords in the owning apps and integration, then redeploy to refresh the private copy.

Bounded metric labels are client, state, reason, source, direction and directory. Job names, hashes, URLs and peer addresses are not Prometheus labels. Redacted names/IDs and tracker hosts remain in internal status and diagnostic events for investigation. The existing Loki and Prometheus retention configuration is 60 days; local monitor episode deduplication is also 60 days, and disappeared observation records expire after one day. Counters persist across restarts. API log exceptions report only their class, avoiding credential-bearing URLs.

## Verification and recovery

1. Confirm `download-client-monitor`, Prometheus and Grafana are healthy, Alloy is running, and downloader start times are unchanged.
2. In Prometheus, verify `up{job="download-client-monitor"}` and both `download_client_api_up` values are 1. Check successful poll age, `download_client_history_complete`, SAB log-source health and log backlog.
3. In Grafana **Alerting → Alert rules**, search `Download client` and `Downloader container`. Inspect the `download-client-health` group for fresh evaluations and no errors. Execute the exact installed expressions for any suspicious state.
4. In Explore, confirm fresh `{job="qbittorrent"}` file events and `{job="docker",container="download-client-monitor"}` JSON snapshots. Check original event timestamps and redaction. Ordinary qB API login events provide a harmless fresh file-log check.
5. Open the dashboard, inspect the table/log panels and compare current state counts with the client WebUIs. Eligible no-progress ages should increase on successive polls, then reset when bytes/progress change. Allow 45 minutes plus the Grafana pending period for a real new stall warning; controlled-time fixtures test that boundary without manufacturing live download failures or sending test emails.

Backups are under `/volume3/docker/configs/grafana/backups/download-clients-<UTC timestamp>/`, mode 0700. Each `manifest.json` maps an original path to its saved copy, or null for a newly created file. The first successful deployment used `download-clients-20261111T173002Z`.

For rollback, restore the manifest's saved files, remove newly created provisioned files, remove the monitor container, restore/remove the private credentials from `secrets.original` as appropriate, recreate only Alloy and Prometheus using the restored stack 21 Compose file, and restart Grafana. Preserve `/state` while diagnosing. Grafana can retain already-created provisioned rules after their source file is removed: explicitly remove the nine `dl_*` rules through supported Grafana provisioning/API deletion, then verify the group is gone and the remaining rules still evaluate. Do not remove unrelated alerts or client data. Reapplying a fixed deployment is preferable to manually editing the collector in place.

## Capacity and evidence limits

SAB history polling is capped at ten pages of 200 records per archive view, with a persisted watermark and an overlap window. If recent history exceeds that capacity, the collector exposes incomplete coverage rather than claiming success. Queue enumeration above 1,000 jobs fails visibly. Log reads are capped at 2 MiB per file per poll; backlog, lost rotation and skipped intermediate rotations surface coverage warnings. These limits fit the current small queue and keep resource use bounded; they are not a guarantee that every short-lived record survives deletion/rotation. A corrupt state file fails visibly rather than silently replaying old failures.

qB tracker requests are per incomplete torrent. Large queues or slow API responses can exceed the normal poll interval; stale collection and API alerts expose that condition. Tracker statistics are reports, not proof that complete usable data is reachable. A healthy process/WebUI/API also does not establish that an individual job can complete. The UI retains its own repair/error details for investigation.

API semantics: [SABnzbd 5.1 API](https://sabnzbd.org/wiki/configuration/5.1/api), [qBittorrent WebUI API 5.0+](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-%28qBittorrent-5.0%29). Validate new application versions before changing state mappings or authentication handling.
