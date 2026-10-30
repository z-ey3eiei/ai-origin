import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const request = (path, options) => fetch(`${base}${path}`, options);

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
assert.equal(invalid.status, 400, "Invalid prompts must not reach inference");

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
  400,
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
  "PASS: live catalog, validation, request limits, origin protection, private cookies, and infrastructure status.",
);
console.log(
  "These checks do not run paid inference, write AWS records, or prove production readiness.",
);
