import { useMemo, useState } from "react";
import {
  Search, Pencil, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, Truck, Package, CheckCircle2, PackageX,
} from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const PAGE_SIZE = 8;
const lkr = (v) => "LKR " + v.toLocaleString("en-US");
const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const AVAIL = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  out_of_stock: { label: "Out of stock", cls: "bg-rose-100 text-rose-800 border-rose-300" },
};

function Thumb({ src, name }) {
  return src ? (
    <img src={src} alt={name} className="h-10 w-10 shrink-0 rounded-lg border border-blue-100 object-cover" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
      <ImageIcon size={18} />
    </span>
  );
}

/**
 * The products that SUPPLIERS sell (their own catalog, separate from your branch products).
 * Admin only: the page does not show this tab to managers at all.
 */
export default function SupplierProductsTab({ items, suppliers, categories, subCategories, onAdd, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name ?? "Unknown supplier";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (p) =>
        (supplier === "all" || p.supplierId === Number(supplier)) &&
        (category === "all" || p.category === category) &&
        (subCategory === "all" || p.subCategory === subCategory) &&
        (availability === "all" || p.availability === availability) &&
        (!q || [p.name, p.category, p.subCategory, supplierName(p.supplierId)].some((v) => (v || "").toLowerCase().includes(q)))
    );
    const by = {
      newest: (a, b) => b.createdAt - a.createdAt,
      priceLow: (a, b) => a.unitCost - b.unitCost,
      priceHigh: (a, b) => b.unitCost - a.unitCost,
      name: (a, b) => a.name.localeCompare(b.name),
      supplier: (a, b) => supplierName(a.supplierId).localeCompare(supplierName(b.supplierId)),
    };
    return [...list].sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, suppliers, query, supplier, category, subCategory, availability, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = [
    { label: "Supplier products", value: items.length, icon: Package, tone: "bg-blue-600", edge: "border-t-blue-600" },
    { label: "Suppliers with products", value: new Set(items.map((p) => p.supplierId)).size, icon: Truck, tone: "bg-sky-500", edge: "border-t-sky-500" },
    { label: "Available", value: items.filter((p) => p.availability === "available").length, icon: CheckCircle2, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Out of stock", value: items.filter((p) => p.availability === "out_of_stock").length, icon: PackageX, tone: "bg-rose-600", edge: "border-t-rose-600" },
  ];

  const resetFilters = () => { setQuery(""); setSupplier("all"); setCategory("all"); setSubCategory("all"); setAvailability("all"); setPage(1); };
  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";
  const selectCls = `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, edge }) => (
          <div key={label} className={`flex items-center justify-between rounded-xl border border-t-4 border-blue-100 bg-white p-4 shadow-sm ${edge}`}>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{value.toLocaleString()}</p>
            </div>
            <span className={`rounded-lg p-2.5 text-white ${tone}`}><Icon size={20} /></span>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-blue-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-blue-100 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search by product, supplier, category or sub category"
                className="w-full rounded-lg border border-slate-300 bg-blue-50/50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </label>
            <label className="relative">
              <Truck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-700" />
              <select
                aria-label="Filter by supplier"
                value={supplier}
                onChange={(e) => { setSupplier(e.target.value); setPage(1); }}
                className={`w-full rounded-lg border border-blue-200 bg-blue-50 py-2 pl-9 pr-3 text-sm font-medium text-blue-900 ${focus}`}
              >
                <option value="all">All suppliers</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <select aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory("all"); setPage(1); }} className={selectCls}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(subCategories[category] ?? []).length > 0 && (
              <select aria-label="Filter by sub category" value={subCategory} onChange={(e) => { setSubCategory(e.target.value); setPage(1); }} className={selectCls}>
                <option value="all">All sub categories</option>
                {subCategories[category].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <select aria-label="Sort supplier products" value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
              <option value="newest">Newest first</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
              <option value="name">Name A to Z</option>
              <option value="supplier">Supplier A to Z</option>
            </select>
          </div>
          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-blue-50 p-1" role="group" aria-label="Filter by availability">
            {["all", "available", "out_of_stock"].map((s) => (
              <button
                key={s}
                aria-pressed={availability === s}
                onClick={() => { setAvailability(s); setPage(1); }}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${availability === s ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-blue-900"}`}
              >
                {s === "all" ? "All" : AVAIL[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-blue-50 text-xs text-blue-900">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Supplier</th>
                <th className={th}>Category</th>
                <th className={th}>Supplier price</th>
                <th className={th}>Min order</th>
                <th className={th}>Availability</th>
                <th className={th}>Added</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-blue-50/50">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Thumb src={p.image} name={p.name} />
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{supplierName(p.supplierId)}</td>
                  <td className={td}>
                    {p.category}
                    {p.subCategory && <span className="block text-xs text-slate-500">{p.subCategory}</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(p.unitCost)}</td>
                  <td className={td}>{p.minOrderQty}</td>
                  <td className={td}>
                    <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${AVAIL[p.availability].cls}`}>{AVAIL[p.availability].label}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(p.createdAt)}</td>
                  <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button onClick={() => onEdit(p)} className={`inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-900 hover:border-blue-600 hover:bg-blue-50 ${focus}`}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => onDelete(p)} aria-label={`Delete ${p.name}`} className={`inline-flex items-center rounded-lg border border-slate-200 p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50 ${focus}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-blue-950">No supplier products match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search, supplier or category, or add a new one.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={resetFilters} className={`rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Clear filters</button>
                <button onClick={onAdd} className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 ${focus}`}>Add supplier product</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-blue-100 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} supplier products
          </p>
          <div className="flex items-center gap-2">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page" className={`rounded-lg border border-blue-200 p-2 text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}>
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-blue-950">Page {safePage} of {pages}</span>
            <button disabled={safePage === pages} onClick={() => setPage(safePage + 1)} aria-label="Next page" className={`rounded-lg border border-blue-200 p-2 text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}