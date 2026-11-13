import { useMemo, useState } from "react";
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Phone, Mail, Truck, CheckCircle2, PauseCircle, Clock } from "lucide-react";
import { focus, fmtDate } from "./orderUtils";

const PAGE_SIZE = 8;
const AVATARS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600"];
const SUP_STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-700 border-slate-300" },
};

function Avatar({ name }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${AVATARS[name.length % AVATARS.length]}`}>
      {name[0].toUpperCase()}
    </span>
  );
}

function Chips({ items }) {
  if (items.length === 0) return <span className="text-slate-400">Not set</span>;
  const shown = items.slice(0, 2);
  const more = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5" title={items.join(", ")}>
      {shown.map((s) => <span key={s} className="whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs text-teal-900">{s}</span>)}
      {more > 0 && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">+{more}</span>}
    </div>
  );
}

/**
 * Supplier list. Each supplier object also carries `orderCount` and `pendingCount`
 * (worked out in the page from the orders).
 * Only admins get the Edit and Delete buttons (`canManage`).
 */
export default function SuppliersTab({ suppliers, canManage, onAdd, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers
      .filter(
        (s) =>
          (status === "all" || s.status === status) &&
          (!q || [s.name, s.contactPerson, s.city, s.phone, ...s.categories].some((v) => (v || "").toLowerCase().includes(q)))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, query, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = [
    { label: "Total suppliers", value: suppliers.length, icon: Truck, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Active", value: suppliers.filter((s) => s.status === "active").length, icon: CheckCircle2, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Inactive", value: suppliers.filter((s) => s.status === "inactive").length, icon: PauseCircle, tone: "bg-slate-500", edge: "border-t-slate-500" },
    { label: "With pending orders", value: suppliers.filter((s) => s.pendingCount > 0).length, icon: Clock, tone: "bg-amber-500", edge: "border-t-amber-500" },
  ];

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, edge }) => (
          <div key={label} className={`flex items-center justify-between rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm ${edge}`}>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
            </div>
            <span className={`rounded-lg p-2.5 text-white ${tone}`}><Icon size={20} /></span>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
          <label className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by supplier, contact, city or category"
              className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </label>
          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by status">
            {["all", "active", "inactive"].map((s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${status === s ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {s === "all" ? "All" : SUP_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-teal-50 text-xs text-teal-900">
              <tr>
                <th className={th}>Supplier</th>
                <th className={th}>Contact</th>
                <th className={th}>City</th>
                <th className={th}>Supplies</th>
                <th className={th}>Orders</th>
                <th className={th}>Status</th>
                <th className={th}>Added</th>
                {canManage && <th className={`${th} text-right`}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} />
                      <div className="min-w-0">
                        <span className="block font-semibold text-slate-900">{s.name}</span>
                        <span className="block text-xs text-slate-500">{s.contactPerson}</span>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone size={13} className="text-slate-400" /> {s.phone}</span>
                    {s.email && <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500"><Mail size={12} className="text-slate-400" /> {s.email}</span>}
                  </td>
                  <td className={td}>{s.city || <span className="text-slate-400">Not set</span>}</td>
                  <td className={td}><Chips items={s.categories} /></td>
                  <td className={td}>
                    {s.orderCount}
                    {s.pendingCount > 0 && <span className="block text-xs text-amber-700">{s.pendingCount} pending</span>}
                  </td>
                  <td className={td}>
                    <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${SUP_STATUS[s.status].cls}`}>{SUP_STATUS[s.status].label}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(s.createdAt)}</td>
                  {canManage && (
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button onClick={() => onEdit(s)} className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => onDelete(s)} aria-label={`Delete ${s.name}`} className={`inline-flex items-center rounded-lg border border-slate-200 p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50 ${focus}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-900">No suppliers match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or status{canManage ? ", or add a new supplier" : ""}.</p>
              {canManage && (
                <button onClick={onAdd} className={`mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 ${focus}`}>Add supplier</button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} suppliers
          </p>
          <div className="flex items-center gap-2">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page" className={`rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}>
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {safePage} of {pages}</span>
            <button disabled={safePage === pages} onClick={() => setPage(safePage + 1)} aria-label="Next page" className={`rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}