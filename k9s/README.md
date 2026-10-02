# k9s

macOS-installed Kubernetes TUI settings; Omarchy keeps its native configuration.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash k9s/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[config.yaml](config.yaml) is linked to `~/Library/Application Support/k9s/config.yaml`. The installer backs up an existing regular file before linking.

The config selects `catppuccin-mocha`, tails 1000 log lines, buffers 10000, and wraps log text. The [theme installer](../theme/README.md#installation) downloads the matching skin into the same directory’s `skins/` subfolder.

## Verification

Inspect `readlink "$HOME/Library/Application Support/k9s/config.yaml"`. With a configured Kubernetes context, open `k9s` and inspect its theme and log view.

## Related documentation

[Kubernetes shell helpers](../system/docs/kubernetes.md)

[Repository index](../README.md)
