// Pod health from `kubectl get pods -o json`: which pods are behaving badly, and why.
// No imports, so it runs in the mod and under `node --test`.

const BENIGN_WAITING = new Set(["ContainerCreating", "PodInitializing"]);

// Full `get pods -o json` runs to megabytes (4.5 MB for one 109-pod bank), past
// what a mod should pull through exec every refresh, so kubectl prints one line
// per pod with only the fields podProblems reads:
//   name \t phase \t reason \t unscheduled-reason \t init containers \t containers
// each container as name|restarts|waiting|terminated|last-terminated;
const C = `{{.name}}|{{.restartCount}}|{{with .state.waiting}}{{with .reason}}{{.}}{{end}}{{end}}|{{with .state.terminated}}{{with .reason}}{{.}}{{end}}{{end}}|{{with .lastState.terminated}}{{with .reason}}{{.}}{{end}}{{end}};`;
export const POD_TEMPLATE = `{{range .items}}{{.metadata.name}}\t{{.status.phase}}\t{{with .status.reason}}{{.}}{{end}}\t{{range .status.conditions}}{{if and (eq .type "PodScheduled") (eq .status "False")}}{{with .reason}}{{.}}{{else}}Unschedulable{{end}}{{end}}{{end}}\t{{range .status.initContainerStatuses}}${C}{{end}}\t{{range .status.containerStatuses}}${C}{{end}}\n{{end}}`;

const containers = (field = "") => field.split(";").filter(Boolean).map((c) => {
  const [name, restarts, waiting, terminated, last] = c.split("|");
  return {
    name, restartCount: Number(restarts) || 0,
    state: { waiting: waiting ? { reason: waiting } : undefined, terminated: terminated ? { reason: terminated } : undefined },
    lastState: { terminated: last ? { reason: last } : undefined },
  };
});

// POD_TEMPLATE output back into the `get pods -o json` shape podProblems reads.
export function parsePodLines(text) {
  return { items: (text ?? "").split("\n").filter(Boolean).map((line) => {
    const [name, phase, reason, unscheduled, init, main] = line.split("\t");
    return { metadata: { name }, status: {
      phase, reason: reason || undefined,
      conditions: unscheduled ? [{ type: "PodScheduled", status: "False", reason: unscheduled }] : [],
      initContainerStatuses: containers(init), containerStatuses: containers(main),
    } };
  }) };
}
export const RESTART_LIMIT = 3;

export function podProblems(list) {
  const items = list?.items ?? [];
  const problems = [];
  for (const pod of items) {
    const phase = pod.status?.phase;
    if (phase === "Succeeded") continue;
    const statuses = [...(pod.status?.initContainerStatuses ?? []), ...(pod.status?.containerStatuses ?? [])];
    const restarts = statuses.reduce((n, c) => n + (c.restartCount ?? 0), 0);
    let reason = null, container = null;
    for (const c of statuses) {
      const waiting = c.state?.waiting?.reason;
      const terminated = c.state?.terminated?.reason;
      if (waiting && !BENIGN_WAITING.has(waiting)) { reason = waiting; container = c.name; break; }
      if (terminated && terminated !== "Completed") { reason = terminated; container = c.name; break; }
    }
    if (!reason && phase === "Failed") reason = pod.status?.reason ?? "Failed";
    if (!reason && phase === "Pending") {
      const unscheduled = (pod.status?.conditions ?? []).find((c) => c.type === "PodScheduled" && c.status === "False");
      if (unscheduled) reason = unscheduled.reason ?? "Unschedulable";
    }
    // Running now but has crashed repeatedly: still worth a look.
    if (!reason && restarts >= RESTART_LIMIT) {
      const worst = statuses.reduce((a, c) => ((c.restartCount ?? 0) > (a.restartCount ?? 0) ? c : a));
      const last = worst.lastState?.terminated?.reason;
      reason = last ? `Restarted (${last})` : "Restarting";
      container = worst.name;
    }
    // container: the one to pull logs from, null when the pod never got that far.
    if (reason) problems.push({ name: pod.metadata?.name, reason, restarts, container: container ?? null });
  }
  return { total: items.length, problems };
}
