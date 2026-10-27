import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { getErrorMessage } from "../api/errors";
import Icon from "../components/Icon";
import SummaryCard from "../components/SummaryCard";
import { getLastMonths, getTotals, sortByDateDesc } from "../utils/calc";
import { CHART_COLORS } from "../utils/constants";
import { currentMonthKey, formatCurrency, monthLabel } from "../utils/format";

// Wrap each CSV cell in quotes. Cells that start with = + - @ could be run as
// formulas by Excel, so we put an apostrophe in front of them (CSV injection protection).
const csvCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

function downloadCsv(rows, filename) {
  const header = ["Date", "Type", "Category", "Description", "Amount"];
  const lines = [
    header,
    ...rows.map((t) => [String(t.date).slice(0, 10), t.type, t.category, t.description, t.amount]),
  ];
  const csv = lines.map((line) => line.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// The last 12 months, newest first
const monthOptions = [...getLastMonths(12)].reverse();

export default function Reports() {
  const [selected, setSelected] = useState(currentMonthKey());
  const [monthTransactions, setMonthTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload whenever the month changes: both lists come straight from the database
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/transactions", { params: { month: selected } }),
      api.get("/reports/summary", { params: { month: selected } }),
    ])
      .then(([transactionsRes, summaryRes]) => {
        if (!active) return;
        setMonthTransactions(sortByDateDesc(transactionsRes.data));
        setSummary(summaryRes.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  const totals = useMemo(() => getTotals(monthTransactions), [monthTransactions]);
  const categories = summary?.categories || [];
  const monthly = summary?.monthly || [];

  return (
    <div className="space-y-6">
      {/* Month picker + export */}
      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="report-month">
            Month
          </label>
          <select
            id="report-month"
            className="input w-auto"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-secondary"
          disabled={loading || monthTransactions.length === 0}
          onClick={() => downloadCsv(monthTransactions, `expenses-${selected}.csv`)}
        >
          <Icon name="download" className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="card border-rose-200 bg-rose-50 text-sm text-rose-700">
          Could not load the report: {error}
        </div>
      )}

      {/* Summary for the selected month */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Income" value={formatCurrency(totals.income)} icon="income" accent="emerald" />
        <SummaryCard title="Expenses" value={formatCurrency(totals.expenses)} icon="expense" accent="rose" />
        <SummaryCard
          title="Net savings"
          value={formatCurrency(totals.balance)}
          hint={`${totals.savingsRate}% of income`}
          icon="wallet"
          accent="indigo"
        />
      </div>

      {/* Category-wise expenses */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">
          Category-wise expenses · {monthLabel(selected)}
        </h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No expenses in this month.</p>
        ) : (
          <ul className="space-y-4">
            {categories.map((c, index) => {
              const share = totals.expenses > 0 ? Math.round((c.value / totals.expenses) * 100) : 0;
              return (
                <li key={c.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className="text-slate-600">
                      {formatCurrency(c.value)} ({share}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Monthly summary table */}
      <div className="card overflow-hidden p-0">
        <h2 className="px-5 pt-5 font-semibold text-slate-900">Monthly summary (last 6 months)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Income</th>
                <th className="px-5 py-3 text-right">Expenses</th>
                <th className="px-5 py-3 text-right">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...monthly].reverse().map((m) => (
                <tr key={m.key}>
                  <td className="px-5 py-3 font-medium text-slate-800">{monthLabel(m.key)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600">{formatCurrency(m.income)}</td>
                  <td className="px-5 py-3 text-right text-rose-600">{formatCurrency(m.expenses)}</td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${
                      m.savings < 0 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {formatCurrency(m.savings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
