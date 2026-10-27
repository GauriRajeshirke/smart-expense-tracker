// Turns the raw numbers from MongoDB aggregations into the shape the dashboard needs.
// Kept separate from the database code so it can be tested on its own.

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * typeTotals:   [{ _id: "income" | "expense", total }]
 * monthlyRows:  [{ _id: { month: "2026-10", type: "income" | "expense" }, total }]
 * categoryRows: [{ _id: "Food", total }]
 * monthKeys:    ["2026-05", ..., "2026-10"]
 */
export function buildSummary({ typeTotals, monthlyRows, categoryRows }, monthKeys) {
  const totalFor = (type) => typeTotals.find((row) => row._id === type)?.total || 0;

  const income = round2(totalFor("income"));
  const expenses = round2(totalFor("expense"));
  const balance = round2(income - expenses);
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const monthly = monthKeys.map((key) => {
    const find = (type) =>
      monthlyRows.find((row) => row._id.month === key && row._id.type === type)?.total || 0;
    const monthIncome = find("income");
    const monthExpenses = find("expense");
    return {
      key,
      income: round2(monthIncome),
      expenses: round2(monthExpenses),
      savings: round2(monthIncome - monthExpenses),
    };
  });

  const categories = categoryRows
    .map((row) => ({ name: row._id, value: round2(row.total) }))
    .sort((a, b) => b.value - a.value);

  return { totals: { income, expenses, balance, savingsRate }, monthly, categories };
}
