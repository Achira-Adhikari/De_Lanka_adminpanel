import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import Sidebar from "./Sidebar";

function Breadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {parts.length === 0 && <span className="font-semibold text-slate-900">Dashboard</span>}
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          <span className={i === parts.length - 1 ? "font-semibold text-slate-900" : "text-slate-500"}>{label(p)}</span>
        </span>
      ))}
    </nav>
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search users, jobs, orders"
                className="w-64 rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
            <button
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">admin@delanka.com</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 font-bold text-white">AU</div>
          </div>
        </header> */}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}