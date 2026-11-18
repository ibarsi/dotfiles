// node --test herdr-app/mods/codeburn/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPersonal, providerOfModel, splitSpend, dailyWork, projectMonth, money, tokens, ago } from "./model.js";

test("isPersonal: MacBook codex is personal", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "codex"), true);
});

test("isPersonal: non-MacBook codex is work", () => {
  assert.equal(isPersonal("omen", "codex"), false);
});

test("isPersonal: claude on MacBook is work", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "claude"), false);
});

test("isPersonal: grok build on MacBook is work (not in PERSONAL table)", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "grok build"), false);
});

test("providerOfModel classifies by name pattern", () => {
  assert.equal(providerOfModel("Opus 5.5"), "claude");
  assert.equal(providerOfModel("GPT-6.1 Sol"), "codex");
  assert.equal(providerOfModel("gpt-6-astra"), "codex");
  assert.equal(providerOfModel("Gemini 3.8 Flash"), "gemini");
  assert.equal(providerOfModel("mystery"), "other");
});

test("splitSpend sums providerDetails across devices into work/personal", () => {
  const combinedDevices = [
    { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: { providerDetails: [
      { id: "claude", cost: 300 },
      { id: "codex", cost: 30 },
    ] } } },
    { id: "omen", name: "omen", payload: { current: { providerDetails: [
      { id: "codex", cost: 10 },
      { id: "gemini", cost: 0 },
    ] } } },
  ];
  const result = splitSpend(combinedDevices);
  assert.equal(result.work, 310); // claude 300 + omen codex 10
  assert.equal(result.personal, 30); // Mac codex
  assert.deepEqual(result.providers, new Set(["claude", "codex"]));
});

test("dailyWork splits a day's cost by model provider, remainder counts as unclassified work", () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const combinedDevices = [
    { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: {}, history: { daily: [
      { date: yesterday, cost: 20, topModels: [{ name: "Opus 5.5", cost: 12 }, { name: "GPT-6.1 Sol", cost: 5 }] },
    ] } } },
  ];
  const result = dailyWork(combinedDevices, 30);
  assert.equal(result.series.length, 30);
  // yesterday is the second-to-last slot (last slot is today)
  assert.equal(result.series[28], 15); // 12 (claude work) + 3 (remainder, counted as work)
  assert.equal(result.unclassified, 3);
});

test("projectMonth on day 1 (elapsedDays floored to 1) is finite", () => {
  const now = new Date(2026, 10, 1, 6);
  assert.equal(projectMonth(10, now), 300);
});

test("projectMonth with zero month-to-date is zero", () => {
  assert.equal(projectMonth(0, new Date(2026, 10, 1, 6)), 0);
});

test("projectMonth midway through the month", () => {
  const now = new Date(2026, 10, 16);
  assert.equal(projectMonth(150, now), 300);
});

test("money formats with thousands separator and two decimals", () => {
  assert.equal(money(1598.2), "$1,598.20");
  assert.equal(money(183.65), "$183.65");
});

test("tokens formats compactly", () => {
  assert.equal(tokens(727769103), "727.8M");
  assert.equal(tokens(4200), "4.2K");
  assert.equal(tokens(950), "950");
});

test("ago formats elapsed time", () => {
  assert.equal(ago(5000), "just now");
  assert.equal(ago(12000), "12s ago");
  assert.equal(ago(3 * 60000), "3m ago");
  assert.equal(ago(2 * 3600000), "2h ago");
  assert.equal(ago(4 * 86400000), "4d ago");
});
