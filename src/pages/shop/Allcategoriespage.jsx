import { useMemo, useState } from "react";
import CategoryFormModal from "../../components/shop/Categoryformmodal";
import DeleteCategoryModal from "../../components/shop/Deletecategorymodal";
import {
  Search, Plus, Download, Layers, ListTree, CheckCircle2, EyeOff,
  Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API (GET /categories) and wire the actions
   in `saveCategory` (POST / PUT) and `removeCategories` (DELETE) to your
   endpoints.

   Each category has:
   - subCategories : array of names (can be empty, some categories have none)
   - productCount  : how many products use it (from your products table)
   - status        : "active" or "hidden" (hidden = not shown to customers)

   A category that still has products cannot be deleted. Your backend
   should enforce this too.
   ===================================================================== */
const SEED = [
  { name: "Electrical", description: "Wiring, fans, lights and fittings", subCategories: ["Wiring", "Fans", "Lighting"], productCount: 14 },
  { name: "Plumbing", description: "Pipes, tanks and bathroom fittings", subCategories: ["Pipes", "Tanks & floats"], productCount: 9 },
  { name: "AC & cooling", description: "AC gas, parts and installation items", subCategories: ["Gas & refills", "Installation parts"], productCount: 6 },
  { name: "Carpentry", description: "Hinges, glue, wood and tools", subCategories: [], productCount: 11 },
  { name: "Painting", description: "Paint, putty and brushes", subCategories: ["Interior paint", "Wall putty"], productCount: 8 },
  { name: "Cleaning", description: "Cleaning liquids and cloths", subCategories: [], productCount: 5 },
  { name: "Roofing", description: "Sheets, sealants and gutters", subCategories: ["Sheets", "Sealants"], productCount: 0 },
  { name: "Tiling", description: "Tiles, adhesive and grout", subCategories: ["Tiles", "Adhesive & grout", "Tools"], productCount: 0 },
].map((c, i) => ({
  ...c,
  id: i + 1,
  status: i === 7 ? "hidden" : "active",
  createdAt: Date.now() - (i * 9 + 4) * 86400000,
}));

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  hidden: { label: "Hidden", cls: "bg-slate-100 text-slate-700 border-slate-300" },
};
const STATUS_ORDER = ["active", "hidden"];

const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 8;
const AVATARS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600"];
const MAX_CHIPS = 3;

/* ---------- small pieces ---------- */
function Avatar({ name, size = "h-9 w-9 text-sm" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${size} ${AVATARS[name.length % AVATARS.length]}`}>
      {name[0].toUpperCase()}
    </span>
  );
}

function StatusPill({ status }) {
  const s = STATUS[status];
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function Checkbox(props) {
  return <input type="checkbox" className={`h-4 w-4 rounded border-slate-300 text-teal-700 ${focus}`} {...props} />;
}

function SubChips({ items }) {
  if (items.length === 0) return <span className="text-slate-400">None</span>;
  const shown = items.slice(0, MAX_CHIPS);
  const more = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5" title={items.join(", ")}>
      {shown.map((s) => (
        <span key={s} className="whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs text-teal-900">{s}</span>
      ))}
      {more > 0 && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">+{more} more</span>}
    </div>
  );
}

/* ---------- page ---------- */
export default function AllCategoriesPage() {
  const [categories, setCategories] = useState(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  /* modal state: formFor = "new" | category object | null,  deleteIds = array of ids */
  const [formFor, setFormFor] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = categories.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || [c.name, c.description, ...c.subCategories].some((v) => v.toLowerCase().includes(q)))
    );
    const by = {
      newest: (a, b) => b.createdAt - a.createdAt,
      name: (a, b) => a.name.localeCompare(b.name),
      products: (a, b) => b.productCount - a.productCount,
      subs: (a, b) => b.subCategories.length - a.subCategories.length,
    };
    return [...list].sort(by[sort]);
  }, [categories, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const stats = [
    { label: "Total categories", value: categories.length, icon: Layers, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Sub categories", value: categories.reduce((n, c) => n + c.subCategories.length, 0), icon: ListTree, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Active", value: categories.filter((c) => c.status === "active").length, icon: CheckCircle2, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Hidden", value: categories.filter((c) => c.status === "hidden").length, icon: EyeOff, tone: "bg-amber-500", edge: "border-t-amber-500" },
  ];

  /* ----- actions (connect these to your API) ----- */
  const saveCategory = (data) => {
    if (formFor && formFor !== "new") {
      // UPDATE  -> PUT /categories/:id
      // Note: if a sub category was removed or renamed, update the products that used it.
      setCategories((cs) => cs.map((c) => (c.id === formFor.id ? { ...c, ...data } : c)));
    } else {
      // ADD     -> POST /categories
      setCategories((cs) => [
        { ...data, id: Math.max(0, ...cs.map((c) => c.id)) + 1, productCount: 0, createdAt: Date.now() },
        ...cs,
      ]);
      setSort("newest");
      setPage(1);
    }
    setFormFor(null);
  };

  const removeCategories = () => {
    // DELETE -> DELETE /categories/:id  (once per id, or one bulk call)
    setCategories((cs) => cs.filter((c) => !deleteIds.includes(c.id)));
    setSelected((s) => s.filter((id) => !deleteIds.includes(id)));
    setDeleteIds([]);
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const resetFilters = () => { setQuery(""); setStatus("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Organise your products into categories and sub categories</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${focus}`}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => setFormFor("new")} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>
            <Plus size={16} /> Add category
          </button>
        </div>
      </div>

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
                placeholder="Search by category or sub category"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
            <select
              aria-label="Sort categories"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
            >
              <option value="newest">Newest first</option>
              <option value="name">Name A to Z</option>
              <option value="products">Most products</option>
              <option value="subs">Most sub categories</option>
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

        {/* Bulk bar */}
        {selected.length > 0 && (
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
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onChange={() => setSelected(allOnPage ? selected.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selected, ...rows.map((r) => r.id)])])}
                  />
                </th>
                <th className={th}>Category</th>
                <th className={th}>Sub categories</th>
                <th className={th}>Products</th>
                <th className={th}>Status</th>
                <th className={th}>Created</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className={`transition-colors hover:bg-slate-50 ${selected.includes(c.id) ? "bg-teal-50/60" : ""}`}>
                  <td className={td}>
                    <Checkbox aria-label={`Select ${c.name}`} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <span className="block font-semibold text-slate-900">{c.name}</span>
                        {c.description && <span className="block max-w-xs truncate text-xs text-slate-500">{c.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td className={td}><SubChips items={c.subCategories} /></td>
                  <td className={td}>{c.productCount}</td>
                  <td className={td}><StatusPill status={c.status} /></td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(c.createdAt)}</td>
                  <td className={`${td} text-right`}>
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setFormFor(c)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteIds([c.id])}
                        aria-label={`Delete ${c.name}`}
                        className={`inline-flex items-center rounded-lg border border-slate-200 p-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-50 ${focus}`}
                      >
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
              <p className="font-semibold text-slate-900">No categories match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or status, or add a new category.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={resetFilters} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
                <button onClick={() => setFormFor("new")} className={`rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 ${focus}`}>Add category</button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} categories
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

      {formFor && (
        <CategoryFormModal
          category={formFor === "new" ? null : formFor}
          existingNames={categories.filter((c) => formFor === "new" || c.id !== formFor.id).map((c) => c.name)}
          onClose={() => setFormFor(null)}
          onSave={saveCategory}
        />
      )}

      {deleteIds.length > 0 && (
        <DeleteCategoryModal
          categories={categories.filter((c) => deleteIds.includes(c.id))}
          onClose={() => setDeleteIds([])}
          onConfirm={removeCategories}
        />
      )}
    </div>
  );
}