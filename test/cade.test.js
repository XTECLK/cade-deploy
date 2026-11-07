import assert from "node:assert/strict";
import test from "node:test";
import { checkRef, isLatest, releasesIn } from "../scripts/cade.mjs";

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
