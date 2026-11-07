import assert from "node:assert/strict";
import test from "node:test";
import { checkRef, isLatest, nodeProblem, releasesIn } from "../scripts/cade.mjs";

test("releasesIn lists release tags, newest first, ignoring other tags", () => {
  const output = [
    "aaa\trefs/tags/v1.2.0",
    "bbb\trefs/tags/v1.10.0",
    "ccc\trefs/tags/v1.9.3",
    "ddd\trefs/tags/nightly",
    "eee\trefs/tags/v1.10.0-rc1",
    "fff\trefs/tags/0.9.0",
  ].join("\n");
  assert.deepEqual(releasesIn(output), ["v1.10.0", "v1.9.3", "v1.2.0", "0.9.0"]);
  assert.deepEqual(releasesIn(""), []);
});

test("checkRef accepts releases and main, and nothing git could read as an option or path", () => {
  assert.equal(checkRef("v1.2.0"), "v1.2.0");
  assert.equal(checkRef("main"), "main");
  for (const bad of ["--upload-pack=x", "../x", "a b", "", "v1;rm"]) assert.throws(() => checkRef(bad), /isn't a version/);
  assert.ok(isLatest("main"));
  assert.ok(!isLatest("v1.0.0"));
});

test("nodeProblem says when this Node.js is older than the one Cade's version asks for", () => {
  assert.equal(nodeProblem(">=22.18", "22.18.0"), undefined);
  assert.equal(nodeProblem(">=22.18", "24.3.0"), undefined);
  assert.equal(nodeProblem(">=22.18", "22.19.1"), undefined);
  assert.match(nodeProblem(">=22.18", "22.17.9"), /needs Node.js 22.18.0 or newer, and this is Node.js 22.17.9/);
  assert.match(nodeProblem(">=22.18", "20.11.1"), /Install a newer Node.js/);
  assert.match(nodeProblem(">= 20", "18.20.0"), /needs Node.js 20.0.0 or newer/);
  // A version that asks for nothing, or for something this doesn't read, isn't stopped.
  assert.equal(nodeProblem(undefined, "18.0.0"), undefined);
  assert.equal(nodeProblem("^22 || ^24", "18.0.0"), undefined);
});
