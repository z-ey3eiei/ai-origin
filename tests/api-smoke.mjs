import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const request = (path, options) => fetch(`${base}${path}`, options);
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const releaseResponse = await request("/api/release");
assert.equal(releaseResponse.status, 200);
const release = await releaseResponse.json();
assert.equal(release.version, packageJson.version);
assert.equal(release.name, "ONEORIGIN Workspace");
assert(readme.includes(`${release.name} v${release.version}`));

if (release.publicReadOnly) {
  for (const [path, method] of [
    ["/api/chat", "POST"],
    ["/api/generate", "POST"],
    ["/api/upload", "POST"],
    ["/api/settings", "PUT"],
    ["/api/knowledge", "POST"],
    ["/api/knowledge", "DELETE"],
    ["/api/knowledge?q=test", "GET"],
  ]) {
    for (const headers of [{}, { Origin: new URL(base).origin }]) {
      const response = await request(path, { method, headers });
      assert.equal(
        response.status,
        403,
        `${method} ${path} must be blocked before any provider or storage operation`,
      );
      assert.match((await response.json()).error, /Public Beta is read-only/);
    }
  }
}

const ecosystem = await request("/ecosystem", { redirect: "manual" });
assert.equal(
  ecosystem.status,
  200,
  "Tools hub must open without a login redirect",
);
const ecosystemHtml = await ecosystem.text();
assert.match(ecosystemHtml, /Tools &amp; projects/);
for (const repository of [
  "developer-devstack/devstack.bid",
  "developer-devstack/aibotq-site",
  "examplessdk-lgtm/one.origin",
  "z-ey3eiei/ai-origin",
]) {
  assert(ecosystemHtml.includes(`https://github.com/${repository}`));
}
assert.match(ecosystemHtml, /External link/);
assert.match(ecosystemHtml, /Before production/);
assert.match(ecosystemHtml, /Export JSON/);
assert(ecosystemHtml.includes(`v${release.version}`));
assert(ecosystemHtml.includes(release.name));

const models = await (await request("/api/models")).json();
assert(models.models.length > 0, "Live model catalog must contain models");
assert(models.models.every((model) => model.id && model.name));

const invalid = await request("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "",
    modelId: "invalid",
    sessionId: "invalid",
  }),
});
assert.equal(
  invalid.status,
  release.publicReadOnly ? 403 : 400,
  "Invalid prompts must not reach inference",
);

const crossOrigin = await request("/api/settings", {
  method: "PUT",
  headers: {
    Origin: "https://untrusted.example",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(
  crossOrigin.status,
  403,
  "Cross-origin mutations must be rejected",
);

const oversized = await request("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "x".repeat(21000) }),
});
assert.equal(
  oversized.status,
  release.publicReadOnly ? 403 : 400,
  "Oversized request bodies must be rejected",
);

const workspace = await request("/api/workspace");
assert.equal(workspace.status, 200);
assert.match(workspace.headers.get("set-cookie") || "", /HttpOnly/i);
assert.match(workspace.headers.get("set-cookie") || "", /Secure/i);
assert.match(workspace.headers.get("cache-control") || "", /no-store/);
const data = await workspace.json();
assert(Array.isArray(data.turns));
assert(Array.isArray(data.documents));
assert.equal(typeof data.storage.connected, "boolean");

const infrastructure = await (await request("/api/status")).json();
assert.equal(infrastructure.resources.length, 4);
assert(
  infrastructure.resources.every((resource) =>
    ["connected", "unconfigured", "error"].includes(resource.status),
  ),
);

console.log(
  "PASS: public tools hub and repository links, live catalog, validation, request limits, origin protection, private cookies, and infrastructure status.",
);
console.log(
  `PASS: release ${release.version} matches package.json, README, and app; public read-only mode: ${release.publicReadOnly}. These checks do not run paid inference, write AWS records, or prove full production readiness.`,
);
