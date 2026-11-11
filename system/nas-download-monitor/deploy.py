#!/usr/bin/env python3
"""Back up, validate, and deploy the monitor into the existing NAS Grafana stack."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess

from provision import ALLOY, BASE, COMPOSE, alerts, dashboard

SSH = ["ssh", "-p", "2222", "-o", "BatchMode=yes", "ibarsi@192.168.0.39"]
COMPOSE_PATH = "/volume3/docker/configs/portainer/compose/21/docker-compose.yml"


def read_remote(path):
    # Every path here is a fixed checked-in deployment path, never user input.
    return subprocess.run(SSH + ["cat " + path], check=True, text=True, capture_output=True).stdout


REMOTE = r'''
import base64, hashlib, json, os, re, shutil, sqlite3, subprocess, sys, time
from pathlib import Path

D = '/usr/local/bin/docker'
B = Path('/volume3/docker/configs/grafana')
project = Path('/volume3/docker/configs/portainer/compose/21')

def command(args):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    # Do not run compose config without --quiet: its expanded output contains secrets.
    if result.returncode:
        print(result.stdout[-3000:], flush=True)
        raise RuntimeError('Deployment command failed: ' + args[0])
    print('Validated/applied: ' + ' '.join(args[:3]), flush=True)

def compose(*args):
    return [D, 'compose', '-p', 'grafana', '--env-file', str(project/'stack.env'), '-f', str(project/'docker-compose.yml')] + list(args)

def main(payload):
    for path, digest in payload['expected'].items():
        if hashlib.sha256(Path(path).read_bytes()).hexdigest() != digest:
            raise RuntimeError('Live config changed since read; rerun deploy: ' + path)
    stamp = time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())
    backup = B/'backups'/('download-clients-' + stamp)
    stage = backup/'stage'
    stage.mkdir(parents=True, mode=0o700)
    os.chmod(backup, 0o700)
    manifest = {}
    for n, (path, content) in enumerate(payload['files'].items()):
        target = Path(path)
        saved = backup/('original-' + str(n))
        if target.exists():
            shutil.copy2(str(target), str(saved))
            manifest[path] = str(saved)
        else:
            manifest[path] = None
        proposed = stage/str(n)
        proposed.write_text(content)
    (backup/'manifest.json').write_text(json.dumps(manifest, indent=2))

    # Read existing credentials on the NAS only. Nothing secret returns over SSH.
    con = sqlite3.connect('file:/volume3/docker/configs/sonarr/sonarr.db?mode=ro', uri=True)
    settings = json.loads(con.execute("SELECT Settings FROM DownloadClients WHERE Implementation='QBittorrent'").fetchone()[0])
    ini = Path('/volume3/docker/configs/sabnzbd/sabnzbd.ini').read_text()
    def setting(name):
        match = re.search(r'^' + re.escape(name) + r'\s*=\s*(.*?)\s*$', ini, re.M)
        if not match:
            raise RuntimeError('Missing SAB configuration field: ' + name)
        return match.group(1).strip('"')
    def size(text):
        match = re.fullmatch(r'([0-9.]+)([KMGT]?)', text.upper())
        if not match:
            raise RuntimeError('Unsupported disk reserve format')
        return float(match.group(1)) * 1024 ** (' KMGT'.index(match.group(2)) if match.group(2) else 0)
    secrets = {'sab_url':'http://192.168.0.39:8089', 'sab_key':setting('api_key'),
               'qb_url':'http://192.168.0.39:8090', 'qb_username':settings['username'], 'qb_password':settings['password'],
               'reserve_bytes':{'temporary':size(setting('download_free')), 'completed':size(setting('complete_free'))}}
    secrets_path = B/'download-client-monitor'/'secrets.json'
    secret_backup = backup/'secrets.original'
    if secrets_path.exists():
        shutil.copy2(str(secrets_path), str(secret_backup))
    # Remote-only preflight verifies credentials before changing any running service.
    import http.cookiejar, urllib.request, urllib.parse
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    req = urllib.request.Request(secrets['qb_url']+'/api/v2/auth/login', data=urllib.parse.urlencode({'username':secrets['qb_username'],'password':secrets['qb_password']}).encode(), headers={'Referer':secrets['qb_url']})
    op.open(req, timeout=10).read()
    req = urllib.request.Request(secrets['qb_url']+'/api/v2/app/version', headers={'Referer':secrets['qb_url']})
    print('Authenticated qB API version: ' + op.open(req, timeout=10).read().decode(), flush=True)
    url = secrets['sab_url']+'/api?'+urllib.parse.urlencode({'mode':'queue','limit':0,'output':'json','apikey':secrets['sab_key']})
    with urllib.request.urlopen(url, timeout=10) as response:
        print('Authenticated SAB API version: ' + str(json.load(response)['queue']['version']), flush=True)

    # Validate staged source with the exact currently running images, without installing packages.
    def image(container):
        return subprocess.check_output([D,'inspect',container,'--format','{{.Image}}'],universal_newlines=True).strip()
    paths = list(payload['files'])
    def staged(path):return str(stage/str(paths.index(path)))
    command([D,'run','--rm','--user','1026:101','--network','none','--entrypoint','/bin/promtool','-v',staged(str(B/'prometheus.yml'))+':/etc/prometheus/prometheus.yml:ro',image('prometheus'),'check','config','/etc/prometheus/prometheus.yml'])
    command([D,'run','--rm','--user','1026:101','--network','none','-v',staged(str(B/'config.alloy'))+':/etc/alloy/config.alloy:ro',image('grafana-alloy'),'validate','/etc/alloy/config.alloy'])
    for path in paths:
        if path.endswith('.json'):
            command(['jq','empty',staged(path)])
    monitor = B/'download-client-monitor'
    monitor.mkdir(exist_ok=True)
    (monitor/'state').mkdir(exist_ok=True,mode=0o700)
    secret_temp = monitor/'secrets.tmp'
    secret_temp.write_text(json.dumps(secrets))
    os.chmod(secret_temp,0o600)
    secret_temp.replace(secrets_path)
    applied = False
    try:
        applied = True
        for n, (path, content) in enumerate(payload['files'].items()):
            target = Path(path)
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_name(target.name+'.download-monitor-tmp')
            temporary.write_text(content)
            if target.exists():
                os.chmod(temporary, target.stat().st_mode & 0o777)
            else:
                os.chmod(temporary,0o644)
            temporary.replace(target)
        command(compose('config','--quiet'))
        command(compose('up','-d','--no-deps','--force-recreate','--pull','never','download-client-monitor','alloy','prometheus'))
        command([D,'restart','grafana'])
        healthy = False
        for attempt in range(24):
            try:
                with urllib.request.urlopen('http://192.168.0.39:3340/api/health', timeout=2) as response:
                    if json.load(response).get('database') != 'ok':
                        raise RuntimeError('Grafana database not ready')
                ip = subprocess.check_output([D,'inspect','download-client-monitor','--format','{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'],universal_newlines=True).strip()
                with urllib.request.urlopen('http://'+ip+':9813/metrics', timeout=2) as response:
                    metrics = response.read().decode()
                if not all('download_client_api_up{client="'+client+'"} 1.0' in metrics for client in ['sabnzbd','qbittorrent']):
                    raise RuntimeError('Client collection not ready')
                with urllib.request.urlopen('http://192.168.0.39:9090/-/ready', timeout=2) as response:
                    response.read()
                healthy = True
                break
            except Exception:
                time.sleep(2)
        if not healthy:
            raise RuntimeError('Monitoring failed post-deploy health checks; rolling back')
        print('BACKUP=' + str(backup), flush=True)
        print('Applied. Verify fresh Prometheus targets, Grafana evaluation, monitor /status and Loki ingestion.', flush=True)
    except Exception:
        if applied:
            for path, saved in manifest.items():
                if saved:
                    shutil.copy2(saved,path)
                    if path.endswith('/download-client-alerts.json'):
                        previous = json.loads(Path(path).read_text())
                        for group in previous.get('groups',[]):
                            for rule in group['rules']:
                                rule['version'] = rule.get('version',0) + 2
                        Path(path).write_text(json.dumps(previous,indent=2)+'\n')
                elif path.endswith('/download-client-alerts.json'):
                    created = json.loads(payload['files'][path])
                    deleted = {'apiVersion':1, 'deleteRules':[{'orgId':1,'uid':r['uid']} for g in created['groups'] for r in g['rules']]}
                    Path(path).write_text(json.dumps(deleted,indent=2)+'\n')
                elif Path(path).exists():
                    Path(path).unlink()
            if secret_backup.exists():
                shutil.copy2(str(secret_backup),str(secrets_path))
            elif secrets_path.exists():
                secrets_path.unlink()
            services = ['alloy','prometheus']
            if manifest.get(str(B/'download-client-monitor'/'monitor.py')):
                services.append('download-client-monitor')
            else:
                subprocess.run([D,'rm','-f','download-client-monitor'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            command(compose('up','-d','--no-deps','--force-recreate','--pull','never',*services))
            command([D,'restart','grafana'])
        raise
'''


def main():
    compose = read_remote(COMPOSE_PATH)
    alloy = read_remote(BASE + "/config.alloy")
    prom = read_remote(BASE + "/prometheus.yml")
    routing = read_remote(BASE + "/provisioning/alerting/nas-sre-routing.yaml")
    originals = {COMPOSE_PATH: compose, BASE + "/config.alloy": alloy, BASE + "/prometheus.yml": prom,
                 BASE + "/provisioning/alerting/nas-sre-routing.yaml": routing}
    if "  # BEGIN download-client-monitor" in compose:
        before, rest = compose.split("  # BEGIN download-client-monitor", 1)
        _, after = rest.split("  # END download-client-monitor\n", 1)
        compose = before.rstrip() + "\n" + COMPOSE + after
    else:
        assert compose.count("\nnetworks:\n") == 1
        compose = compose.replace("\nnetworks:\n", "\n" + COMPOSE + "\nnetworks:\n")
    mount = "      - /volume3/docker/configs/qbittorrent/qBittorrent/logs:/var/log/qbittorrent:ro\n"
    if mount not in compose:
        anchor = "      - /volume3/docker/configs/bazarr/log:/var/log/bazarr:ro\n"
        assert compose.count(anchor) == 1
        compose = compose.replace(anchor, anchor + mount)
    marker = "// Download-client execution events. SAB messages already arrive via Docker."
    if marker in alloy:
        alloy = alloy.split(marker, 1)[0].rstrip() + "\n"
    alloy += "\n" + ALLOY
    if "job_name: download-client-monitor" not in prom:
        prom += "\n  - job_name: download-client-monitor\n    scrape_interval: 30s\n    scrape_timeout: 10s\n    static_configs:\n      - targets: ['download-client-monitor:9813']\n"
    if "      - download_clients\n" not in routing:
        anchor = "  routes:\n"
        assert routing.count(anchor) == 1
        routing = routing.replace(anchor, anchor + "  - receiver: grafana-default-email\n    object_matchers:\n    - - incident_group\n      - '='\n      - download_clients\n    group_by:\n    - grafana_folder\n    - incident_group\n    - client\n    - name\n    group_wait: 60s\n    group_interval: 5m\n    repeat_interval: 12h\n")
    rules = alerts()
    dash = dashboard()
    for path, data in ((BASE + "/provisioning/alerting/download-client-alerts.json", rules),
                       (BASE + "/provisioning/dashboards/synology/download-clients.json", dash)):
        existing = subprocess.run(SSH + ["test -f " + path + " && cat " + path], text=True, capture_output=True)
        if existing.returncode == 0:
            originals[path] = existing.stdout
            old = json.loads(existing.stdout)
            if "groups" in data:
                versions = {r["uid"]: r.get("version", 0) for g in old["groups"] for r in g["rules"]}
                for group in data["groups"]:
                    for rule in group["rules"]:
                        rule["version"] = versions.get(rule["uid"], 0) + 1
            else:
                data["version"] = old.get("version", 0) + 1
    files = {COMPOSE_PATH: compose, BASE + "/config.alloy": alloy, BASE + "/prometheus.yml": prom,
             BASE + "/provisioning/alerting/nas-sre-routing.yaml": routing,
             BASE + "/download-client-monitor/monitor.py": Path(__file__).with_name("monitor.py").read_text(),
             BASE + "/provisioning/alerting/download-client-alerts.json": json.dumps(rules, indent=2) + "\n",
             BASE + "/provisioning/dashboards/synology/download-clients.json": json.dumps(dash, indent=2) + "\n"}
    payload = {"expected": {p: hashlib.sha256(s.encode()).hexdigest() for p, s in originals.items()}, "files": files}
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    script = REMOTE + "\nmain(json.loads(base64.b64decode(" + repr(encoded) + ")))\n"
    result = subprocess.run(SSH + ["python3 -"], input=script, text=True)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
