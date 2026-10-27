import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/Icon";
import { fetchInsights } from "../features/insightsSlice";
import { formatCurrency, formatDate } from "../utils/format";

const severityStyle = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
};

export default function Insights() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((state) => state.insights);
  // Run the analysis again if the user's transactions change
  const transactionCount = useSelector((state) => state.transactions.items.length);

  useEffect(() => {
    dispatch(fetchInsights());
  }, [dispatch, transactionCount]);

  const loading = status === "loading";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Unusual spending detected</h2>
            <p className="mt-1 text-sm text-slate-500">
              Expenses that look very different from your normal spending in the same category.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => dispatch(fetchInsights())} disabled={loading}>
            {loading ? "Analysing..." : "Run analysis again"}
          </button>
        </div>

        {status === "failed" ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : !data ? (
          <p className="py-10 text-center text-sm text-slate-500">Analysing your expenses...</p>
        ) : data.analyzed === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No expenses from the last 12 months yet. Add some transactions and come back.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-600">
              Checked <strong>{data.analyzed}</strong> expenses from the last 12 months and found{" "}
              <strong>{data.anomalies.length}</strong> unusual{" "}
              {data.anomalies.length === 1 ? "one" : "ones"}.
            </p>

            {data.anomalies.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Nothing unusual found. Your spending looks consistent.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {data.anomalies.map((item) => (
                  <li key={item.id} className="flex items-start gap-4 py-4">
                    <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600">
                      <Icon name="alert" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{item.description || item.category}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            severityStyle[item.severity] || severityStyle.medium
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {item.category} · {item.date ? formatDate(item.date) : "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                    </div>
                    <p className="font-semibold text-rose-600">{formatCurrency(item.amount)}</p>
                  </li>
                ))}
              </ul>
            )}

            {data.skippedCategories.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Not enough history yet to check: {data.skippedCategories.join(", ")}. At least 6
                expenses in a category are needed.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">How it works</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your expenses are sent from the Express server to a small Python service. For each
          category it trains a scikit-learn Isolation Forest, a model that learns what a normal
          amount looks like and gives odd amounts a high score. We only report expenses that the
          model flags <em>and</em> that are at least twice your usual amount for that category, so
          small differences never raise a warning. No labelled data is needed, and only the amount,
          category, date and description are shared with the service.
        </p>
      </div>
    </div>
  );
}
