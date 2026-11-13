import { useMemo, useState } from "react";
import OrderFormModal from "../../components/shop/OrderFormModal";
import OrderDetailsModal from "../../components/shop/OrderDetailsModal";
import SuppliersTab from "../../components/shop/SuppliersTab";
import SupplierFormModal from "../../components/shop/SupplierFormModal";
import DeleteSupplierModal from "../../components/shop/Deletesuppliermodal";
import { focus, STATUS, STATUS_ORDER, lkr, fmtDate, orderTotal, orderQty, isOverdue } from "../../components/shop/Orderutils";
import {
  Search, Plus, Download, ClipboardList, Clock, PackageCheck, XCircle, Eye, Store,
  ChevronLeft, ChevronRight, ShieldCheck, UserCog, X, CheckCircle2,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API and wire the actions to your endpoints:
     GET  /orders, /suppliers, /products
     saveOrder       -> POST /orders  or  PUT /orders/:id   (pending orders only)
     receiveOrder    -> POST /orders/:id/receive  (the server adds the items to the
                        delivery branch stock in one transaction)
     cancelOrder     -> POST /orders/:id/cancel
     saveSupplier    -> POST /suppliers  or  PUT /suppliers/:id
     removeSupplier  -> DELETE /suppliers/:id

   These are purchase orders: stock you order from a SUPPLIER for a BRANCH.
   Order flow:  Pending delivery  ->  Received (stock added)   or   Cancelled

   Roles
   - Admin   : sees every branch's orders, can create / edit / receive / cancel
               orders for any branch, and manage suppliers.
   - Manager : sees every branch's orders (view only for other branches) but can
               create / edit / receive / cancel orders only for their own branch.
               Suppliers are view only.

   IMPORTANT: hiding buttons is only for a nice screen. Your backend must check
   the role and branch again on every request.
   ===================================================================== */
const BRANCHES = [
  { id: "colombo", name: "Colombo" },
  { id: "negombo", name: "Negombo" },
  { id: "kandy", name: "Kandy" },
  { id: "galle", name: "Galle" },
  { id: "jaffna", name: "Jaffna" },
];
const MANAGER_BRANCH = "colombo"; // demo: in production this comes from the logged-in manager
const branchName = (id) => BRANCHES.find((b) => b.id === id)?.name ?? id;

const CATEGORIES = ["Electrical", "Plumbing", "AC & cooling", "Carpentry", "Painting", "Cleaning"];

const PRODUCTS = [
  ["Ceiling fan 56 inch", 9800], ["PVC pipe 1 inch", 1400], ["AC gas R410A", 6200], ["Door hinge set", 850],
  ["Emulsion paint 4L", 7400], ["Floor cleaner 5L", 2100], ["LED bulb 12W", 480], ["Water tank float", 1250],
  ["Split AC bracket", 2600], ["Wood glue 500ml", 760], ["Wall putty 20kg", 3900], ["Microfibre cloth pack", 650],
].map(([name, cost], i) => ({ id: i + 1, name, cost }));

const DAY = 86400000;

const SUPPLIERS_SEED = [
  { name: "Lanka Electricals (Pvt) Ltd", contactPerson: "Ajith Weerasinghe", phone: "011 234 5678", email: "sales@lankaelectricals.example", city: "Colombo", categories: ["Electrical"] },
  { name: "Ceylon Pipes & Fittings", contactPerson: "Mahesh Rathnayake", phone: "081 222 3344", email: "orders@ceylonpipes.example", city: "Kandy", categories: ["Plumbing"] },
  { name: "CoolTech Distributors", contactPerson: "Ishara Gunasekara", phone: "011 555 7788", email: "", city: "Gampaha", categories: ["AC & cooling", "Electrical"] },
  { name: "Royal Timber Works", contactPerson: "Chaminda Jayasuriya", phone: "091 223 4455", email: "info@royaltimber.example", city: "Galle", categories: ["Carpentry"] },
  { name: "Colorline Paints", contactPerson: "Dilani Fonseka", phone: "011 777 8899", email: "dilani@colorline.example", city: "Colombo", categories: ["Painting", "Cleaning"] },
  { name: "Sparkle Cleaning Supplies", contactPerson: "Nuwan Perera", phone: "031 222 1100", email: "", city: "Negombo", categories: ["Cleaning"] },
].map((s, i) => ({ ...s, id: i + 1, status: i === 5 ? "inactive" : "active", createdAt: Date.now() - (i * 25 + 30) * DAY }));

const NOTES = ["", "Please deliver before noon.", "Call the branch before delivery.", "", "Urgent, stock is almost finished."];

const ORDERS_SEED = Array.from({ length: 22 }, (_, i) => {
  const status = i < 7 ? "pending" : i % 6 === 1 ? "cancelled" : "received";
  const createdAt = Date.now() - (i * 3 + 1) * DAY;
  const count = 1 + (i % 4);
  const items = Array.from({ length: count }, (_, k) => {
    const p = PRODUCTS[(i * 2 + k * 3) % PRODUCTS.length];
    return { productId: p.id, name: p.name, qty: 5 + ((i + k * 7) % 6) * 5, unitCost: p.cost };
  });
  return {
    id: i + 1,
    code: `PO-${1001 + i}`,
    supplierId: (i % 5) + 1,
    branchId: BRANCHES[(i * 2) % BRANCHES.length].id,
    items,
    status,
    createdAt,
    expectedDate: status === "pending" ? Date.now() + (i - 2) * 2 * DAY : createdAt + 6 * DAY,
    receivedAt: status === "received" ? createdAt + (5 + (i % 3)) * DAY : null,
    note: NOTES[i % NOTES.length],
  };
});

const PAGE_SIZE = 8;

/* ---------- small pieces ---------- */
function StatusPill({ status }) {
  const s = STATUS[status];
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

/* ---------- page ---------- */
export default function AllOrdersPage() {
  /* Demo role switch. Remove this and read the role from your auth later. */
  const [role, setRole] = useState("admin");
  const isAdmin = role === "admin";
  const canManageOrder = (o) => isAdmin || o.branchId === MANAGER_BRANCH;
  const orderBranches = isAdmin ? BRANCHES : BRANCHES.filter((b) => b.id === MANAGER_BRANCH);

  const [tab, setTab] = useState("orders"); // "orders" | "suppliers"
  const [orders, setOrders] = useState(ORDERS_SEED);
  const [suppliers, setSuppliers] = useState(SUPPLIERS_SEED);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [viewBranch, setViewBranch] = useState("all"); // "all" or a branch id
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  /* modal state */
  const [viewId, setViewId] = useState(null);                  // order details
  const [formFor, setFormFor] = useState(null);                // "new" | order | null
  const [supplierFormFor, setSupplierFormFor] = useState(null); // "new" | supplier | null (admin only)
  const [deleteSupplier, setDeleteSupplier] = useState(null);   // supplier | null (admin only)
  const [notice, setNotice] = useState("");

  const supplierOf = (id) => suppliers.find((s) => s.id === id);

  const switchRole = (r) => {
    setRole(r);
    setViewBranch(r === "manager" ? MANAGER_BRANCH : "all"); // manager starts on their own branch
    setPage(1);
    setViewId(null); setFormFor(null); setSupplierFormFor(null); setDeleteSupplier(null); setNotice("");
  };

  /* suppliers with their order numbers, for the suppliers tab */
  const suppliersWithCounts = useMemo(
    () =>
      suppliers.map((s) => ({
        ...s,
        orderCount: orders.filter((o) => o.supplierId === s.id).length,
        pendingCount: orders.filter((o) => o.supplierId === s.id && o.status === "pending").length,
      })),
    [suppliers, orders]
  );

  const scoped = useMemo(() => (viewBranch === "all" ? orders : orders.filter((o) => o.branchId === viewBranch)), [orders, viewBranch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scoped.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (!q ||
          [o.code, supplierOf(o.supplierId)?.name ?? "", branchName(o.branchId), ...o.items.map((i) => i.name)].some((v) =>
            v.toLowerCase().includes(q)
          ))
    );
    const by = {
      newest: (a, b) => b.createdAt - a.createdAt,
      totalHigh: (a, b) => orderTotal(b) - orderTotal(a),
      delivery: (a, b) => a.expectedDate - b.expectedDate,
      supplier: (a, b) => (supplierOf(a.supplierId)?.name ?? "").localeCompare(supplierOf(b.supplierId)?.name ?? ""),
    };
    return [...list].sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, query, status, sort, suppliers]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const viewOrder = orders.find((o) => o.id === viewId);

  const count = (s) => scoped.filter((o) => o.status === s).length;
  const overdueCount = scoped.filter(isOverdue).length;
  const stats = [
    { label: "Total orders", value: scoped.length, icon: ClipboardList, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Pending delivery", value: count("pending"), icon: Clock, tone: "bg-amber-500", edge: "border-t-amber-500", note: overdueCount > 0 ? `${overdueCount} overdue` : "" },
    { label: "Received", value: count("received"), icon: PackageCheck, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Cancelled", value: count("cancelled"), icon: XCircle, tone: "bg-rose-600", edge: "border-t-rose-600" },
  ];

  /* ----- order actions (connect these to your API) ----- */
  const saveOrder = (data) => {
    if (formFor && formFor !== "new") {
      // UPDATE -> PUT /orders/:id   (pending orders only, and only the user's own branch for a manager)
      if (formFor.status !== "pending" || !canManageOrder(formFor)) return;
      setOrders((os) => os.map((o) => (o.id === formFor.id ? { ...o, ...data } : o)));
    } else {
      // ADD    -> POST /orders
      if (!isAdmin && data.branchId !== MANAGER_BRANCH) return;
      const id = Math.max(0, ...orders.map((o) => o.id)) + 1;
      const code = `PO-${1000 + id}`;
      setOrders((os) => [{ ...data, id, code, status: "pending", createdAt: Date.now(), receivedAt: null }, ...os]);
      setNotice(`Order ${code} placed with ${supplierOf(data.supplierId)?.name}.`);
      setSort("newest");
      setStatus("all");
      setPage(1);
      if (viewBranch !== "all" && viewBranch !== data.branchId) setViewBranch(data.branchId);
    }
    setFormFor(null);
  };

  const receiveOrder = (id) => {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status !== "pending" || !canManageOrder(o)) return;
    // POST /orders/:id/receive  -> the server also adds the items to the stock of o.branchId
    setOrders((os) => os.map((x) => (x.id === id ? { ...x, status: "received", receivedAt: Date.now() } : x)));
    setNotice(`${o.code} received. ${orderQty(o)} units added to the ${branchName(o.branchId)} stock.`);
    setViewId(null);
  };

  const cancelOrder = (id) => {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status !== "pending" || !canManageOrder(o)) return;
    // POST /orders/:id/cancel
    setOrders((os) => os.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
    setNotice(`${o.code} was cancelled.`);
    setViewId(null);
  };

  /* ----- supplier actions (admin only) ----- */
  const saveSupplier = (data) => {
    if (!isAdmin) return;
    if (supplierFormFor && supplierFormFor !== "new") {
      // UPDATE -> PUT /suppliers/:id
      setSuppliers((ss) => ss.map((s) => (s.id === supplierFormFor.id ? { ...s, ...data } : s)));
    } else {
      // ADD    -> POST /suppliers
      setSuppliers((ss) => [{ ...data, id: Math.max(0, ...ss.map((s) => s.id)) + 1, createdAt: Date.now() }, ...ss]);
    }
    setSupplierFormFor(null);
  };

  const removeSupplier = () => {
    if (!isAdmin || !deleteSupplier || deleteSupplier.orderCount > 0) return;
    // DELETE -> DELETE /suppliers/:id
    setSuppliers((ss) => ss.filter((s) => s.id !== deleteSupplier.id));
    setDeleteSupplier(null);
  };

  const resetFilters = () => { setQuery(""); setStatus("all"); setPage(1); };

  /* suppliers shown in the order form: active ones, plus the order's own supplier when editing */
  const formSuppliers = suppliers.filter(
    (s) => s.status === "active" || (formFor && formFor !== "new" && s.id === formFor.supplierId)
  );

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders and suppliers</h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Order stock from suppliers for every branch and manage your suppliers"
              : `You can place and receive orders for ${branchName(MANAGER_BRANCH)}. Other branches and suppliers are view only`}
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
          {tab === "orders" ? (
            <button onClick={() => setFormFor("new")} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>
              <Plus size={16} /> New order
            </button>
          ) : (
            isAdmin && (
              <button onClick={() => setSupplierFormFor("new")} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>
                <Plus size={16} /> Add supplier
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Orders or suppliers">
        {[
          { id: "orders", label: "Orders", n: orders.length },
          { id: "suppliers", label: "Suppliers", n: suppliers.length },
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

      {tab === "suppliers" ? (
        <SuppliersTab
          suppliers={suppliersWithCounts}
          canManage={isAdmin}
          onAdd={() => setSupplierFormFor("new")}
          onEdit={(s) => setSupplierFormFor(s)}
          onDelete={(s) => setDeleteSupplier(s)}
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
                  {note && <p className="text-xs font-medium text-rose-600">{note}</p>}
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
                    placeholder="Search by order, supplier, branch or product"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </label>
                <label className="relative">
                  <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700" />
                  <select
                    aria-label="Show orders for branch"
                    value={viewBranch}
                    onChange={(e) => { setViewBranch(e.target.value); setPage(1); }}
                    className={`w-full rounded-lg border border-teal-200 bg-teal-50 py-2 pl-9 pr-3 text-sm font-medium text-teal-900 ${focus}`}
                  >
                    <option value="all">All branches</option>
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}{!isAdmin && b.id === MANAGER_BRANCH ? " (your branch)" : ""}</option>
                    ))}
                  </select>
                </label>
                <select
                  aria-label="Sort orders"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
                >
                  <option value="newest">Newest first</option>
                  <option value="totalHigh">Highest total</option>
                  <option value="delivery">Delivery date</option>
                  <option value="supplier">Supplier A to Z</option>
                </select>
              </div>
              <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by status">
                {["all", ...STATUS_ORDER].map((s) => (
                  <button
                    key={s}
                    aria-pressed={status === s}
                    onClick={() => { setStatus(s); setPage(1); }}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${status === s ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {s === "all" ? "All" : STATUS[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-teal-50 text-xs text-teal-900">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Supplier</th>
                    <th className={th}>Branch</th>
                    <th className={th}>Items</th>
                    <th className={th}>Total</th>
                    <th className={th}>Expected delivery</th>
                    <th className={th}>Status</th>
                    <th className={th}>Placed</th>
                    <th className={`${th} text-right`}>Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((o) => (
                    <tr key={o.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => setViewId(o.id)}>
                      <td className={td}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewId(o.id); }}
                          className={`rounded text-left font-semibold text-slate-900 hover:text-teal-700 ${focus}`}
                        >
                          {o.code}
                        </button>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {supplierOf(o.supplierId)?.name ?? <span className="text-slate-400">Unknown supplier</span>}
                      </td>
                      <td className={td}>{branchName(o.branchId)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {o.items.length} {o.items.length === 1 ? "item" : "items"}
                        <span className="block text-xs text-slate-500">{orderQty(o)} units</span>
                      </td>
                      <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(orderTotal(o))}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {fmtDate(o.expectedDate)}
                        {isOverdue(o) && <span className="block text-xs font-medium text-rose-600">Overdue</span>}
                      </td>
                      <td className={td}><StatusPill status={o.status} /></td>
                      <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(o.createdAt)}</td>
                      <td className={`${td} text-right`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewId(o.id); }}
                          className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="font-semibold text-slate-900">No orders match your filters</p>
                  <p className="mt-1 text-sm text-slate-500">Try a different search, branch or status, or place a new order.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button onClick={resetFilters} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
                    <button onClick={() => setFormFor("new")} className={`rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 ${focus}`}>New order</button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
              <p>
                Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} orders
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

      {/* Modals */}
      {viewOrder && !formFor && (
        <OrderDetailsModal
          order={viewOrder}
          supplier={supplierOf(viewOrder.supplierId)}
          branchName={branchName(viewOrder.branchId)}
          canManage={canManageOrder(viewOrder)}
          onClose={() => setViewId(null)}
          onEdit={(o) => { setViewId(null); setFormFor(o); }}
          onReceive={receiveOrder}
          onCancel={cancelOrder}
        />
      )}

      {formFor && (
        <OrderFormModal
          order={formFor === "new" ? null : formFor}
          suppliers={formSuppliers}
          branches={orderBranches}
          products={PRODUCTS}
          onClose={() => setFormFor(null)}
          onSave={saveOrder}
        />
      )}

      {isAdmin && supplierFormFor && (
        <SupplierFormModal
          supplier={supplierFormFor === "new" ? null : supplierFormFor}
          categories={CATEGORIES}
          existingNames={suppliers.filter((s) => supplierFormFor === "new" || s.id !== supplierFormFor.id).map((s) => s.name)}
          onClose={() => setSupplierFormFor(null)}
          onSave={saveSupplier}
        />
      )}

      {isAdmin && deleteSupplier && (
        <DeleteSupplierModal supplier={deleteSupplier} onClose={() => setDeleteSupplier(null)} onConfirm={removeSupplier} />
      )}
    </div>
  );
}