import { Link } from "react-router-dom";
import {
  Users, HardHat, Hammer, ShoppingBag, Download, Plus, TrendingUp,
  BadgeCheck, MessageSquareWarning, PackageX, Banknote, ChevronRight,
} from "lucide-react";

const STATS = [
  { label: "Total customers", value: "1,248", note: "12% vs last month", up: true, icon: Users, tone: "bg-teal-600 text-white", edge: "border-t-teal-600" },
  { label: "Active workers", value: "342", note: "5% vs last month", up: true, icon: HardHat, tone: "bg-amber-500 text-white", edge: "border-t-amber-500" },
  { label: "Open jobs", value: "86", note: "18 awaiting a hire", icon: Hammer, tone: "bg-sky-600 text-white", edge: "border-t-sky-600" },
  { label: "Shop revenue", value: "LKR 452,000", note: "18% vs last month", up: true, icon: ShoppingBag, tone: "bg-emerald-600 text-white", edge: "border-t-emerald-600" },
];

/* Things an admin must act on: each links to the page that resolves it */
const ATTENTION = [
  { label: "Workers awaiting verification", count: 9, to: "/users/workers", icon: BadgeCheck },
  { label: "Open disputes", count: 3, to: "/disputes", icon: MessageSquareWarning },
  { label: "Worker payouts to approve", count: 4, to: "/finance/payouts", icon: Banknote },
  { label: "Products low on stock", count: 7, to: "/shop/inventory", icon: PackageX },
];

const USER_MIX = [
  { label: "Customers", value: 1248, bar: "bg-teal-600" },
  { label: "Workers", value: 342, bar: "bg-amber-500" },
  { label: "Suppliers", value: 0, bar: "bg-slate-300", soon: true },
];

const PILL = {
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  teal: "bg-teal-100 text-teal-800 border-teal-300",
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  blue: "bg-sky-100 text-sky-800 border-sky-300",
  purple: "bg-violet-100 text-violet-800 border-violet-300",
};

const JOBS = [
  { customer: "Nimal Perera", title: "House wiring repair", offers: "4 offers", status: "Receiving offers", color: "amber" },
  { customer: "Kamal Silva", title: "Plumbing line setup", offers: "2 offers", status: "Worker hired", color: "teal" },
  { customer: "Sunil Jayamaha", title: "AC maintenance", offers: "6 offers", status: "Completed", color: "green" },
];

const ORDERS = [
  { buyer: "Kasun Fernando", role: "Worker", amount: "LKR 12,500", status: "Processing", color: "blue" },
  { buyer: "Ruwan Pathirana", role: "Customer", amount: "LKR 4,800", status: "Delivered", color: "green" },
  { buyer: "Dilshan Gamage", role: "Worker", amount: "LKR 35,000", status: "Shipped", color: "purple" },
];

const th = "px-3 py-3 font-medium";
const td = "px-3 py-3";

function Pill({ color, children }) {
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${PILL[color]}`}>{children}</span>;
}

function Panel({ title, to, className = "", children }) {
  return (
    <section className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {to && (
          <Link to={to} className="text-xs font-medium text-teal-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            View all
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function DataTable({ head, children }) {
  return (
    <table className="w-full text-left text-sm text-slate-700">
      <thead className="bg-teal-50 text-xs text-teal-900">
        <tr>
          {head.map((h, i) => (
            <th key={h} className={`${th} ${i === 0 ? "rounded-l-lg" : ""} ${i === head.length - 1 ? "rounded-r-lg" : ""}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  );
}

export default function DashboardPage() {
  const totalUsers = USER_MIX.reduce((s, u) => s + u.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard overview</h1>
          <p className="text-sm text-slate-500">De Lanka platform summary and key metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            <Download size={16} /> Export report
          </button>
          <Link
            to="/shop/products"
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <Plus size={16} /> Add product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, note, up, icon: Icon, tone, edge }) => (
          <div key={label} className={`rounded-xl border border-t-4 border-slate-200 bg-white p-5 shadow-sm ${edge}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
              </div>
              <span className={`rounded-lg p-2.5 ${tone}`}><Icon size={20} /></span>
            </div>
            <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-slate-500"}`}>
              {up && <TrendingUp size={14} />} {note}
            </p>
          </div>
        ))}
      </div>

      {/* Needs attention + users */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Needs your attention" className="lg:col-span-2">
          <ul className="grid gap-2 sm:grid-cols-2">
            {ATTENTION.map(({ label, count, to, icon: Icon }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-teal-600/40 hover:bg-teal-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  <span className="rounded-lg bg-amber-500 p-2 text-white"><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold leading-tight text-slate-900">{count}</span>
                    <span className="block truncate text-xs text-slate-500">{label}</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-700" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Users by type" to="/users/customers">
          <div className="space-y-4">
            {USER_MIX.map((u) => (
              <div key={u.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{u.label}</span>
                  <span className="text-slate-500">{u.soon ? "Coming soon" : u.value.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${Math.max((u.value / totalUsers) * 100, u.soon ? 4 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Recent job requests" to="/jobs">
          <DataTable head={["Customer", "Job", "Offers", "Status"]}>
            {JOBS.map((j) => (
              <tr key={j.customer}>
                <td className={`${td} font-medium text-slate-900`}>{j.customer}</td>
                <td className={td}>{j.title}</td>
                <td className={td}>{j.offers}</td>
                <td className={td}><Pill color={j.color}>{j.status}</Pill></td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel title="Recent shop orders" to="/shop/orders">
          <DataTable head={["Buyer", "Role", "Amount", "Status"]}>
            {ORDERS.map((o) => (
              <tr key={o.buyer}>
                <td className={`${td} font-medium text-slate-900`}>{o.buyer}</td>
                <td className={`${td} text-xs text-slate-500`}>{o.role}</td>
                <td className={td}>{o.amount}</td>
                <td className={td}><Pill color={o.color}>{o.status}</Pill></td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>
    </div>
  );
}