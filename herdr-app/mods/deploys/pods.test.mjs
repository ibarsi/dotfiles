import { test } from "node:test";
import assert from "node:assert/strict";
import { podProblems, parsePodLines } from "./pods.js";

const pod = (name, status) => ({ metadata: { name }, status });
const running = (restartCount = 0, lastState = {}) => ({ phase: "Running", containerStatuses: [{ name: "app", restartCount, state: { running: {} }, lastState }] });

test("healthy, starting and completed pods aren't problems", () => {
  const r = podProblems({ items: [
    pod("ok", running()),
    pod("starting", { phase: "Pending", containerStatuses: [{ state: { waiting: { reason: "ContainerCreating" } } }] }),
    pod("job", { phase: "Succeeded" }),
    pod("init-done", { phase: "Running", initContainerStatuses: [{ state: { terminated: { reason: "Completed" } } }], containerStatuses: [{ state: { running: {} } }] }),
  ] });
  assert.deepEqual(r, { total: 4, problems: [] });
});

test("waiting and terminated reasons surface with total restarts", () => {
  const r = podProblems({ items: [
    pod("crash", { phase: "Running", containerStatuses: [{ name: "app", restartCount: 7, state: { waiting: { reason: "CrashLoopBackOff" } } }] }),
    pod("pull", { phase: "Pending", containerStatuses: [{ name: "app", restartCount: 0, state: { waiting: { reason: "ImagePullBackOff" } } }] }),
    pod("init-fail", { phase: "Pending", initContainerStatuses: [{ name: "migrate", restartCount: 2, state: { terminated: { reason: "Error" } } }] }),
  ] });
  assert.deepEqual(r.problems, [
    { name: "crash", reason: "CrashLoopBackOff", restarts: 7, container: "app" },
    { name: "pull", reason: "ImagePullBackOff", restarts: 0, container: "app" },
    { name: "init-fail", reason: "Error", restarts: 2, container: "migrate" },
  ]);
});

test("unschedulable, failed and repeatedly restarted pods are flagged", () => {
  const r = podProblems({ items: [
    pod("pending", { phase: "Pending", conditions: [{ type: "PodScheduled", status: "False", reason: "Unschedulable" }] }),
    pod("evicted", { phase: "Failed", reason: "Evicted" }),
    pod("flappy", running(4, { terminated: { reason: "OOMKilled" } })),
    pod("twice", running(2, { terminated: { reason: "OOMKilled" } })),
  ] });
  assert.deepEqual(r.problems.map((p) => [p.name, p.reason, p.container]), [
    ["pending", "Unschedulable", null],
    ["evicted", "Evicted", null],
    ["flappy", "Restarted (OOMKilled)", "app"],
  ]);
});

test("missing list reads as no pods", () => {
  assert.deepEqual(podProblems(null), { total: 0, problems: [] });
});

test("template lines parse back into what podProblems reads", () => {
  const out = [
    "ok\tRunning\t\t\tistio-init|0|||;\tapp|0|||;",
    "schema-x\tPending\t\t\tistio-init|0||Completed|;fetch-admin-password|0||Error|;\tmigrate|0|PodInitializing||;",
    "flappy\tRunning\t\t\t\tapp|5|||OOMKilled;",
    "stuck\tPending\t\tUnschedulable\t\t",
    "evicted\tFailed\tEvicted\t\t\t",
  ].join("\n") + "\n";
  assert.deepEqual(podProblems(parsePodLines(out)), { total: 5, problems: [
    { name: "schema-x", reason: "Error", restarts: 0, container: "fetch-admin-password" },
    { name: "flappy", reason: "Restarted (OOMKilled)", restarts: 5, container: "app" },
    { name: "stuck", reason: "Unschedulable", restarts: 0, container: null },
    { name: "evicted", reason: "Evicted", restarts: 0, container: null },
  ] });
});
