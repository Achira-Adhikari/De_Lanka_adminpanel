import { useMemo, useState } from "react";
import StockAdjustModal from "../../components/shop/inventry/Stockadjustmodal";
import StockTransferModal from "../../components/shop/inventry/Stockhistorytab";
import StockHistoryTab from "../../components/shop/inventry/Stocktransfermodal";
import {
  Search, Download, Boxes, Package, AlertTriangle, PackageX, SlidersHorizontal, ArrowLeftRight,
  Store, ChevronLeft, ChevronRight, ShieldCheck, UserCog, X, CheckCircle2,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API and wire the actions to your endpoints:
     GET  /inventory            (products with stock per branch, same data as the Products page)
     GET  /inventory/history    (stock changes, newest first)
     saveAdjust    -> POST /inventory/adjustments   body: { productId, branchId, change, reason, note }
     saveTransfer  -> POST /inventory/transfers     body: { productId, fromId, toId, qty, note }
   The server must update the stock and write the history rows in ONE transaction.
   Received orders also add a "received" row (done by the Orders page API).

   Stock is kept per branch:  stock = { colombo: 12, kandy: 3, ... }
   A branch is "low" at 5 or less and "out of stock" at 0 (same as the Products page).

   Roles
   - Admin   : sees every branch, can adjust the stock of any branch and
               transfer stock between any branches.
   - Manager : sees every branch (view only for other branches). Can adjust the
               stock of their own branch and send stock OUT of their own branch
               to another branch. Cannot change other branches.

   IMPORTANT: hiding buttons is only for a nice screen. Your backend must check
   the role and branch again on every request, and must refuse changes that
   would take stock below 0.
   ===================================================================== */
const BRANCHES = [
  { id: "colombo", name: "Colombo" },
  { id: "negombo", name: "Negombo" },
  { id: "kandy", name: "Kandy" },
  { id: "galle", name: "Galle" },
  { id: "jaffna", name: "Jaffna" },
];
const MANAGER_BRANCH = "colombo"; // demo: in production this comes from the logged-in manager
const ALL_IDS = BRANCHES.map((b) => b.id);
const branchName = (id) => BRANCHES.find((b) => b.id === id)?.name ?? id;
const LOW = 5;

const CATEGORIES = ["Electrical", "Plumbing", "AC & cooling", "Carpentry", "Painting", "Cleaning"];
const SUBCATEGORIES = {
  Electrical: ["Wiring", "Fans", "Lighting"],
  Plumbing: ["Pipes", "Tanks & floats"],
  "AC & cooling": ["Gas & refills", "Installation parts"],
  Carpentry: [],
  Painting: ["Interior paint", "Wall putty"],
  Cleaning: [],
};
const NAMES = [
  "Ceiling fan 56 inch", "PVC pipe 1 inch", "AC gas R410A", "Door hinge set", "Emulsion paint 4L",
  "Floor cleaner 5L", "LED bulb 12W", "Water tank float", "Split AC bracket", "Wood glue 500ml",
  "Wall putty 20kg", "Microfibre cloth pack",
];
const STOCK_PATTERN = [0, 3, 12, 48, 5, 27, 0, 64];

const PRODUCTS_SEED = Array.from({ length: 24 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length];
  const subs = SUBCATEGORIES[category];
  return {
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? " (Pro)" : ""),
    category,
    subCategory: subs.length ? subs[i % subs.length] : "",
    stock: Object.fromEntries(BRANCHES.map((b, k) => [b.id, STOCK_PATTERN[(i + k * 3) % STOCK_PATTERN.length]])),
  };
});

/* Demo history, built backwards from today's stock so the numbers add up. */
function buildHistory(products) {
  const running = Object.fromEntries(products.map((p) => [p.id, { ...p.stock }]));
  const out = [];
  const KINDS = ["received", "remove", "transfer", "add", "received", "transfer", "remove"];
  const REASONS = ["Damaged", "Lost or stolen", "Correction"];
  let t = Date.now() - 3600000;
  let id = 1;
  for (let k = 0; k < 48; k++) {
    const p = products[(k * 5 + 2) % products.length];
    const bi = (k * 3) % BRANCHES.length;
    const b = BRANCHES[bi].id;
    const kind = KINDS[k % KINDS.length];
    const want = 5 + ((k * 7) % 6) * 5;
    const by = k % 3 === 0 ? "Admin" : `Manager (${BRANCHES[bi].name})`;
    t -= (6 + (k % 5) * 5) * 3600000;
    const run = running[p.id];
    const push = (o) => out.push({ id: id++, at: t, productId: p.id, productName: p.name, reason: "", note: "", by, ...o });

    if (kind === "received" && Math.min(want, run[b]) > 0) {
      const c = Math.min(want, run[b]);
      push({ branchId: b, type: "received", change: c, balance: run[b], note: `Order PO-${1001 + (k % 20)}` });
      run[b] -= c;
    } else if (kind === "transfer") {
      const b2 = BRANCHES[(bi + 2) % BRANCHES.length].id;
      const c = Math.min(want, run[b2]);
      if (c > 0) {
        push({ branchId: b, type: "transfer", change: -c, balance: run[b], note: `To ${branchName(b2)}` });
        run[b] += c;
        push({ branchId: b2, type: "transfer", change: c, balance: run[b2], note: `From ${branchName(b)}` });
        run[b2] -= c;
      } else {
        push({ branchId: b, type: "adjustment", change: -want, balance: run[b], reason: "Correction" });
        run[b] += want;
      }
    } else if (kind === "add" && Math.min(want, run[b]) > 0) {
      const c = Math.min(want, run[b]);
      push({ branchId: b, type: "adjustment", change: c, balance: run[b], reason: "Stock found" });
      run[b] -= c;
    } else {
      push({ branchId: b, type: "adjustment", change: -want, balance: run[b], reason: REASONS[k % REASONS.length] });
      run[b] += want;
    }
  }
  return out;
}

const stockState = (n) =>
  n === 0
    ? { label: "Out of stock", cls: "bg-rose-100 text-rose-800 border-rose-300" }
    : n <= LOW
    ? { label: "Low stock", cls: "bg-amber-100 text-amber-800 border-amber-300" }
    : { label: "In stock", cls: "bg-sky-100 text-sky-800 border-sky-300" };

const cellCls = (n) =>
  n === 0
    ? "rounded-md bg-rose-100 px-2 py-0.5 font-semibold text-rose-800"
    : n <= LOW
    ? "rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-800"
    : "px-2 py-0.5 font-medium text-slate-900";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 8;

/* ---------- page ---------- */
export default function AllInventoryPage() {
  /* Demo role switch. Remove this and read the role from your auth later. */
  const [role, setRole] = useState("admin");
  const isAdmin = role === "admin";
  const myBranchId = isAdmin ? null : MANAGER_BRANCH;
  const editableIds = isAdmin ? ALL_IDS : [MANAGER_BRANCH];
  const actor = isAdmin ? "Admin" : `Manager (${branchName(MANAGER_BRANCH)})`;

  const [tab, setTab] = useState("stock"); // "stock" | "history"
  const [products, setProducts] = useState(PRODUCTS_SEED);
  const [movements, setMovements] = useState(() => buildHistory(PRODUCTS_SEED));

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all"); // all | low | out
  const [viewBranch, setViewBranch] = useState("all"); // "all" or a branch id
  const [sort, setSort] = useState("lowest");
  const [page, setPage] = useState(1);

  const [adjustFor, setAdjustFor] = useState(null);     // product | null
  const [transferFor, setTransferFor] = useState(null); // product | null
  const [notice, setNotice] = useState("");

  const switchRole = (r) => {
    setRole(r);
    setViewBranch(r === "manager" ? MANAGER_BRANCH : "all"); // manager starts on their own branch
    setPage(1);
    setAdjustFor(null);
    setTransferFor(null);
    setNotice("");
  };

  const scopeIds = viewBranch === "all" ? ALL_IDS : [viewBranch];
  const cells = (p) => scopeIds.map((id) => p.stock[id] ?? 0);
  const scopeTotal = (p) => cells(p).reduce((a, b) => a + b, 0);
  const totalAll = (p) => Object.values(p.stock).reduce((a, b) => a + b, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const c = scopeIds.map((id) => p.stock[id] ?? 0);
      return (
        (category === "all" || p.category === category) &&
        (status === "all" || (status === "low" && c.some((n) => n > 0 && n <= LOW)) || (status === "out" && c.some((n) => n === 0))) &&
        (!q || [p.name, p.category, p.subCategory].some((v) => (v || "").toLowerCase().includes(q)))
      );
    });
    const sum = (p) => scopeIds.reduce((a, id) => a + (p.stock[id] ?? 0), 0);
    const by = {
      lowest: (a, b) => sum(a) - sum(b),
      highest: (a, b) => sum(b) - sum(a),
      name: (a, b) => a.name.localeCompare(b.name),
      category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, query, category, status, sort, viewBranch]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* stats are for the branches in view: every product x branch counts once */
  const allCells = products.flatMap((p) => scopeIds.map((id) => ({ p, n: p.stock[id] ?? 0 })));
  const lowCells = allCells.filter((c) => c.n > 0 && c.n <= LOW);
  const outCells = allCells.filter((c) => c.n === 0);
  const stats = [
    { label: "Total units", value: allCells.reduce((a, c) => a + c.n, 0), icon: Boxes, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Products tracked", value: products.length, icon: Package, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Low stock", value: lowCells.length, icon: AlertTriangle, tone: "bg-amber-500", edge: "border-t-amber-500", note: viewBranch === "all" ? "product and branch combinations" : "" },
    { label: "Out of stock", value: outCells.length, icon: PackageX, tone: "bg-rose-600", edge: "border-t-rose-600", note: viewBranch === "all" ? "product and branch combinations" : "" },
  ];

  /* ----- actions (connect these to your API) ----- */
  const addMovements = (list) =>
    setMovements((ms) => {
      const start = Math.max(0, ...ms.map((m) => m.id)) + 1;
      const at = Date.now();
      return [...list.map((m, i) => ({ reason: "", note: "", by: actor, ...m, id: start + i, at })).reverse(), ...ms];
    });

  const saveAdjust = ({ productId, branchId, change, reason, note }) => {
    if (!editableIds.includes(branchId)) return; // manager: own branch only
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const balance = (p.stock[branchId] ?? 0) + change;
    if (balance < 0) return;
    // POST /inventory/adjustments
    setProducts((ps) => ps.map((x) => (x.id === productId ? { ...x, stock: { ...x.stock, [branchId]: balance } } : x)));
    addMovements([{ productId, productName: p.name, branchId, type: "adjustment", change, balance, reason, note }]);
    setNotice(`${p.name}: ${branchName(branchId)} stock is now ${balance}.`);
    setAdjustFor(null);
  };

  const saveTransfer = ({ productId, fromId, toId, qty, note }) => {
    if (!editableIds.includes(fromId) || fromId === toId) return; // manager: only out of own branch
    const p = products.find((x) => x.id === productId);
    if (!p || qty < 1 || qty > (p.stock[fromId] ?? 0)) return;
    const fromBal = p.stock[fromId] - qty;
    const toBal = (p.stock[toId] ?? 0) + qty;
    // POST /inventory/transfers
    setProducts((ps) => ps.map((x) => (x.id === productId ? { ...x, stock: { ...x.stock, [fromId]: fromBal, [toId]: toBal } } : x)));
    addMovements([
      { productId, productName: p.name, branchId: fromId, type: "transfer", change: -qty, balance: fromBal, reason: "", note: [`To ${branchName(toId)}`, note].filter(Boolean).join(". ") },
      { productId, productName: p.name, branchId: toId, type: "transfer", change: qty, balance: toBal, reason: "", note: [`From ${branchName(fromId)}`, note].filter(Boolean).join(". ") },
    ]);
    setNotice(`${qty} × ${p.name} moved from ${branchName(fromId)} to ${branchName(toId)}.`);
    setTransferFor(null);
  };

  const resetFilters = () => { setQuery(""); setCategory("all"); setStatus("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Watch the stock of every branch, fix counts and move stock between branches"
              : `You can adjust stock and send stock out for ${branchName(MANAGER_BRANCH)}. Other branches are view only`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Demo role switch: remove when real login is connected */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="View as (demo)">
            {[
              { id: "admin", label: "Admin", icon: ShieldCheck },
              { id: "manager", label: "Manager", icon: UserCog },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-pressed={role === id}
                onClick={() => switchRole(id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${role === id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <button className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${focus}`}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Stock levels or stock history">
        {[
          { id: "stock", label: "Stock levels", n: products.length },
          { id: "history", label: "Stock history", n: movements.length },
        ].map((t) => (
          <button
            key={t.id}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition ${focus} ${tab === t.id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {t.label} <span className="ml-1 text-xs text-slate-500">{t.n}</span>
          </button>
        ))}
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />
          <p className="flex-1">{notice}</p>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className={`rounded p-0.5 text-emerald-800 hover:bg-emerald-100 ${focus}`}><X size={16} /></button>
        </div>
      )}

      {tab === "history" ? (
        <StockHistoryTab
          movements={movements}
          branches={BRANCHES}
          viewBranch={viewBranch}
          onViewBranchChange={setViewBranch}
          myBranchId={myBranchId}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, tone, edge, note }) => (
              <div key={label} className={`flex items-center justify-between rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm ${edge}`}>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
                  {note && <p className="text-xs text-slate-500">{note}</p>}
                </div>
                <span className={`rounded-lg p-2.5 text-white ${tone}`}><Icon size={20} /></span>
              </div>
            ))}
          </div>

          {/* Table card */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search by product, category or sub category"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </label>
                <label className="relative">
                  <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700" />
                  <select
                    aria-label="Show stock for branch"
                    value={viewBranch}
                    onChange={(e) => { setViewBranch(e.target.value); setPage(1); }}
                    className={`w-full rounded-lg border border-teal-200 bg-teal-50 py-2 pl-9 pr-3 text-sm font-medium text-teal-900 ${focus}`}
                  >
                    <option value="all">All branches</option>
                    {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}{b.id === myBranchId ? " (your branch)" : ""}</option>)}
                  </select>
                </label>
                <select
                  aria-label="Filter by category"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
                >
                  <option value="lowest">Lowest stock first</option>
                  <option value="highest">Highest stock first</option>
                  <option value="name">Name A to Z</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by stock level">
                  {[
                    { id: "all", label: "All" },
                    { id: "low", label: "Low stock" },
                    { id: "out", label: "Out of stock" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={status === s.id}
                      onClick={() => { setStatus(s.id); setPage(1); }}
                      className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${status === s.id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-200" /> Out of stock</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-200" /> Low ({LOW} or less)</span>
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-teal-50 text-xs text-teal-900">
                  <tr>
                    <th className={th}>Product</th>
                    <th className={th}>Category</th>
                    {scopeIds.map((id) => (
                      <th key={id} className={`${th} text-center ${id === myBranchId ? "bg-teal-100" : ""}`}>
                        {branchName(id)}{id === myBranchId && <span className="block text-[10px] font-normal">your branch</span>}
                      </th>
                    ))}
                    {viewBranch === "all" ? <th className={`${th} text-center`}>Total</th> : <th className={th}>Level</th>}
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => {
                    const canTransfer = isAdmin ? totalAll(p) > 0 : (p.stock[MANAGER_BRANCH] ?? 0) > 0;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-slate-50">
                        <td className={`${td} font-semibold text-slate-900`}>{p.name}</td>
                        <td className={td}>
                          {p.category}
                          {p.subCategory && <span className="block text-xs text-slate-500">{p.subCategory}</span>}
                        </td>
                        {scopeIds.map((id) => (
                          <td key={id} className={`${td} text-center ${id === myBranchId ? "bg-teal-50/60" : ""}`}>
                            <span className={cellCls(p.stock[id] ?? 0)}>{p.stock[id] ?? 0}</span>
                          </td>
                        ))}
                        {viewBranch === "all" ? (
                          <td className={`${td} text-center font-bold text-slate-900`}>{scopeTotal(p)}</td>
                        ) : (
                          <td className={td}>
                            <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${stockState(scopeTotal(p)).cls}`}>{stockState(scopeTotal(p)).label}</span>
                          </td>
                        )}
                        <td className={`${td} text-right`}>
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setAdjustFor(p)}
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                            >
                              <SlidersHorizontal size={14} /> Adjust
                            </button>
                            <button
                              onClick={() => setTransferFor(p)}
                              disabled={!canTransfer}
                              title={canTransfer ? "" : "No stock to send"}
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700 ${focus}`}
                            >
                              <ArrowLeftRight size={14} /> Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="font-semibold text-slate-900">No products match your filters</p>
                  <p className="mt-1 text-sm text-slate-500">Try a different search, branch, category or stock level.</p>
                  <button onClick={resetFilters} className={`mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
              <p>
                Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products
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
      )}

      {adjustFor && (
        <StockAdjustModal
          product={products.find((p) => p.id === adjustFor.id) ?? adjustFor}
          branches={BRANCHES}
          editableIds={editableIds}
          startBranchId={viewBranch === "all" ? myBranchId : viewBranch}
          onClose={() => setAdjustFor(null)}
          onSave={saveAdjust}
        />
      )}

      {transferFor && (
        <StockTransferModal
          product={products.find((p) => p.id === transferFor.id) ?? transferFor}
          branches={BRANCHES}
          editableIds={editableIds}
          startBranchId={viewBranch === "all" ? myBranchId : viewBranch}
          onClose={() => setTransferFor(null)}
          onSave={saveTransfer}
        />
      )}
    </div>
  );
}