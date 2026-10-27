import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import {
  addTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from "../features/transactionsSlice";
import { sortByDateDesc } from "../utils/calc";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/constants";
import { formatCurrency, formatDate, monthKey, monthLabel } from "../utils/format";

const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export default function Transactions() {
  const dispatch = useDispatch();
  const { items: transactions, status, error } = useSelector((state) => state.transactions);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [modal, setModal] = useState(null); // null, { mode: "add" } or { mode: "edit", item }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [actionError, setActionError] = useState("");

  const monthOptions = useMemo(
    () => [...new Set(transactions.map((t) => monthKey(t.date)))].sort().reverse(),
    [transactions]
  );

  // Search and filters run on the list already loaded from the database
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return sortByDateDesc(transactions).filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (monthFilter !== "all" && monthKey(t.date) !== monthFilter) return false;
      if (text && !`${t.description} ${t.category}`.toLowerCase().includes(text)) return false;
      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter, monthFilter]);

  const openModal = (value) => {
    setSaveError("");
    setModal(value);
  };

  const handleSave = async (form) => {
    setSaving(true);
    setSaveError("");
    const action =
      modal.mode === "edit"
        ? updateTransaction({ id: modal.item._id, form })
        : addTransaction(form);
    const result = await dispatch(action);
    setSaving(false);

    if (result.error) {
      setSaveError(result.payload || "Could not save the transaction");
    } else {
      setModal(null);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.description || t.category}"?`)) return;
    setActionError("");
    const result = await dispatch(deleteTransaction(t._id));
    if (result.error) setActionError(result.payload || "Could not delete the transaction");
  };

  const amountText = (t) => (
    <span className={`font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
      {t.type === "income" ? "+" : "-"}
      {formatCurrency(t.amount)}
    </span>
  );

  const actionButtons = (t) => (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => openModal({ mode: "edit", item: t })}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
        aria-label="Edit"
      >
        <Icon name="edit" className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(t)}
        className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        aria-label="Delete"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </div>
  );

  if (status === "failed") {
    return (
      <div className="card space-y-3 border-rose-200 bg-rose-50 text-sm text-rose-700">
        <p>Could not load transactions: {error}</p>
        <button className="btn-secondary" onClick={() => dispatch(fetchTransactions())}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {/* Toolbar: search, filters, add button */}
      <div className="card space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              type="text"
              className="input pl-9"
              placeholder="Search description or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => openModal({ mode: "add" })}>
            <Icon name="plus" className="h-4 w-4" />
            Add transaction
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="all">All months</option>
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === "loading" && transactions.length === 0 ? (
        <div className="card py-12 text-center text-sm text-slate-500">Loading transactions...</div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Showing {filtered.length} of {transactions.length} transactions
          </p>

          {filtered.length === 0 ? (
            <div className="card py-12 text-center text-sm text-slate-500">
              {transactions.length === 0
                ? "No transactions yet. Click “Add transaction” to create your first one."
                : "No transactions match your filters."}
            </div>
          ) : (
            <>
              {/* Table for tablets and desktops */}
              <div className="card hidden overflow-hidden p-0 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-5 py-3 text-slate-800">{t.description || "-"}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {t.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">{amountText(t)}</td>
                        <td className="px-5 py-3">{actionButtons(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for phones */}
              <ul className="space-y-3 md:hidden">
                {filtered.map((t) => (
                  <li key={t._id} className="card flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {t.description || t.category}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.category} · {formatDate(t.date)}
                      </p>
                      <p className="mt-1 text-sm">{amountText(t)}</p>
                    </div>
                    {actionButtons(t)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {modal && (
        <Modal
          title={modal.mode === "edit" ? "Edit transaction" : "Add transaction"}
          onClose={() => !saving && setModal(null)}
        >
          <TransactionForm
            initial={modal.mode === "edit" ? modal.item : null}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
            serverError={saveError}
          />
        </Modal>
      )}
    </div>
  );
}
