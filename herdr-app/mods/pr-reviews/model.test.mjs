// node --test herdr-app/mods/pr-reviews/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isBot, who, timeAgo, prStatus, unresolvedThreads, reviewersOf, prStats,
  authorsOf, conversationEntries, lastLines, entryContext, agentsOnPR,
  unresolvedMessage, commentMessage, parseDiffHunk, shapePR, QUERY,
} from "./model.js";

test("isBot matches known bot logins and strips a trailing [bot] suffix", () => {
  assert.equal(isBot("gemini-code-assist"), true);
  assert.equal(isBot("gemini-code-assist[bot]"), true);
  assert.equal(isBot("maximus-ci-app[bot]"), true);
  assert.equal(isBot("alice"), false);
});

test("who falls back to 'deleted user' for a null author", () => {
  assert.equal(who({ author: { login: "alice" } }), "alice");
  assert.equal(who({ author: null }), "deleted user");
});

test("timeAgo formats minutes, hours, days", () => {
  const now = new Date("2026-01-31T00:00:00Z").getTime();
  assert.equal(timeAgo("2026-01-31T00:00:00Z", now), "just now");
  assert.equal(timeAgo("2026-01-30T23:30:00Z", now), "30m ago");
  assert.equal(timeAgo("2026-01-30T12:00:00Z", now), "12h ago");
  assert.equal(timeAgo("2026-01-29T00:00:00Z", now), "2d ago");
});

test("prStatus reads draft/merged/closed/open", () => {
  assert.equal(prStatus({ state: "MERGED" }).label, "Merged");
  assert.equal(prStatus({ state: "CLOSED" }).label, "Closed");
  assert.equal(prStatus({ state: "OPEN", isDraft: true }).label, "Draft");
  assert.equal(prStatus({ state: "OPEN" }).label, "Open");
});

test("unresolvedThreads keeps only threads not marked resolved", () => {
  const pr = { threads: [{ isResolved: true }, { isResolved: false }] };
  assert.equal(unresolvedThreads(pr).length, 1);
});

test("reviewersOf uses GitHub's own latest-opinionated-review per person, plus still-pending requests", () => {
  const pr = {
    latestOpinionatedReviews: [{ author: { login: "alice" }, state: "APPROVED" }],
    requestedReviewers: ["alice", "bob"],
  };
  const rows = reviewersOf(pr);
  assert.deepEqual(rows.find((r) => r.login === "alice"), { login: "alice", state: "APPROVED" });
  assert.deepEqual(rows.find((r) => r.login === "bob"), { login: "bob", state: "REQUESTED" });
});

test("prStats reports reviews and unresolved threads", () => {
  const pr = {
    reviewDecision: "CHANGES_REQUESTED",
    latestOpinionatedReviews: [{ author: { login: "alice" }, state: "CHANGES_REQUESTED" }],
    threads: [{ isResolved: false }],
  };
  const stats = prStats(pr);
  assert.deepEqual(stats.find((s) => s.key === "reviews"), { key: "reviews", value: "0/1", label: "Reviews", tone: "danger", detail: "Changes requested" });
  assert.equal(stats.find((s) => s.key === "unresolved").value, "1");
});

test("authorsOf collects every unique commenter across comments, reviews and threads", () => {
  const pr = {
    comments: [{ author: { login: "alice" } }],
    reviews: [{ author: { login: "bob" }, state: "COMMENTED" }],
    threads: [{ comments: [{ author: { login: "carol" } }] }],
  };
  assert.deepEqual(authorsOf(pr), ["alice", "bob", "carol"]);
});

test("conversationEntries interleaves comments, reviews and threads in time order", () => {
  const pr = {
    comments: [{ id: 1, author: { login: "alice" }, body: "hi", createdAt: "2026-01-02T00:00:00Z" }],
    reviews: [{ id: 2, author: { login: "bob" }, state: "APPROVED", submittedAt: "2026-01-01T00:00:00Z" }],
    threads: [{ id: "t1", path: "a.js", line: 5, isResolved: false, comments: [{ author: { login: "carol" }, createdAt: "2026-01-03T00:00:00Z" }] }],
  };
  const entries = conversationEntries(pr);
  assert.deepEqual(entries.map((e) => e.kind), ["Approved", "Comment", "Unresolved"]);
});

test("conversationEntries filters by author and unresolved-only", () => {
  const pr = {
    comments: [{ author: { login: "alice" }, createdAt: "2026-01-01T00:00:00Z" }],
    threads: [
      { id: "t1", isResolved: true, comments: [{ author: { login: "bob" } }] },
      { id: "t2", isResolved: false, comments: [{ author: { login: "alice" } }] },
    ],
  };
  assert.deepEqual(conversationEntries(pr, { unresolved: true }).map((e) => e.id), ["t2"]);
  assert.deepEqual(conversationEntries(pr, { author: "bob" }).map((e) => e.id), ["t1"]);
});

test("lastLines trims a hunk to its final N lines", () => {
  const hunk = ["@@ -1,5 +1,5 @@", "a", "b", "c", "d", "e"].join("\n");
  assert.equal(lastLines(hunk, 3), "c\nd\ne");
  assert.equal(lastLines(null), "");
});

test("entryContext includes the thread's location and hunk, or just the comments without one", () => {
  const withThread = { thread: { path: "a.js", line: 5, comments: [{ author: { login: "alice" }, body: "fix", diffHunk: "@@ -1 +1 @@" }] } };
  assert.match(entryContext(withThread), /a\.js:5/);
  assert.match(entryContext(withThread), /alice: fix/);
  const comment = { author: { login: "bob" }, body: "nice" };
  assert.equal(entryContext(comment), "bob: nice");
});

test("agentsOnPR matches agents in the given space whose pane is on the PR's branch", () => {
  const agents = [{ address: "a1", space: "s1", pane: "p1" }, { address: "a2", space: "s1", pane: "p2" }, { address: "a3", space: "s2", pane: "p1" }];
  const panes = [{ pane: "p1", branch: "feature" }, { pane: "p2", branch: "main" }];
  const result = agentsOnPR({ agents, panes, pr: { headRefName: "feature" }, space: "s1" });
  assert.deepEqual(result.map((a) => a.address), ["a1"]);
});

test("unresolvedMessage names every unresolved thread with its quoted comments", () => {
  const pr = {
    number: 42, url: "https://github.com/o/r/pull/42", headRefName: "feature",
    threads: [{ path: "a.js", line: 5, isResolved: false, comments: [{ author: { login: "alice" }, body: "fix this", url: "u" }] }],
  };
  const msg = unresolvedMessage(pr);
  assert.match(msg, /1 unresolved review thread/);
  assert.match(msg, /a\.js:5/);
  assert.match(msg, /alice: fix this/);
});

test("commentMessage carries structured context alongside the prompt", () => {
  const pr = { number: 42, url: "u", headRefOid: "sha", baseRefName: "main" };
  const msg = commentMessage(pr, "o/r", { url: "cu", thread: "t1", context: "alice: hi" }, "Reply to this");
  assert.match(msg, /Reply to this/);
  assert.match(msg, /"pr":42/);
  assert.match(msg, /alice: hi/);
});

test("parseDiffHunk numbers added, removed, and context lines against the hunk header", () => {
  const rows = parseDiffHunk("@@ -10,2 +10,3 @@ function foo() {\n context\n-removed\n+added one\n+added two");
  assert.deepEqual(rows, [
    { kind: "@", text: "@@ -10,2 +10,3 @@ function foo() {" },
    { kind: " ", number: 10, text: "context" },
    { kind: "-", number: 11, text: "removed" },
    { kind: "+", number: 11, text: "added one" },
    { kind: "+", number: 12, text: "added two" },
  ]);
});

test("parseDiffHunk on no hunk is an empty array", () => {
  assert.deepEqual(parseDiffHunk(null), []);
});

test("QUERY declares owner, name and number variables", () => {
  assert.match(QUERY, /\$owner:\s*String!/);
  assert.match(QUERY, /\$name:\s*String!/);
  assert.match(QUERY, /\$number:\s*Int!/);
});

test("shapePR reshapes the GraphQL response into a plain pr object", () => {
  const data = {
    repository: {
      pullRequest: {
        id: "PR_1", number: 42, title: "Fix it", url: "u", body: "desc",
        state: "OPEN", isDraft: false, headRefName: "feature", baseRefName: "main", headRefOid: "sha",
        author: { login: "alice" }, reviewDecision: "REVIEW_REQUIRED", mergeable: "MERGEABLE", mergeStateStatus: "CLEAN",
        reviewRequests: { nodes: [{ requestedReviewer: { login: "bob" } }] },
        latestOpinionatedReviews: { nodes: [{ state: "APPROVED", author: { login: "carol" } }] },
        comments: { nodes: [{ databaseId: 1, body: "hi", url: "u1", createdAt: "t1", author: { login: "dave" } }] },
        reviews: { nodes: [{ databaseId: 2, body: "", url: "u2", submittedAt: "t2", state: "APPROVED", author: { login: "carol" } }] },
        reviewThreads: {
          nodes: [{
            id: "RT_1", path: "a.js", line: 5, isResolved: false, isOutdated: false, viewerCanResolve: true, viewerCanUnresolve: false, viewerCanReply: true,
            comments: { nodes: [{ databaseId: 3, body: "fix", url: "u3", createdAt: "t3", diffHunk: "@@ -1 +1 @@", author: { login: "carol" } }] },
          }],
        },
      },
    },
  };
  const pr = shapePR(data, "owner/repo");
  assert.equal(pr.number, 42);
  assert.equal(pr.repository, "owner/repo");
  assert.deepEqual(pr.requestedReviewers, ["bob"]);
  assert.equal(pr.comments[0].id, 1);
  assert.equal(pr.reviews[0].state, "APPROVED");
  assert.equal(pr.threads[0].id, "RT_1");
  assert.equal(pr.threads[0].comments[0].diffHunk, "@@ -1 +1 @@");
});

test("shapePR on a missing PR (not found) returns null", () => {
  assert.equal(shapePR({ repository: { pullRequest: null } }, "o/r"), null);
});
