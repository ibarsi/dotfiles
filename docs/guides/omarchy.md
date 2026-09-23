# Omarchy Guide

Setup and behavior specific to [Omarchy](https://omarchy.org/) (Arch Linux /
Hyprland) and other Bash-based Linux hosts. Content that applies to both
Omarchy and macOS lives in [workflows.md](workflows.md) instead; see the
[macOS guide](macos.md) for the Mac side.

## Bootstrap

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap-omarchy.sh
```

Unlike `bootstrap.sh`, this is deliberately **additive**: it does not install
packages, apply macOS-style defaults, or change the default shell. It runs
six steps, each of which layers onto Omarchy's own configuration instead of
replacing it:

1. Sets up the shared Bash aliases/functions layer (`bash/install.sh`),
   sourced from an existing `~/.bashrc` rather than replacing it.
2. Adds portable Git aliases (`git/install-aliases.sh`) without touching the
   rest of `~/.gitconfig`.
3. Links Gitmoji preferences to `~/.config/gitmoji-nodejs/config.json`
   (`gitmoji/install.sh`).
4. Links the tmux config (`tmux/install.sh`), which sources Omarchy's own
   tmux base first when present.
5. Links the shared Starship prompt (`theme/install-starship.sh`) to
   `~/.config/starship.toml` — see below.
6. Schedules the VoxType vocabulary sync (`voice-to-text/install.sh`) via a
   systemd user timer.

Re-run it any time from any working directory; it resolves the repo root
internally.

See the platform matrix in the top-level [README](../../README.md) for which
of the other 15 topics are intentionally *not* wired up here — those tools are
managed natively through Omarchy itself rather than through this repo.

## Starship Prompt

Omarchy uses the same Catppuccin Mocha prompt as macOS — `theme/starship.toml`
is symlinked to `~/.config/starship.toml`, so edits there apply to both. The
`os` module reports Omarchy as `Linux`, which maps to the Arch icon. The
prompt keeps its fixed Catppuccin colours rather than following
`omarchy theme set`.

## Hardware Benchmarking

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

## Directories

- `bash/` — additive Bash shell configuration; bootstrap links its fragment
  under `~/.config/ibarsi-dotfiles/` and sources it from the existing
  `~/.bashrc` without replacing Omarchy defaults.
- `gitmoji/` — on Linux, linked to `~/.config/gitmoji-nodejs/config.json`.
- `theme/` — only `starship.toml` is used on Linux, linked to
  `~/.config/starship.toml`.
- `voice-to-text/` — on Omarchy, a systemd user timer regenerates VoxType's
  vocabulary from a project glossary file. See `voice-to-text/README.md` for
  the full TypeWhisper/VoxType setup on both platforms.
