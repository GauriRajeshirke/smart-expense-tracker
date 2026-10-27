// Small helpers. The big numbers (dashboard totals, monthly chart, category
// breakdown, budget progress) are calculated by the server from MongoDB.
import { monthKey } from "./format";

export function getTotals(transactions) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  }
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  return { income, expenses, balance, savingsRate };
}

// ["2026-05", ..., "2026-10"] - the last N months, oldest first
export function getLastMonths(count = 6) {
  const now = new Date();
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

// Newest first (dates are ISO text, so comparing text works)
export const sortByDateDesc = (transactions) =>
  [...transactions].sort((a, b) => String(b.date).localeCompare(String(a.date)));

export { monthKey };
