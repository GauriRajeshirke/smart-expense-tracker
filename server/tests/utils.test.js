// Unit tests for the pure helper functions (no database needed).
// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { currentMonthKey, isMonthKey, lastMonthKeys, monthRange } from "../utils/dates.js";
import { buildSummary, round2 } from "../utils/summary.js";
import { escapeRegex } from "../utils/escapeRegex.js";

test("isMonthKey accepts only YYYY-MM", () => {
  assert.equal(isMonthKey("2026-10"), true);
  assert.equal(isMonthKey("2026-13"), false);
  assert.equal(isMonthKey("2026-1"), false);
  assert.equal(isMonthKey({ $gt: "" }), false);
  assert.equal(isMonthKey(undefined), false);
});

test("monthRange covers exactly one month in UTC", () => {
  const { start, end } = monthRange("2026-10");
  assert.equal(start.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(monthRange("2026-12").end.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("lastMonthKeys returns N months, oldest first, across a year boundary", () => {
  const keys = lastMonthKeys(6, new Date(Date.UTC(2026, 1, 15))); // 15 Feb 2026
  assert.deepEqual(keys, ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"]);
  assert.equal(currentMonthKey(new Date(Date.UTC(2026, 9, 26))), "2026-10");
});

test("buildSummary calculates totals, savings rate, monthly rows and categories", () => {
  const summary = buildSummary(
    {
      typeTotals: [
        { _id: "income", total: 50000 },
        { _id: "expense", total: 1500.5 },
      ],
      monthlyRows: [
        { _id: { month: "2026-10", type: "income" }, total: 50000 },
        { _id: { month: "2026-10", type: "expense" }, total: 1500.5 },
      ],
      categoryRows: [
        { _id: "Transport", total: 300 },
        { _id: "Food", total: 1200.5 },
      ],
    },
    ["2026-09", "2026-10"]
  );

  assert.equal(summary.totals.income, 50000);
  assert.equal(summary.totals.expenses, 1500.5);
  assert.equal(summary.totals.balance, 48499.5);
  assert.equal(summary.totals.savingsRate, 97);
  assert.deepEqual(summary.monthly[0], { key: "2026-09", income: 0, expenses: 0, savings: 0 });
  assert.deepEqual(summary.monthly[1], { key: "2026-10", income: 50000, expenses: 1500.5, savings: 48499.5 });
  assert.deepEqual(summary.categories.map((c) => c.name), ["Food", "Transport"]); // biggest first
});

test("buildSummary handles a user with no data", () => {
  const summary = buildSummary({ typeTotals: [], monthlyRows: [], categoryRows: [] }, ["2026-10"]);
  assert.deepEqual(summary.totals, { income: 0, expenses: 0, balance: 0, savingsRate: 0 });
  assert.equal(summary.categories.length, 0);
});

test("round2 avoids floating point noise", () => {
  assert.equal(round2(0.1 + 0.2), 0.3);
  assert.equal(round2(1234.5678), 1234.57);
});

test("escapeRegex neutralises special characters", () => {
  const pattern = new RegExp(escapeRegex("a.b(c)*"), "i");
  assert.equal(pattern.test("a.b(c)*"), true);
  assert.equal(pattern.test("aXb(c)*"), false); // "." is now a plain dot
  assert.doesNotThrow(() => new RegExp(escapeRegex("((((")));
});
