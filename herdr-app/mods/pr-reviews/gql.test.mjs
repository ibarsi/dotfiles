// node --test herdr-app/mods/pr-reviews/gql.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBot, shapeReviews, QUERY, relativeTime, parseDiffHunk } from "./gql.js";

test("isBot matches known bot logins and strips a trailing [bot] suffix", () => {
  assert.equal(isBot("gemini-code-assist"), true);
  assert.equal(isBot("gemini-code-assist[bot]"), true);
  assert.equal(isBot("maximus-ci-app[bot]"), true);
  assert.equal(isBot("alice"), false);
});

test("QUERY declares owner, name and number variables", () => {
  assert.match(QUERY, /\$owner:\s*String!/);
  assert.match(QUERY, /\$name:\s*String!/);
  assert.match(QUERY, /\$number:\s*Int!/);
});

function fixture({ reviews = [], threads = [], commits = [], viewerLogin = "me" }) {
  return {
    repository: { pullRequest: { reviews: { nodes: reviews }, reviewThreads: { nodes: threads }, commits: { nodes: commits.map((d) => ({ commit: { committedDate: d } })) } } },
    viewer: { login: viewerLogin },
  };
}

test("no reviews shapes to an empty array", () => {
  assert.deepEqual(shapeReviews(fixture({})), []);
});

test("excludes the viewer's own review", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "me" }, state: "COMMENTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    viewerLogin: "me",
  });
  assert.deepEqual(shapeReviews(data), []);
});

test("a review with zero inline comments and zero commits since stays unresolved (body-only bot finding)", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "gemini-code-assist[bot]" }, state: "COMMENTED", submittedAt: "2026-01-01T00:00:00Z", body: "Found an issue outside the diff." }],
    threads: [],
    commits: [],
  });
  const [r] = shapeReviews(data);
  assert.equal(r.resolved, false);
  assert.equal(r.isBot, true);
});

test("a review becomes resolved once all its threads are resolved and a commit landed after it", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: true, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "fix this", pullRequestReview: { databaseId: 1 } }] } }],
    commits: ["2026-01-02T00:00:00Z"],
  });
  const [r] = shapeReviews(data);
  assert.equal(r.resolved, true);
  assert.deepEqual(r.comments, []);
});

test("all threads resolved but no commit since stays unresolved", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: true, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "fix this", pullRequestReview: { databaseId: 1 } }] } }],
    commits: [],
  });
  assert.equal(shapeReviews(data)[0].resolved, false);
});

test("an unresolved thread keeps its review unresolved and surfaces the comment with its diff hunk", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "fix this", diffHunk: "@@ -1,2 +1,2 @@\n-old\n+new", pullRequestReview: { databaseId: 1 } }] } }],
    commits: ["2026-01-02T00:00:00Z"],
  });
  const [r] = shapeReviews(data);
  assert.equal(r.resolved, false);
  assert.deepEqual(r.comments, [{ id: 10, path: "a.js", line: 5, body: "fix this", diffHunk: "@@ -1,2 +1,2 @@\n-old\n+new" }]);
});

test("a comment with no diffHunk (e.g. an outdated position) shapes to null, not undefined", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: null, body: "fix this", pullRequestReview: { databaseId: 1 } }] } }],
    commits: ["2026-01-02T00:00:00Z"],
  });
  assert.equal(shapeReviews(data)[0].comments[0].diffHunk, null);
});

test("a thread's comment is only attributed to the review that posted it", () => {
  const data = fixture({
    reviews: [
      { databaseId: 1, author: { login: "alice" }, state: "COMMENTED", submittedAt: "2026-01-01T00:00:00Z", body: "" },
      { databaseId: 2, author: { login: "bob" }, state: "COMMENTED", submittedAt: "2026-01-02T00:00:00Z", body: "" },
    ],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "bob's comment", diffHunk: "@@ -1 +1 @@\n-x\n+y", pullRequestReview: { databaseId: 2 } }] } }],
    commits: ["2026-01-03T00:00:00Z"],
  });
  const [alice, bob] = shapeReviews(data);
  assert.deepEqual(alice.comments, []);
  assert.equal(alice.resolved, true); // no threads of its own, and a commit landed after it
  assert.deepEqual(bob.comments, [{ id: 10, path: "a.js", line: 5, body: "bob's comment", diffHunk: "@@ -1 +1 @@\n-x\n+y" }]);
});

test("relativeTime formats minutes, hours, days, and falls back to a date past a month", () => {
  const now = new Date("2026-01-31T00:00:00Z").getTime();
  assert.equal(relativeTime("2026-01-31T00:00:00Z", now), "just now");
  assert.equal(relativeTime("2026-01-30T23:30:00Z", now), "30m ago");
  assert.equal(relativeTime("2026-01-30T12:00:00Z", now), "12h ago");
  assert.equal(relativeTime("2026-01-29T00:00:00Z", now), "2d ago");
  assert.equal(relativeTime("2025-12-01T00:00:00Z", now), new Date("2025-12-01T00:00:00Z").toLocaleDateString());
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

test("parseDiffHunk on no hunk (e.g. an outdated comment) is an empty array", () => {
  assert.deepEqual(parseDiffHunk(null), []);
});

test("DISMISSED reviews are always resolved regardless of threads or commits", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "DISMISSED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "x", pullRequestReview: { databaseId: 1 } }] } }],
    commits: [],
  });
  assert.equal(shapeReviews(data)[0].resolved, true);
});

test("reviews sort oldest first", () => {
  const data = fixture({
    reviews: [
      { databaseId: 2, author: { login: "bob" }, state: "COMMENTED", submittedAt: "2026-01-02T00:00:00Z", body: "" },
      { databaseId: 1, author: { login: "alice" }, state: "COMMENTED", submittedAt: "2026-01-01T00:00:00Z", body: "" },
    ],
  });
  assert.deepEqual(shapeReviews(data).map((r) => r.id), [1, 2]);
});
