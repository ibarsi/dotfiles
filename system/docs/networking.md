# Networking Workflow

This repo includes a lightweight, practical network-debug toolkit for daily use.

**Added tools (Brewfile):**

- `doggo` — modern DNS client (`dig` alternative)
- `mtr` — traceroute + ping combined
- `iperf3` — throughput testing

Use the shared aliases for basics (`ip`, `lip`, `ips`) and call modern tools directly (`doggo`, `curl`, `tcpdump`). `flushdns` is macOS-only. On macOS, `flushdns` runs both `dscacheutil` and `mDNSResponder` refresh.

**Network functions (`system/.functions`):**

- `dnstrace <domain>` — DNS trace path
- `httptime <url>` — DNS/connect/TLS/TTFB/total timing
- `listeners` — compact open listener view
- `nclisten [port]` / `ncprobe <host> <port>` — netcat helpers
- `pcap [iface] [file] [filter...]` — capture packets to `.pcap` (for Wireshark/offline analysis)
- `sniffweb [iface]` — quick live console view for web ports (80/443), no file output
- `netpath <host>` — MTR report (20 cycles, quick path/latency snapshot)
- `netspeed <iperf3-server> [seconds]` — iperf3 client run

This keeps the setup lean: mostly thin wrappers over proven tools, with sensible defaults.

These helpers are loaded by the [shared shell layer](../README.md); macOS packages come from `Brewfile`, while Linux packages are host-managed.

## SSH compatibility

Keep SSH host definitions in your machine-local `~/.ssh/config`; bootstrap does not create or symlink that file.

Use `sshx` for remote hosts that mishandle Ghostty's `xterm-ghostty` terminal type. The shared shell helper runs SSH with `TERM=xterm-256color`:

- `sshx user@host`
- `sshx -p 2222 user@host`

[System topic](../README.md)
