import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SummaryCard from "../components/SummaryCard";
import { fetchSummary } from "../features/reportsSlice";
import { sortByDateDesc } from "../utils/calc";
import { CHART_COLORS } from "../utils/constants";
import { formatCurrency, formatDate, monthShort } from "../utils/format";

export default function Dashboard() {
  const dispatch = useDispatch();
  const transactions = useSelector((state) => state.transactions.items);
  const { summary, status, error } = useSelector((state) => state.reports);

  // Every number on this page comes from the server, calculated from MongoDB.
  // The transaction count is in the dependency list so the numbers refresh after changes.
  useEffect(() => {
    dispatch(fetchSummary());
  }, [dispatch, transactions.length]);

  const recent = useMemo(() => sortByDateDesc(transactions).slice(0, 5), [transactions]);
  const monthly = useMemo(
    () => (summary ? summary.monthly.map((m) => ({ ...m, short: monthShort(m.key) })) : []),
    [summary]
  );

  if (status === "failed") {
    return (
      <div className="card space-y-3 border-rose-200 bg-rose-50 text-sm text-rose-700">
        <p>Could not load the dashboard: {error}</p>
        <button className="btn-secondary" onClick={() => dispatch(fetchSummary())}>
          Try again
        </button>
      </div>
    );
  }
  if (!summary) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading your dashboard...</div>;
  }

  const { totals, categories } = summary;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(totals.income)}
          hint="All recorded income"
          icon="income"
          accent="emerald"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totals.expenses)}
          hint="All recorded spending"
          icon="expense"
          accent="rose"
        />
        <SummaryCard
          title="Balance"
          value={formatCurrency(totals.balance)}
          hint="Income minus expenses"
          icon="wallet"
          accent="indigo"
        />
        <SummaryCard
          title="Savings Rate"
          value={`${totals.savingsRate}%`}
          hint="Share of income you kept"
          icon="percent"
          accent="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-900">Income vs Expenses (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="short" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Spending by category</h2>
          {categories.length === 0 ? (
            <p className="py-20 text-center text-sm text-slate-500">No expenses yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {categories.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent transactions</h2>
          <Link to="/transactions" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No transactions yet. Add your first one on the Transactions page.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((t) => (
              <li key={t._id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {t.description || t.category}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.category} · {formatDate(t.date)}
                  </p>
                </div>
                <p
                  className={`ml-4 text-sm font-semibold ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
