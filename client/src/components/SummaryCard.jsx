import Icon from "./Icon";

// Full class names are written out so Tailwind can find them.
const accents = {
  emerald: "bg-emerald-100 text-emerald-600",
  rose: "bg-rose-100 text-rose-600",
  indigo: "bg-indigo-100 text-indigo-600",
  amber: "bg-amber-100 text-amber-600",
};

export default function SummaryCard({ title, value, hint, icon, accent = "indigo" }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className={`rounded-lg p-2.5 ${accents[accent]}`}>
        <Icon name={icon} />
      </div>
    </div>
  );
}
