# ssh

SSH client configuration is installed on macOS. The shared `sshx` helper is available in both shell layers.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash ssh/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## SSH Workflow

Use `sshx` instead of `ssh` for remote hosts that mis-handle Ghostty's default `xterm-ghostty` terminal type.

- `sshx user@host` → run SSH with `TERM=xterm-256color`
- `sshx -p 2222 user@host` → same behavior with explicit port/flags

This is mainly useful for older appliances and NAS shells that render broken line editing or arrow-key behavior over SSH.

The Synology NAS is available as `nas` (`ssh nas`), and the Omen host is pinned as `omen` (`ssh omen`).

## Managed configuration

[config](config) is linked to `~/.ssh/config`. It contains GitHub and the `nas`/`omen` host definitions; keep credentials outside the repository.

## Verification

Check `readlink ~/.ssh/config`, then inspect resolved host settings with `ssh -G nas` or `ssh -G omen` without opening a connection.

## Related documentation

[Ghostty terminal compatibility](../ghostty/README.md#option-arrow-integration) · [Omen tmux sessions](../zsh/README.md#omen-remote-sessions)

[Repository index](../README.md)
