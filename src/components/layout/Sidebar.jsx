import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Users, Briefcase, Store, Wallet, Bell, FileText,
  ShieldCheck, Settings, ScrollText, MessageSquareWarning, Star,
  ChevronsLeft, ChevronsRight, ChevronDown, LogOut, X, Lock,
} from "lucide-react";

// logo.png eka methana save karanna (path eka oyage project ekata adjust karanna)
import logo from "../../assets/logo.png";

/* ---------- Admin navigation (edit `to` to match your routes) ----------
   A group with `children` is collapsible. `soon: true` shows a locked item. */
const NAV = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Analytics", icon: BarChart3, to: "/analytics" },
    ],
  },
  {
    title: "People",
    items: [
      {
        label: "Users",
        icon: Users,
        base: "/users",
        children: [
          { label: "Customers", to: "/customers" },
          { label: "Workers", to: "/workers", badge: 9, hot: true },
          { label: "Suppliers", to: "/users/suppliers", soon: true },
        ],
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      {
        label: "Jobs",
        icon: Briefcase,
        base: "/jobs",
        children: [
          { label: "All jobs", to: "/jobs" },
          // { label: "Offers & bids", to: "/jobs/offers", badge: 18 },
          { label: "Job categories", to: "/jobcategories" },
        ],
      },
      { label: "Disputes", icon: MessageSquareWarning, to: "/disputes", badge: 3, hot: true },
      { label: "Reviews", icon: Star, to: "/reviews" },
      {
        label: "Shop",
        icon: Store,
        base: "/shop",
        children: [
          { label: "Products", to: "/products" },
          { label: "Categories", to: "/categories" },
          { label: "Orders", to: "/orders", badge: 6 },
          { label: "Inventory", to: "/inventory" },
          { label: "Coupons", to: "/shop/coupons" },
        ],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Payments",
        icon: Wallet,
        base: "/finance",
        children: [
          { label: "Transactions", to: "/finance/transactions" },
          { label: "Worker payouts", to: "/finance/payouts", badge: 4 },
          { label: "Commissions", to: "/finance/commissions" },
        ],
      },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Reports", icon: FileText, to: "/reports" },
      { label: "Admins & roles", icon: ShieldCheck, to: "/admins" },
      { label: "Activity log", icon: ScrollText, to: "/logs" },
      { label: "Settings", icon: Settings, to: "/settings" },
    ],
  },
];

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

/* ---------- Small pieces ---------- */
function Badge({ value, hot, active }) {
  const tone = hot
    ? "bg-amber-400 text-amber-950"
    : active
    ? "bg-blue-100 text-blue-800"
    : "bg-white/15 text-white";
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>{value}</span>;
}

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${focus} ${
          collapsed ? "justify-center px-0" : "px-3"
        } ${isActive ? "bg-white text-blue-950 shadow-sm" : "text-blue-50 hover:bg-white/10 hover:text-white"}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-4 bottom-2 top-2 w-1 rounded-r-full bg-sky-400" />}
          <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? "text-blue-600" : "text-blue-200 group-hover:text-white"} />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {item.badge &&
            (collapsed ? (
              <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${item.hot ? "bg-amber-400" : "bg-white"}`} />
            ) : (
              <Badge value={item.badge} hot={item.hot} active={isActive} />
            ))}
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ item, collapsed, expand, onNavigate }) {
  const { pathname } = useLocation();
  const inside = pathname === item.base || pathname.startsWith(item.base + "/");
  const [open, setOpen] = useState(inside);
  const Icon = item.icon;
  const pending = item.children.some((c) => c.hot);

  const toggle = () => {
    if (collapsed) {
      expand();
      setOpen(true);
    } else setOpen(!open);
  };

  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={open && !collapsed}
        title={collapsed ? item.label : undefined}
        className={`group relative flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${focus} ${
          collapsed ? "justify-center px-0" : "px-3"
        } ${inside ? "bg-white/10 text-white" : "text-blue-50 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon size={19} strokeWidth={inside ? 2.3 : 1.8} className={inside ? "text-sky-300" : "text-blue-200 group-hover:text-white"} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            {pending && !open && <span className="h-2 w-2 rounded-full bg-amber-400" />}
            <ChevronDown size={15} className={`text-blue-200 transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
        {collapsed && pending && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400" />}
      </button>

      {open && !collapsed && (
        <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-sky-400/30 pl-3">
          {item.children.map((c) =>
            c.soon ? (
              <div key={c.to} className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-300">
                <span>{c.label}</span>
                <span className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  <Lock size={10} /> Soon
                </span>
              </div>
            ) : (
              <NavLink
                key={c.to}
                to={c.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${focus} ${
                    isActive ? "bg-white font-semibold text-blue-950 shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {c.label}
                    {c.badge && <Badge value={c.badge} hot={c.hot} active={isActive} />}
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      )}
    </div>
  );
}

function SidebarBody({ collapsed, setCollapsed, onClose }) {
  const pad = collapsed ? "px-2" : "px-4";

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75]">
      {/* Brand: logo sits on a light "steel" tile so the dark-blue DEL letters stay visible */}
      <div className={`flex items-center py-5 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-slate-200 p-1.5 shadow-md ring-1 ring-sky-300/40">
            <img src={logo} alt="DEL logo" className="h-full w-full object-contain" />
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight text-white">De Lanka</span>
              <span className="block text-xs font-medium text-sky-300">Admin console</span>
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className={`rounded-lg p-1.5 text-blue-100 hover:bg-white/10 ${focus}`}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${pad}`}>
        {NAV.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-xs font-semibold text-blue-300">{section.title}</p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-sky-400/40" />
            )}
            <div className="space-y-0.5">
              {section.items.map((it) =>
                it.children ? (
                  <NavGroup key={it.label} item={it} collapsed={collapsed} expand={() => setCollapsed(false)} onNavigate={onClose} />
                ) : (
                  <NavItem key={it.to} item={it} collapsed={collapsed} onNavigate={onClose} />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 py-3 ${pad}`}>
        <div className={`flex items-center gap-3 rounded-xl bg-white/10 p-2.5 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">AU</span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">Admin User</span>
                <span className="block truncate text-xs text-blue-200">Super admin</span>
              </span>
              <button aria-label="Log out" title="Log out" className={`rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white ${focus}`}>
                <LogOut size={17} />
              </button>
            </>
          )}
        </div>
        {!onClose && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mt-2 hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-blue-100 hover:bg-white/10 hover:text-white lg:flex ${focus}`}
          >
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* mobileOpen / setMobileOpen come from MainLayout (the hamburger lives in its header) */
export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <SidebarBody collapsed={false} setCollapsed={setCollapsed} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      <aside className={`hidden h-screen shrink-0 transition-all duration-200 lg:block ${collapsed ? "w-[76px]" : "w-72"}`}>
        <SidebarBody collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}