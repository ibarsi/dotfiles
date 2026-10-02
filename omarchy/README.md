# Omarchy and Linux setup

Additive setup for Omarchy (Arch Linux / Hyprland) and other Bash-based Linux hosts. This folder documents the root bootstrap; it has no installer of its own.

## Bootstrap

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap-omarchy.sh
```

The bootstrap resolves its repository root internally. It does not install packages or change your login shell. Its nine steps are:

1. Load the shared shell layer through [additive Bash](../bash/README.md).
2. Add [Git aliases and optional delta](../git/README.md#configuration) without replacing the host config.
3. Import [GitHub CLI aliases](../gh/README.md) when `gh` is available.
4. Link [Gitmoji preferences](../gitmoji/README.md).
5. Link [tmux](../tmux/README.md), preserving the Omarchy base configuration.
6. Link [Herdr config and sidebar service](../herdr/README.md).
7. Link [llama presets and copy its systemd unit](../llama/README.md); root authentication is needed only when the unit drifts.
8. Link the shared [Starship prompt](../theme/README.md#starship).
9. Configure [VoxType vocabulary sync](../voice-to-text/README.md#omarchy---voxtype).

Re-running is safe, but Herdr and vocabulary installers may restart their services. The llama installer restarts its server when it updates the unit.

## Prerequisites and platform boundaries

Install required applications through the host package manager before running their setup. The shell initializes zoxide, Starship and mise only when available; GitHub aliases skip when `gh` is missing. Herdr/sidebar, tmux, llama.cpp and VoxType need their respective tools installed to work. Follow the topic README for service and model prerequisites.

Other app configs remain host-managed. Consult the generated [platform matrix](../README.md#platform-support) for exactly which installers run; a macOS-only installer does not mean its portable shell helpers are unavailable on Linux.

## Hardware benchmarking

See [benchall and its Arch toolchain](../system/docs/benchmarking.md) for usage, dependencies, timeout behavior and saved reports.

## Verification

Start a fresh Bash shell and confirm the shared helpers load. Inspect tmux/Herdr links and the user services described in their READMEs. Run `mise run bootstrap-verify` and `mise run ai-doctor` from the repository root; these checks may report intentionally host-managed tools or incomplete prerequisites.

[Repository index](../README.md)
