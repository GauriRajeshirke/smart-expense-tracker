import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormField from "../components/FormField";
import Icon from "../components/Icon";
import { deleteBudget, fetchBudgets, saveBudget } from "../features/budgetsSlice";
import { EXPENSE_CATEGORIES } from "../utils/constants";
import { currentMonthKey, formatCurrency, monthLabel } from "../utils/format";

// Green when comfortable, amber when close to the limit, red when over it
const barColor = (percent) =>
  percent >= 100 ? "bg-rose-500" : percent >= 75 ? "bg-amber-500" : "bg-emerald-500";

export default function Budgets() {
  const dispatch = useDispatch();
  const month = currentMonthKey();
  const { items: budgets, status, error: loadError } = useSelector((state) => state.budgets);
  // When a transaction changes elsewhere, the spent amounts must be reloaded
  const transactionCount = useSelector((state) => state.transactions.items.length);

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchBudgets(month));
  }, [dispatch, month, transactionCount]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(limit);
    if (!limit || !Number.isFinite(amount) || amount < 1) {
      setError("Enter a budget of at least 1");
      return;
    }
    setError("");
    setSaving(true);
    const result = await dispatch(saveBudget({ category, month, limit: amount }));
    setSaving(false);
    if (result.error) setError(result.payload || "Could not save the budget");
    else setLimit("");
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete the ${b.category} budget?`)) return;
    const result = await dispatch(deleteBudget({ id: b._id, month }));
    if (result.error) setError(result.payload || "Could not delete the budget");
  };

  const startEdit = (b) => {
    setCategory(b.category);
    setLimit(String(b.limit));
    setError("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Budget list */}
      <div className="space-y-4 lg:col-span-2">
        <div className="card">
          <p className="text-sm text-slate-500">{monthLabel(month)} overview</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSpent)}{" "}
            <span className="text-base font-normal text-slate-500">
              spent of {formatCurrency(totalBudget)} budgeted
            </span>
          </p>
        </div>

        {status === "failed" ? (
          <div className="card border-rose-200 bg-rose-50 text-sm text-rose-700">
            Could not load budgets: {loadError}
          </div>
        ) : status === "loading" && budgets.length === 0 ? (
          <div className="card py-12 text-center text-sm text-slate-500">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="card py-12 text-center text-sm text-slate-500">
            No budgets set for this month. Add one using the form.
          </div>
        ) : (
          budgets.map((b) => (
            <div key={b._id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{b.category}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(b)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                    aria-label="Edit budget"
                  >
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete budget"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barColor(b.percent)}`}
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {formatCurrency(b.spent)} of {formatCurrency(b.limit)} ({b.percent}%)
                </span>
                <span className={b.remaining < 0 ? "font-medium text-rose-600" : "text-slate-500"}>
                  {b.remaining < 0
                    ? `${formatCurrency(Math.abs(b.remaining))} over budget`
                    : `${formatCurrency(b.remaining)} left`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Set budget form */}
      <div>
        <form onSubmit={handleSubmit} className="card space-y-4 lg:sticky lg:top-24">
          <h2 className="font-semibold text-slate-900">Set a monthly budget</h2>
          <FormField label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Monthly limit (₹)" error={error}>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="e.g. 5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </FormField>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : "Save budget"}
          </button>
          <p className="text-xs text-slate-500">
            Saving a category that already has a budget this month updates it.
          </p>
        </form>
      </div>
    </div>
  );
}
