# Kubernetes Workflow

`kubectl`, `k9s`, and `jq` are installed from `Brewfile`; the shell adds a small Kubernetes shortcut set for common inspect, log, rollout, and context-switching work.

**Kubernetes aliases (`system/.aliases`):**

- `k` -> `kubectl`
- `kgp` / `kgpa` -> get pods in the current namespace / all namespaces
- `kd` -> describe resources
- `klf` / `klp` -> follow logs with a 1000-line tail / show previous container logs
- `kex` -> interactive exec
- `ke` -> cluster events
- `krs` / `krr` -> rollout status / restart
- `kctx` / `kctxs` / `kuc` / `kns` -> show context, list contexts, switch context, or set the current namespace

**Kubernetes functions (`system/.functions`):**

- `klogj <pod|resource/name> [kubectl logs flags...]` -> follow logs through `jq` in `less`, pretty-printing JSON lines while leaving plain text untouched

Use `KLOG_TAIL=200 klogj pod/my-pod -n my-namespace` to override the default 1000-line tail for a single command.
Inside `less`, press `Ctrl-C` to pause live follow mode, `/` to search, and `Shift-F` to resume following.

See [k9s](../../k9s/README.md) for the TUI configuration. On Linux, install the prerequisite binaries through the host package manager.

These helpers are loaded by the [shared shell layer](../README.md); macOS packages come from `Brewfile`, while Linux packages are host-managed.

[System topic](../README.md)
