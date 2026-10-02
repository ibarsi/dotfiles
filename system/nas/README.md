# NAS Arr queue monitoring

[arr-queue-exporter.py](arr-queue-exporter.py) exposes completed Sonarr/Radarr downloads whose queue status says automatic import is not possible. It reads queues; it never imports or deletes anything.

## Deployment requirements

This folder has no bootstrap installer or Compose stack. Deploy the Python script in the NAS monitoring environment with Python 3 and network access to both Arr APIs. Mount the application config directories read-only at `/sonarr-config` and `/radarr-config`; the exporter reads `ApiKey` from each `config.xml` rather than keeping keys in this repo.

Run `python3 arr-queue-exporter.py` in that environment. It listens on `0.0.0.0:9808`. Keep access restricted to the monitoring network; the script has no HTTP authentication. Deployment/service lifecycle is managed outside this checkout.

## Configuration

| Variable | Default |
|---|---|
| `SONARR_URL` | `http://192.168.0.39:8989` |
| `RADARR_URL` | `http://192.168.0.39:7878` |

The config mount paths and listener port are fixed in the script. Each scrape fetches up to 1000 queue records per app, with a 10-second API timeout.

## Metrics and verification

- `arr_queue_monitor_up{app="sonarr|radarr"}` reports whether API access and config reading succeeded.
- `arr_queue_attention_required{app,reason="automatic_import_not_possible"}` counts distinct affected downloads.

Scrape `/metrics` and inspect both metrics. `/` and `/-/healthy` return the same metric body and HTTP 200 even when an Arr API fails; a 200 response alone does not prove the upstream applications are reachable. When `monitor_up` is zero, the attention count is also zero and must not be read as a clean queue.

## Troubleshooting

Check read-only config mounts, `ApiKey` presence, URL overrides and network reachability. Compare counts with the application's queue. Labels are bounded app/reason values and omit download titles and IDs. API failures are represented in metrics rather than request logs.

[Shared system topic](../README.md) · [Repository index](../../README.md)
