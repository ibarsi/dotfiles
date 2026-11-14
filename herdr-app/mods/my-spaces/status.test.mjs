// node --test herdr-app/mods/my-spaces/status.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { prStatus } from "./status.js";

const commit = (committedDate, messageHeadline = "fix") => ({ commit: { committedDate, messageHeadline } });
const review = (login, submittedAt) => ({ author: login === null ? null : { login }, submittedAt });
const pr = (overrides = {}, reviews = [], commits = [commit("2026-01-02T00:00:00Z")]) => ({
  mergeable: "MERGEABLE",
  mergeQueueEntry: null,
  reviewDecision: null,
  author: { login: "me" },
  reviews: { nodes: reviews },
  commits: { nodes: commits },
  ...overrides,
});
const later = "2026-01-03T00:00:00Z", earlier = "2026-01-01T00:00:00Z";

test("queue beats conflict and approval", () => {
  assert.equal(prStatus(pr({ mergeQueueEntry: { state: "QUEUED" }, mergeable: "CONFLICTING", reviewDecision: "APPROVED" })), "≡");
});

test("conflict hides approval and comments", () => {
  assert.equal(prStatus(pr({ mergeable: "CONFLICTING", reviewDecision: "APPROVED" }, [review("bob", later)])), "↯");
});

test("approval hides comments", () => {
  assert.equal(prStatus(pr({ reviewDecision: "APPROVED" }, [review("bob", later)])), "✓");
});

test("changes requested shows comment icon", () => {
  assert.equal(prStatus(pr({ reviewDecision: "CHANGES_REQUESTED" })), "※");
});

test("review after last push", () => {
  assert.equal(prStatus(pr({}, [review("bob", later)])), "※");
  assert.equal(prStatus(pr({}, [review("bob", earlier)])), "");
});

test("merge commits don't count as a push", () => {
  const commits = [commit("2026-01-02T00:00:00Z"), commit("2026-01-04T00:00:00Z", "Merge branch 'main'")];
  assert.equal(prStatus(pr({}, [review("bob", later)], commits)), "※");
});

test("own reviews don't count", () => {
  assert.equal(prStatus(pr({}, [review("me", later)])), "");
});

test("no commits and null author", () => {
  assert.equal(prStatus(pr({}, [review(null, later)], [])), "※");
});
