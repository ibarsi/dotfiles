# Hardware Benchmarking

`benchall` (`system/.functions`) runs a bounded (~3 minute) sweep across
network, disk, RAM, CPU, GPU, and thermals, then prints a Markdown report to
stdout and saves a copy under `~/.cache/benchall/`.

```bash
benchall                  # full run
benchall --no-net         # skip the internet speed test (metered connections)
benchall --help
```

Progress goes to stderr and the report to stdout, so it pipes straight into an
agent:

```bash
benchall | claude -p "analyze this benchmark for bottlenecks"
```

Design notes:

- Every section is wrapped in `timeout`, so no single test can hang the run.
- Privileged sections (raw-device read, SMART) prime `sudo` once up front only
  when a TTY is attached, then use `sudo -n`. An agent-driven run degrades to
  "skipped" instead of blocking on a password prompt.

- Missing tools are reported as skipped sections rather than failing the run.
- fio writes its scratch file under `~/.cache/benchall`, never `/tmp`. On Arch
  `/tmp` is tmpfs, i.e. RAM: it **silently ignores `O_DIRECT`** rather than
  rejecting it, so `--direct=1` would return memcpy speed (measured: 5.5 GB/s
  on tmpfs vs 2.7 GB/s on the real btrfs volume) and quietly consume 1 GB of
  RAM.

- Nothing on the system sweeps `~/.cache`, so `benchall` cleans up after
  itself on every run: it deletes any 1 GB scratch file orphaned by an
  interrupted run, and retains only the 20 most recent reports (~20 KB each).
  Reports deliberately do not live in `/tmp` either — that is cleared on
  reboot and after 10 days by `systemd-tmpfiles-clean.timer`, which would
  destroy the run history you keep them for.

Install the toolchain on Omarchy/Arch. Only five tools have no
already-installed equivalent:

```bash
omarchy pkg add fio stress-ng smartmontools speedtest-cli vkmark
```

| Package | Why it earns its place |
|---|---|
| `fio` | Only source of random 4K IOPS at queue depth; `dd` cannot do it |
| `stress-ng` | STREAM memory bandwidth **and** CPU throughput, so no separate `sysbench` |
| `smartmontools` | Only source of NVMe wear level and health |
| `speedtest-cli` | Only source of WAN throughput |
| `vkmark` | Only actual GPU render benchmark; `nvtop`/`nvidia-smi` only monitor |

Deliberately not installed, because something already on the system covers it:

| Skipped | Covered by |
|---|---|
| `dmidecode` | `inxi -Fxxxzm` reads `/sys/firmware/dmi/tables` for DIMM speed/part-no, no root needed |
| `sysbench` | `stress-ng --cpu` |
| `s-tui` | `btop` |
| `glmark2`, `mesa-utils` | `vkmark`; OpenGL is legacy next to Vulkan on a modern Wayland box |
| `hyperfine`, `7zip` | Not used by `benchall` — `hyperfine` benchmarks *your* commands, a different job |

Optional extras: `hdparm` (raw-device read, versus fio's through-filesystem
read) and `vulkan-tools` (device enumeration; `vkmark` already prints the
device it selected). `iperf3` is unrelated to `benchall` but is required by
the existing `netspeed` function.

Note on `speedtest-cli`: it is single-threaded Python and undershoots badly
above ~1 Gbps. If your link is faster than that, use Ookla's official client
instead:

```bash
omarchy pkg aur add ookla-speedtest-bin
```

The AUR package is `ookla-speedtest-bin` (there is no package named
`speedtest`), it installs the binary as `speedtest`, and it **conflicts with
`speedtest-cli`** — pacman will offer to remove that one. `benchall` prefers
`speedtest` when present and falls back to `speedtest-cli`, so either package
works without further configuration. The Ookla client is invoked with
`--accept-license --accept-gdpr` so an unattended run never blocks on its
first-run prompt.

The implementation lives in `system/.functions`, loaded by the [shared shell layer](../README.md). This toolchain setup targets Omarchy/Arch; missing tools on other hosts are reported as skipped.

[Omarchy setup](../../omarchy/README.md) · [System topic](../README.md)
