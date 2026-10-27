// Unit tests for the helpers that talk to the ML service (no network needed).
import test from "node:test";
import assert from "node:assert/strict";
import { fromMlResponse, toMlPayload } from "../utils/insights.js";

test("toMlPayload sends only the fields the ML service needs", () => {
  const payload = toMlPayload([
    {
      _id: "665f1c2a9b1e8a0012345678",
      user: "SECRET-USER-ID",
      type: "expense",
      amount: 24500,
      category: "Shopping",
      date: new Date("2026-09-24T00:00:00.000Z"),
      description: "Festival shopping",
      isDemo: true,
    },
  ]);
  assert.deepEqual(payload, {
    expenses: [
      {
        id: "665f1c2a9b1e8a0012345678",
        date: "2026-09-24",
        amount: 24500,
        category: "Shopping",
        description: "Festival shopping",
      },
    ],
  });
  assert.equal(JSON.stringify(payload).includes("SECRET-USER-ID"), false);
});

test("toMlPayload handles a missing description", () => {
  const [expense] = toMlPayload([
    { _id: "1", amount: 10, category: "Food", date: new Date("2026-10-01T00:00:00.000Z") },
  ]).expenses;
  assert.equal(expense.description, "");
});

test("fromMlResponse converts a valid answer to the shape the browser expects", () => {
  const result = fromMlResponse({
    analyzed: 66,
    skipped_categories: ["Health"],
    anomalies: [
      {
        id: "a1",
        date: "2026-09-24",
        category: "Shopping",
        amount: 24500,
        description: "Festival shopping",
        severity: "high",
        score: 0.71,
        reason: "₹24,500 is 9.8x your usual Shopping spend",
      },
    ],
  });
  assert.equal(result.analyzed, 66);
  assert.deepEqual(result.skippedCategories, ["Health"]);
  assert.equal(result.anomalies[0].severity, "high");
  assert.equal(result.anomalies[0].amount, 24500);
});

test("fromMlResponse rejects answers with the wrong shape", () => {
  assert.throws(() => fromMlResponse(null));
  assert.throws(() => fromMlResponse({ analyzed: 1 }));
  assert.throws(() => fromMlResponse({ analyzed: "1", anomalies: [] }));
  assert.throws(() => fromMlResponse({ analyzed: 1, anomalies: [{ id: 5 }] }));
  assert.throws(() => fromMlResponse({ analyzed: 1, anomalies: [{ id: "a", category: "Food", amount: "lots" }] }));
});

test("fromMlResponse does not trust unknown severity values", () => {
  const result = fromMlResponse({
    analyzed: 1,
    anomalies: [{ id: "a", category: "Food", amount: 5, severity: "<script>" }],
  });
  assert.equal(result.anomalies[0].severity, "medium");
  assert.deepEqual(result.skippedCategories, []);
});
