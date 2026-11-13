import { useMemo, useState } from "react";
import { Search, Store, ChevronLeft, ChevronRight } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 10;

const TYPES = {
  received: { label: "Received", cls: "bg-sky-100 text-sky-800 border-sky-300" },
  adjustment: { label: "Adjustment", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  transfer: { label: "Transfer", cls: "bg-violet-100 text-violet-800 border-violet-300" },
};

const fmtDateTime = (t) =>
  new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Every stock change: received orders, adjustments and transfers (newest first).
 * It is a log, so there is no edit or delete here.
 */
export default function StockHistoryTab({ movements, branches, viewBranch, onViewBranchChange, myBranchId }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const branchName = (id) => branches.find((b) => b.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter(
      (m) =>
        (viewBranch === "all" || m.branchId === viewBranch) &&
        (type === "all" || m.type === type) &&
        (!q || [m.productName, branchName(m.branchId), m.reason, m.note, m.by].some((v) => (v || "").toLowerCase().includes(q)))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, viewBranch, type, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by product, branch, reason or person"
              className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </label>
          <label className="relative">
            <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700" />
            <select
              aria-label="Show history for branch"
              value={viewBranch}
              onChange={(e) => { onViewBranchChange(e.target.value); setPage(1); }}
              className={`w-full rounded-lg border border-teal-200 bg-teal-50 py-2 pl-9 pr-3 text-sm font-medium text-teal-900 ${focus}`}
            >
              <option value="all">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.id === myBranchId ? " (your branch)" : ""}</option>)}
            </select>
          </label>
        </div>
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by type">
          {["all", "received", "adjustment", "transfer"].map((t) => (
            <button
              key={t}
              aria-pressed={type === t}
              onClick={() => { setType(t); setPage(1); }}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${type === t ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t === "all" ? "All" : TYPES[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-teal-50 text-xs text-teal-900">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Product</th>
              <th className={th}>Branch</th>
              <th className={th}>Type</th>
              <th className={`${th} text-right`}>Change</th>
              <th className={`${th} text-right`}>Stock after</th>
              <th className={th}>Reason</th>
              <th className={th}>By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-slate-50">
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDateTime(m.at)}</td>
                <td className={`${td} font-semibold text-slate-900`}>{m.productName}</td>
                <td className={td}>{branchName(m.branchId)}</td>
                <td className={td}>
                  <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${TYPES[m.type].cls}`}>{TYPES[m.type].label}</span>
                </td>
                <td className={`${td} text-right font-semibold ${m.change > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {m.change > 0 ? "+" : "−"}{Math.abs(m.change)}
                </td>
                <td className={`${td} text-right font-medium text-slate-900`}>{m.balance}</td>
                <td className={td}>
                  {m.reason || <span className="text-slate-400">None</span>}
                  {m.note && <span className="block max-w-xs truncate text-xs text-slate-500" title={m.note}>{m.note}</span>}
                </td>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{m.by}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-slate-900">No stock changes found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search, branch or type.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
        <p>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} changes
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
  );
}