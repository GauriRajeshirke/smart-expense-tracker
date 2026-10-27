import { useState } from "react";
import FormField from "./FormField";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/constants";
import { todayString } from "../utils/format";

// Used for both "Add" and "Edit". Pass `initial` to pre-fill when editing.
// `saving` and `serverError` come from the page that talks to the API.
export default function TransactionForm({ initial, onSubmit, onCancel, saving, serverError }) {
  const [form, setForm] = useState({
    type: initial?.type || "expense",
    amount: initial?.amount ?? "",
    category: initial?.category || "Food",
    date: initial?.date ? String(initial.date).slice(0, 10) : todayString(),
    description: initial?.description || "",
  });
  const [errors, setErrors] = useState({});

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const changeType = (type) => {
    const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm({ ...form, type, category: list[0] });
  };

  const validate = () => {
    const found = {};
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      found.amount = "Enter an amount greater than 0";
    }
    if (!form.date) found.date = "Choose a date";
    if (!categories.includes(form.category)) found.category = "Choose a category";
    if (form.description.length > 100) found.description = "Keep it under 100 characters";
    return found;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      description: form.description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {/* Income / Expense toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        {["expense", "income"].map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => changeType(type)}
            className={`rounded-md py-2 text-sm font-medium capitalize transition ${
              form.type === type
                ? type === "income"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-rose-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <FormField label="Amount (₹)" error={errors.amount}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="0"
          value={form.amount}
          onChange={update("amount")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category" error={errors.category}>
          <select className="input" value={form.category} onChange={update("category")}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date" error={errors.date}>
          <input type="date" className="input" value={form.date} onChange={update("date")} />
        </FormField>
      </div>

      <FormField label="Description (optional)" error={errors.description}>
        <input
          type="text"
          className="input"
          maxLength={100}
          placeholder="e.g. Lunch with friends"
          value={form.description}
          onChange={update("description")}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}
