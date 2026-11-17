// node --test herdr-app/mods/deploys/local.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { branchSuffix, bankInstance, bankNamespace, parentAppName } from "./local.js";

test("main has no suffix, and its namespace/app follow devcd's asymmetric convention", () => {
  const suffix = branchSuffix("main");
  assert.equal(suffix, "");
  assert.equal(bankInstance(suffix), "main");
  assert.equal(bankNamespace(suffix), "bnk-max1-main");
  assert.equal(parentAppName(suffix), "max1-dev-us-lcl-k1-bnk");
});

test("a feature branch slugifies into the namespace and app suffix", () => {
  const suffix = branchSuffix("feature/My-Cool_Thing");
  assert.equal(suffix, "-feature-my-cool-thin");
  assert.equal(bankNamespace(suffix), "bnk-max1-feature-my-cool-thin");
  assert.equal(parentAppName(suffix), "max1-dev-us-lcl-k1-bnk-feature-my-cool-thin");
});

test("branch suffix is lowercased, non-alnum replaced, and truncated to 20 chars before trimming dashes", () => {
  assert.equal(branchSuffix("ENG-1234-some-really-long-branch-name"), "-eng-1234-some-really");
});

test("no branch (undefined) behaves like main", () => {
  assert.equal(branchSuffix(undefined), "");
  assert.equal(branchSuffix(""), "");
});
