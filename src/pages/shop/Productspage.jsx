import { useMemo, useState } from "react";
import ProductFormModal from "../../components/shop/Productformmodal";
import DeleteProductModal from "../../components/shop/DeleteProductModal";
import BranchStockModal from "../../components/shop/BranchStockModal";
import SupplierProductsTab from "../../components/shop/SupplierProductsTab";
import SupplierProductFormModal from "../../components/shop/SupplierProductFormModal";
import DeleteSupplierProductModal from "../../components/shop/DeleteSupplierProductModal";
import {
  Search, Plus, Download, Package, CheckCircle2, AlertTriangle, PackageX,
  Pencil, Trash2, Boxes, ChevronLeft, ChevronRight, Image as ImageIcon, Store, ShieldCheck, UserCog,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API (GET /products) and wire the actions
   in `saveProduct`, `saveStock` and `removeProducts` to your endpoints.

   Stock is kept per branch:  stock = { colombo: 12, kandy: 3, ... }

   Roles
   - Admin   : sees the stock of every branch and can change all of it.
               Can also add, edit and delete products.
   - Manager : can see the stock of every branch (view only for other
               branches) but can only CHANGE the stock of their own branch.
               Can ADD new products (stock can only be set for their own
               branch, other branches start at 0).
               Cannot edit or delete existing products.

   Supplier products (second tab): suppliers sell their OWN products. These are
   kept separate from the products you sell in your branches, so they have no
   branch stock. Each one belongs to a supplier and has the supplier's price and
   minimum order quantity.
   - Admin   : can see this tab, and add, edit and delete supplier products.
   - Manager : cannot see supplier products at all (the tab is hidden).
   Connect `saveSupplierProduct` and `removeSupplierProduct` to your endpoints
   (POST / PUT / DELETE /supplier-products). The supplier list is the same one
   the Orders page uses (GET /suppliers).

   IMPORTANT: hiding buttons is only for a nice screen. Your backend must
   check the role and branch again on every request (for example, reject
   PUT /products/:id/stock if the manager's branch is not the one sent).
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

const CATEGORIES = ["Electrical", "Plumbing", "AC & cooling", "Carpentry", "Painting", "Cleaning"];
/* Sub categories per category. A category with an empty list has no sub categories
   (the sub category field is hidden in the form for it). */
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

const SEED = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: NAMES[i % NAMES.length] + (i >= NAMES.length ? " (Pro)" : ""),
  category: CATEGORIES[i % CATEGORIES.length],
  subCategory: (() => {
    const subs = SUBCATEGORIES[CATEGORIES[i % CATEGORIES.length]];
    return subs.length ? subs[i % subs.length] : "";
  })(),
  price: 850 + (((i + 2) * 977) % 40) * 450,
  stock: Object.fromEntries(BRANCHES.map((b, k) => [b.id, STOCK_PATTERN[(i + k * 3) % STOCK_PATTERN.length]])),
  status: i % 9 === 4 ? "draft" : "active",
  description: "Quality product for home and site work. Contact the team for bulk pricing.",
  image: "",
  createdAt: Date.now() - (i * 3 + 1) * 86400000,
}));

/* Demo suppliers. In production load these from GET /suppliers. */
const SUPPLIERS = [
  { id: 1, name: "Lanka Electricals (Pvt) Ltd", status: "active" },
  { id: 2, name: "Ceylon Pipes & Fittings", status: "active" },
  { id: 3, name: "CoolTech Distributors", status: "active" },
  { id: 4, name: "Royal Timber Works", status: "active" },
  { id: 5, name: "Colorline Paints", status: "active" },
  { id: 6, name: "Sparkle Cleaning Supplies", status: "inactive" },
];
const SUPPLIER_FOR = { Electrical: [1, 3], Plumbing: [2], "AC & cooling": [3], Carpentry: [4], Painting: [5], Cleaning: [6, 5] };
const SP_NAMES = {
  Electrical: ["Ceiling fan 56 inch", "LED bulb 12W (box of 20)", "2.5mm wire roll 100m", "Switch socket set", "MCB 20A"],
  Plumbing: ["PVC pipe 1 inch (6m)", "Water tank float valve", "PVC elbow pack (50)", "Tap set chrome", "Teflon tape (box of 50)"],
  "AC & cooling": ["AC gas R410A cylinder", "Split AC bracket pair", "Copper pipe roll 15m", "AC remote universal", "Drain hose 10m"],
  Carpentry: ["Door hinge set (box of 50)", "Wood glue 5L", "Plywood sheet 8x4", "Screws assorted box", "Sandpaper pack (100)"],
  Painting: ["Emulsion paint 20L", "Wall putty 20kg bag", "Paint roller set", "Masking tape (box of 48)", "Primer 4L"],
  Cleaning: ["Floor cleaner 20L", "Microfibre cloth (pack of 100)", "Disinfectant 5L", "Mop set heavy", "Garbage bags (box)"],
};
const SUPPLIER_PRODUCTS_SEED = Array.from({ length: 30 }, (_, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const round = Math.floor(i / CATEGORIES.length);
  const subs = SUBCATEGORIES[cat];
  return {
    id: i + 1,
    supplierId: SUPPLIER_FOR[cat][round % SUPPLIER_FOR[cat].length],
    name: SP_NAMES[cat][round % SP_NAMES[cat].length],
    category: cat,
    subCategory: subs.length ? subs[i % subs.length] : "",
    unitCost: 300 + ((i * 977) % 40) * 250,
    minOrderQty: [1, 5, 10, 20][i % 4],
    availability: i % 7 === 4 ? "out_of_stock" : "available",
    description: "Sold by the supplier. Ask the supplier about bulk prices and delivery.",
    image: "",
    createdAt: Date.now() - (i * 4 + 2) * 86400000,
  };
});

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-300" },
};
const STATUS_ORDER = ["active", "draft"];

const stockState = (n) =>
  n === 0
    ? { label: "Out of stock", cls: "bg-rose-100 text-rose-800 border-rose-300" }
    : n <= 5
    ? { label: "Low stock", cls: "bg-amber-100 text-amber-800 border-amber-300" }
    : { label: "In stock", cls: "bg-sky-100 text-sky-800 border-sky-300" };

const totalStock = (p) => Object.values(p.stock).reduce((a, b) => a + b, 0);
const lkr = (v) => "LKR " + v.toLocaleString("en-US");
const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 8;

/* ---------- small pieces ---------- */
function Pill({ cls, children }) {
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}

function Checkbox(props) {
  return <input type="checkbox" className={`h-4 w-4 rounded border-slate-300 text-teal-700 ${focus}`} {...props} />;
}

function Thumb({ src, name }) {
  return src ? (
    <img src={src} alt={name} className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      <ImageIcon size={18} />
    </span>
  );
}

/* ---------- page ---------- */
export default function AllProductsPage() {
  /* Demo role switch. Remove this and read the role from your auth later. */
  const [role, setRole] = useState("admin");
  const isAdmin = role === "admin";
  const myBranchId = isAdmin ? null : MANAGER_BRANCH;
  const editableIds = isAdmin ? ALL_IDS : [MANAGER_BRANCH];

  const [tab, setTab] = useState("products"); // "products" | "supplierProducts"
  const onSupplierTab = isAdmin && tab === "supplierProducts"; // managers can never be on this tab
  const [products, setProducts] = useState(SEED);
  const [supplierProducts, setSupplierProducts] = useState(SUPPLIER_PRODUCTS_SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [viewBranch, setViewBranch] = useState("all"); // "all" or a branch id
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  /* modal state */
  const [formFor, setFormFor] = useState(null);   // "new" | product | null   (admin only)
  const [stockFor, setStockFor] = useState(null); // product | null
  const [deleteIds, setDeleteIds] = useState([]); // (admin only)
  const [spFormFor, setSpFormFor] = useState(null);       // "new" | supplier product | null  (admin only)
  const [spDelete, setSpDelete] = useState(null);         // supplier product | null (admin only)

  const switchRole = (r) => {
    setRole(r);
    setSelected([]);
    setViewBranch(r === "manager" ? MANAGER_BRANCH : "all"); // manager starts on their own branch
    setPage(1);
    setSpFormFor(null);
    setSpDelete(null);
    setTab("products"); // supplier products are admin only
  };

  /* stock number shown in the table for the current branch view */
  const stockIn = (p) => (viewBranch === "all" ? totalStock(p) : p.stock[viewBranch] ?? 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (category === "all" || p.category === category) &&
        (subCategory === "all" || p.subCategory === subCategory) &&
        (!q || [p.name, p.category, p.subCategory].some((v) => (v || "").toLowerCase().includes(q)))
    );
    const by = {
      newest: (a, b) => b.createdAt - a.createdAt,
      priceHigh: (a, b) => b.price - a.price,
      priceLow: (a, b) => a.price - b.price,
      stock: (a, b) => stockIn(a) - stockIn(b),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, query, status, category, subCategory, sort, viewBranch]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const stats = [
    { label: "Total products", value: products.length, icon: Package, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Active", value: products.filter((p) => p.status === "active").length, icon: CheckCircle2, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Low stock", value: products.filter((p) => stockIn(p) > 0 && stockIn(p) <= 5).length, icon: AlertTriangle, tone: "bg-amber-500", edge: "border-t-amber-500" },
    { label: "Out of stock", value: products.filter((p) => stockIn(p) === 0).length, icon: PackageX, tone: "bg-rose-600", edge: "border-t-rose-600" },
  ];

  /* ----- actions (connect these to your API) ----- */
  const saveProduct = (data) => {
    if (formFor && formFor !== "new") {
      // UPDATE  -> PUT /products/:id   (admin only)
      if (!isAdmin) return;
      setProducts((ps) => ps.map((p) => (p.id === formFor.id ? { ...p, ...data } : p)));
    } else {
      // ADD     -> POST /products   (admin or manager)
      // A manager can only put stock in their own branch, every other branch is forced to 0
      const stock = Object.fromEntries(BRANCHES.map((b) => [b.id, editableIds.includes(b.id) ? data.stock[b.id] ?? 0 : 0]));
      setProducts((ps) => [
        { ...data, stock, addedByBranch: myBranchId, id: Math.max(0, ...ps.map((p) => p.id)) + 1, createdAt: Date.now() },
        ...ps,
      ]);
      if (!isAdmin) setViewBranch(MANAGER_BRANCH);
      setSort("newest");
      setPage(1);
    }
    setFormFor(null);
  };

  /* `changes` only holds the branches this user is allowed to edit, e.g. { colombo: 20 } */
  const saveStock = (productId, changes) => {
    // PUT /products/:id/stock   body: changes   (server must re-check the branch permission)
    const allowed = Object.fromEntries(Object.entries(changes).filter(([id]) => editableIds.includes(id)));
    setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, stock: { ...p.stock, ...allowed } } : p)));
    setStockFor(null);
  };

  const removeProducts = () => {
    if (!isAdmin) return;
    // DELETE -> DELETE /products/:id  (once per id, or one bulk call)
    setProducts((ps) => ps.filter((p) => !deleteIds.includes(p.id)));
    setSelected((s) => s.filter((id) => !deleteIds.includes(id)));
    setDeleteIds([]);
  };

  /* ----- supplier product actions (admin only, connect these to your API) ----- */
  const saveSupplierProduct = (data) => {
    if (!isAdmin) return;
    if (spFormFor && spFormFor !== "new") {
      // UPDATE -> PUT /supplier-products/:id
      setSupplierProducts((ps) => ps.map((p) => (p.id === spFormFor.id ? { ...p, ...data } : p)));
    } else {
      // ADD    -> POST /supplier-products
      setSupplierProducts((ps) => [{ ...data, id: Math.max(0, ...ps.map((p) => p.id)) + 1, createdAt: Date.now() }, ...ps]);
    }
    setSpFormFor(null);
  };

  const removeSupplierProduct = () => {
    if (!isAdmin || !spDelete) return;
    // DELETE -> DELETE /supplier-products/:id
    setSupplierProducts((ps) => ps.filter((p) => p.id !== spDelete.id));
    setSpDelete(null);
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const resetFilters = () => { setQuery(""); setStatus("all"); setCategory("all"); setSubCategory("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";
  const stockHeading = viewBranch === "all" ? "Total stock" : `${branchName(viewBranch)} stock`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All products</h1>
          <p className="text-sm text-slate-500">
            {onSupplierTab
              ? "Products that your suppliers sell, with their prices and minimum order quantities"
              : isAdmin
              ? "Manage products and the stock of every branch"
              : `You can add products and update stock for ${branchName(MANAGER_BRANCH)}. Other branches are view only`}
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
          {!onSupplierTab ? (
            <button onClick={() => setFormFor("new")} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>
              <Plus size={16} /> Add product
            </button>
          ) : (
            <button onClick={() => setSpFormFor("new")} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>
              <Plus size={16} /> Add supplier product
            </button>
          )}
        </div>
      </div>

      {/* Tabs (admin only: managers only have "Our products") */}
      {isAdmin && (
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Your products or supplier products">
        {[
          { id: "products", label: "Our products", n: products.length },
          { id: "supplierProducts", label: "Supplier products", n: supplierProducts.length },
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
      )}

      {onSupplierTab ? (
        <SupplierProductsTab
          items={supplierProducts}
          suppliers={SUPPLIERS}
          categories={CATEGORIES}
          subCategories={SUBCATEGORIES}
          onAdd={() => setSpFormFor("new")}
          onEdit={(p) => setSpFormFor(p)}
          onDelete={(p) => setSpDelete(p)}
        />
      ) : (
      <>
      {/* Stats */}
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
                onChange={(e) => setViewBranch(e.target.value)}
                className={`w-full rounded-lg border border-teal-200 bg-teal-50 py-2 pl-9 pr-3 text-sm font-medium text-teal-900 ${focus}`}
              >
                <option value="all">All branches</option>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.id === myBranchId ? " (your branch)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setSubCategory("all"); setPage(1); }}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* only shown when the chosen category has sub categories */}
            {(SUBCATEGORIES[category] ?? []).length > 0 && (
              <select
                aria-label="Filter by sub category"
                value={subCategory}
                onChange={(e) => { setSubCategory(e.target.value); setPage(1); }}
                className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
              >
                <option value="all">All sub categories</option>
                {SUBCATEGORIES[category].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
            >
              <option value="newest">Newest first</option>
              <option value="priceHigh">Price: high to low</option>
              <option value="priceLow">Price: low to high</option>
              <option value="stock">Lowest stock</option>
              <option value="name">Name A to Z</option>
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

        {/* Bulk bar (admin only) */}
        {isAdmin && selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-teal-200 bg-teal-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-teal-900">{selected.length} selected</span>
            <button onClick={() => setDeleteIds(selected)} className={`flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-medium text-rose-700 shadow-sm hover:bg-rose-50 ${focus}`}>
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setSelected([])} className={`ml-auto rounded-md px-2 py-1 font-medium text-teal-800 hover:underline ${focus}`}>Clear</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-teal-50 text-xs text-teal-900">
              <tr>
                {isAdmin && (
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allOnPage}
                      onChange={() => setSelected(allOnPage ? selected.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selected, ...rows.map((r) => r.id)])])}
                    />
                  </th>
                )}
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={th}>Price</th>
                <th className={th}>{stockHeading}</th>
                <th className={th}>Availability</th>
                <th className={th}>Status</th>
                <th className={th}>Added</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const n = stockIn(p);
                const st = stockState(n);
                const canChangeThis = viewBranch === "all" ? editableIds.length > 0 : editableIds.includes(viewBranch);
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-50 ${selected.includes(p.id) ? "bg-teal-50/60" : ""}`}>
                    {isAdmin && (
                      <td className={td}>
                        <Checkbox aria-label={`Select ${p.name}`} checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                      </td>
                    )}
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Thumb src={p.image} name={p.name} />
                        <span className="font-semibold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className={td}>
                      {p.category}
                      {p.subCategory && <span className="block text-xs text-slate-500">{p.subCategory}</span>}
                    </td>
                    <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(p.price)}</td>
                    <td className={`${td} font-medium text-slate-900`}>{n}</td>
                    <td className={td}><Pill cls={st.cls}>{st.label}</Pill></td>
                    <td className={td}><Pill cls={STATUS[p.status].cls}>{STATUS[p.status].label}</Pill></td>
                    <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(p.createdAt)}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => setStockFor(p)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                        >
                          <Boxes size={14} /> {isAdmin || canChangeThis ? "Branch stock" : "View stock"}
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setFormFor(p)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteIds([p.id])}
                              aria-label={`Delete ${p.name}`}
                              className={`inline-flex items-center rounded-lg border border-slate-200 p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50 ${focus}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
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
              <p className="mt-1 text-sm text-slate-500">Try a different search, category or status.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={resetFilters} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
                <button onClick={() => setFormFor("new")} className={`rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 ${focus}`}>Add product</button>
              </div>
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

      {formFor && (isAdmin || formFor === "new") && (
        <ProductFormModal
          product={formFor === "new" ? null : formFor}
          categories={CATEGORIES}
          subCategories={SUBCATEGORIES}
          branches={BRANCHES}
          editableIds={editableIds}
          onClose={() => setFormFor(null)}
          onSave={saveProduct}
        />
      )}

      {stockFor && (
        <BranchStockModal
          product={stockFor}
          branches={BRANCHES}
          editableIds={editableIds}
          myBranchId={myBranchId}
          onClose={() => setStockFor(null)}
          onSave={saveStock}
        />
      )}

      {isAdmin && deleteIds.length > 0 && (
        <DeleteProductModal
          products={products.filter((p) => deleteIds.includes(p.id))}
          onClose={() => setDeleteIds([])}
          onConfirm={removeProducts}
        />
      )}

      {isAdmin && spFormFor && (
        <SupplierProductFormModal
          product={spFormFor === "new" ? null : spFormFor}
          suppliers={SUPPLIERS.filter((x) => x.status === "active" || (spFormFor !== "new" && x.id === spFormFor.supplierId))}
          categories={CATEGORIES}
          subCategories={SUBCATEGORIES}
          onClose={() => setSpFormFor(null)}
          onSave={saveSupplierProduct}
        />
      )}

      {isAdmin && spDelete && (
        <DeleteSupplierProductModal
          product={spDelete}
          supplierName={SUPPLIERS.find((x) => x.id === spDelete.supplierId)?.name ?? "the supplier"}
          onClose={() => setSpDelete(null)}
          onConfirm={removeSupplierProduct}
        />
      )}
    </div>
  );
}