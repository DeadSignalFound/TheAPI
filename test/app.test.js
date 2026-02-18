import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("GET /api/quotes lists available series", async () => {
  const response = await request(app).get("/api/quotes");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.series));
  assert.ok(response.body.series.includes("murder-drones"));
});

test("GET /api/quotes/murder-drones returns quotes", async () => {
  const response = await request(app).get("/api/quotes/murder-drones");

  assert.equal(response.status, 200);
  assert.equal(response.body.series, "murder-drones");
  assert.ok(response.body.total > 0);
});

test("POST /api/quotes/:series is blocked for public users", async () => {
  const response = await request(app)
    .post("/api/quotes/murder-drones")
    .send({ speaker: "Tester", quote: "Should be rejected." });

  assert.equal(response.status, 403);
  assert.match(response.body.error, /disabled/i);
});

test("POST /api/quotes/:series/bulk is blocked for public users", async () => {
  const response = await request(app)
    .post("/api/quotes/murder-drones/bulk")
    .send({
      quotes: [
        { speaker: "Tester", quote: "Bulk quote 1" },
        { speaker: "Tester", quote: "Bulk quote 2" }
      ]
    });

  assert.equal(response.status, 403);
  assert.match(response.body.error, /disabled/i);
});

test("GET /api/quotes/murder-drones/random returns one quote", async () => {
  const response = await request(app).get("/api/quotes/murder-drones/random");

  assert.equal(response.status, 200);
  assert.equal(response.body.series, "murder-drones");
  assert.ok(response.body.quote);
});

test("GET /api/quotes/unknown returns 404", async () => {
  const response = await request(app).get("/api/quotes/unknown");

  assert.equal(response.status, 404);
  assert.ok(response.body.availableSeries);
});

test("GET /api/quotes with invalid slug returns 400", async () => {
  const response = await request(app).get("/api/quotes/bad_slug!");

  assert.equal(response.status, 400);
  assert.match(response.body.error, /invalid series format/i);
});

test("Security headers are present", async () => {
  const response = await request(app).get("/api/quotes");

  assert.equal(response.status, 200);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.ok(response.headers["content-security-policy"]);
});
