import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workspace source contains the hosted portfolio product surface", async () => {
  const workspace = await readFile(new URL("../app/workspace.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(workspace, /Bond analytics desk/);
  assert.match(workspace, /Persisted hosted workspace/);
  assert.match(workspace, /Portfolio Value/);
  assert.match(workspace, /New portfolio/);
  assert.match(workspace, /Add bond/);
  assert.match(css, /\.app-shell/);
  assert.doesNotMatch(workspace, /Resume-ready full-stack project/);
  assert.doesNotMatch(workspace, /Your site is taking shape/);
});
