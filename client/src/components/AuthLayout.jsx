// Shared page frame for Login and Register: brand panel on the left, form on the right.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl font-bold">
            ₹
          </div>
          <span className="text-lg font-semibold">Smart Expense Tracker</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Know where your
            <br />
            money goes.
          </h2>
          <p className="mt-4 max-w-md text-indigo-100">
            Track income and expenses, set monthly budgets, and let AI flag unusual spending
            before it becomes a habit.
          </p>
        </div>
        <p className="text-sm text-indigo-200">BTech Mini Project</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-[480px]">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}
