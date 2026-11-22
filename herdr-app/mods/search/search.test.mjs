// node --test herdr-app/mods/search/search.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { words, match, search, snippet } from "./search.js";

const e = (o) => ({ address: "t1", name: "", cwd: "", screen: "", scrollback: "", ...o });

test("words lowercases and drops empties", () => assert.deepEqual(words("  Ledger  REPLAY "), ["ledger", "replay"]));

test("name beats screen", () => {
  const hits = search([e({ address: "a", screen: "ledger" }), e({ address: "b", name: "ledger / 1 zsh" })], "ledger");
  assert.deepEqual(hits.map((h) => [h.address, h.field]), [["b", "name"], ["a", "screen"]]);
});

test("every word must match", () => assert.equal(match(e({ name: "ledger" }), "ledger replay"), null));

test("weakest word decides rank", () => {
  const h = match(e({ name: "ledger", scrollback: "old replay log" }), "ledger replay");
  assert.equal(h.field, "scrollback");
  assert.equal(h.line.slice(h.at, h.at + h.len).toLowerCase(), "replay");
});

test("screen text is not reported as scrollback", () =>
  assert.equal(match(e({ screen: "panic: boom", scrollback: "x\npanic: boom" }), "panic").field, "screen"));

test("case-insensitive", () => assert.equal(match(e({ cwd: "/Users/x/Projects/Maximum" }), "maximum").field, "cwd"));

test("regex metacharacters are literal", () => {
  assert.equal(match(e({ screen: "call a.b(1)" }), "a.b(").field, "screen");
  assert.equal(match(e({ screen: "axb" }), "a.b"), null);
  assert.doesNotThrow(() => search([e({ screen: "[" })], "[ * ("));
});

test("long lines are capped around the hit", () => {
  const s = snippet("x".repeat(5000) + "needle" + "y".repeat(5000), "needle");
  assert.ok(s.line.length <= 122);
  assert.equal(s.line.slice(s.at, s.at + s.len), "needle");
});

test("empty query lists everything in order", () =>
  assert.deepEqual(search([e({ address: "a", name: "A" }), e({ address: "b", name: "B" })], " ").map((h) => h.address), ["a", "b"]));
