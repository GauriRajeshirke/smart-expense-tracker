import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";
import { fetchTransactions } from "../features/transactionsSlice";
import Icon from "./Icon";
import DemoBanner from "./DemoBanner";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/transactions", label: "Transactions", icon: "transactions" },
  { to: "/budgets", label: "Budgets", icon: "budgets" },
  { to: "/reports", label: "Reports", icon: "reports" },
  { to: "/insights", label: "AI Insights", icon: "insights" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const hasDemoData = useSelector((state) => state.transactions.items.some((t) => t.isDemo));
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // Load this user's transactions from the database once, when the app opens
  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const pageTitle = navItems.find((item) => item.to === pathname)?.label || "Smart Expense Tracker";
  const initial = (user?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Dark overlay behind the sidebar on phones */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-slate-900 text-slate-200 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            ₹
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-white">Smart Expense</p>
            <p className="text-xs text-slate-400">Tracker</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            onClick={() => dispatch(logout())}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Icon name="logout" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {hasDemoData && <DemoBanner />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
