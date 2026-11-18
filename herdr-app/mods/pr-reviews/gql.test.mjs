// node --test herdr-app/mods/pr-reviews/gql.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBot, shapeReviews, QUERY } from "./gql.js";

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

test("an unresolved thread keeps its review unresolved and surfaces the comment", () => {
  const data = fixture({
    reviews: [{ databaseId: 1, author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-01-01T00:00:00Z", body: "" }],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "fix this", pullRequestReview: { databaseId: 1 } }] } }],
    commits: ["2026-01-02T00:00:00Z"],
  });
  const [r] = shapeReviews(data);
  assert.equal(r.resolved, false);
  assert.deepEqual(r.comments, [{ id: 10, path: "a.js", line: 5, body: "fix this" }]);
});

test("a thread's comment is only attributed to the review that posted it", () => {
  const data = fixture({
    reviews: [
      { databaseId: 1, author: { login: "alice" }, state: "COMMENTED", submittedAt: "2026-01-01T00:00:00Z", body: "" },
      { databaseId: 2, author: { login: "bob" }, state: "COMMENTED", submittedAt: "2026-01-02T00:00:00Z", body: "" },
    ],
    threads: [{ isResolved: false, comments: { nodes: [{ databaseId: 10, path: "a.js", line: 5, body: "bob's comment", pullRequestReview: { databaseId: 2 } }] } }],
    commits: ["2026-01-03T00:00:00Z"],
  });
  const [alice, bob] = shapeReviews(data);
  assert.deepEqual(alice.comments, []);
  assert.equal(alice.resolved, true); // no threads of its own, and a commit landed after it
  assert.deepEqual(bob.comments, [{ id: 10, path: "a.js", line: 5, body: "bob's comment" }]);
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
