import { useMemo, useState } from "react";
import CategoryDetailsModal, { CATEGORY_ICONS, CATEGORY_COLORS } from "../shop/Categorydetailsmodal";
import {
  Search, Plus, Layers, Tag, Eye, EyeOff, Users, Pencil, Trash2, X, ChevronLeft, ChevronRight, Wrench,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API and wire the actions in
   `saveCategory` and `removeCategory` to your endpoints:
     GET    /job-categories          (with subcategories)
     POST   /job-categories
     PUT    /job-categories/:id
     DELETE /job-categories/:id
     GET    /job-categories/:id/workers

   Rules used on De Lanka:
   - A category has many subcategories (e.g. Electrical > Wiring)
   - A worker picks one or more categories and, inside each, one or more subcategories
   - "Hidden" categories cannot be picked by customers for new jobs
   ===================================================================== */
const DAY = 86400000;
const CATEGORY_SEED = [
  { id: 1, name: "Electrical", icon: "zap", color: CATEGORY_COLORS[1], status: "active", description: "Wiring, lighting, fans, fault finding and electrical repairs for homes.", subs: ["House wiring", "Fan fitting", "Lighting", "Fault finding", "Solar panels"] },
  { id: 2, name: "Plumbing", icon: "droplets", color: CATEGORY_COLORS[2], status: "active", description: "Pipes, taps, water tanks and leak repairs.", subs: ["Pipe fitting", "Leak repair", "Water tanks", "Bathroom fittings"] },
  { id: 3, name: "AC & cooling", icon: "snowflake", color: CATEGORY_COLORS[0], status: "active", description: "Air conditioner installation, service and gas refill.", subs: ["AC installation", "AC service", "Gas refill"] },
  { id: 4, name: "Carpentry", icon: "hammer", color: CATEGORY_COLORS[4], status: "active", description: "Furniture, cabinets, doors and wood repairs.", subs: ["Cabinets", "Doors & windows", "Furniture repair", "Roof wood work"] },
  { id: 5, name: "Painting", icon: "paint", color: CATEGORY_COLORS[3], status: "active", description: "Interior and exterior painting, wall putty and polishing.", subs: ["Interior painting", "Exterior painting", "Wall putty"] },
  { id: 6, name: "Cleaning", icon: "sparkles", color: CATEGORY_COLORS[5], status: "hidden", description: "Deep cleaning and post-construction cleaning.", subs: ["Deep cleaning", "Post-build cleaning"] },
].map((c, i) => ({
  ...c,
  createdAt: Date.now() - (120 - i * 15) * DAY,
  subs: c.subs.map((name, k) => ({ id: `c${c.id}-s${k}`, name })),
}));

const WORKER_NAMES = [
  "Dilshan Gamage", "Kasun Fernando", "Pradeep Kumara", "Hasitha Madushanka", "Dinuka Senanayake",
  "Roshan Liyanage", "Thilina Ekanayake", "Sajith Premadasa", "Chathura Perera", "Lahiru Jayawardena",
  "Nuwan Abeysekara", "Madushan Silva", "Supun Rathnayake", "Bhanuka Wijesinghe", "Janith Gunasekara",
  "Tharaka Weerakoon", "Asela Ranasinghe", "Charith Fonseka", "Eranga Mendis", "Gihan Kulatunga",
  "Harsha Amarasinghe", "Kavinda Rodrigo", "Malith Cooray", "Oshan Dias",
];
const CITIES = ["Colombo", "Negombo", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];

const WORKER_SEED = WORKER_NAMES.map((name, i) => {
  const skills = {};
  const add = (cat) => {
    const n = cat.subs.length;
    const picks = [cat.subs[i % n].id];
    if (i % 2 === 0) picks.push(cat.subs[(i + 1) % n].id);
    skills[cat.id] = [...new Set(picks)];
  };
  add(CATEGORY_SEED[i % CATEGORY_SEED.length]);
  if (i % 3 === 0) add(CATEGORY_SEED[(i + 2) % CATEGORY_SEED.length]);
  return {
    id: i + 1,
    name,
    email: name.toLowerCase().replace(" ", ".") + "@example.com",
    phone: `07${[1, 2, 5, 6, 7, 8][i % 6]} ${String(100 + ((i * 37) % 900))} ${String(1000 + ((i * 731) % 9000))}`,
    city: CITIES[(i * 3) % CITIES.length],
    rating: (4 + ((i * 3) % 10) / 10).toFixed(1),
    completedJobs: 6 + ((i * 11) % 70),
    status: i % 9 === 4 ? "suspended" : i % 7 === 3 ? "unverified" : "active",
    skills, // { [categoryId]: [subcategoryId, ...] }
  };
});

/* DEMO: jobs posted per category. Replace with a count from your API. */
const JOB_COUNTS = { 1: 42, 2: 31, 3: 18, 4: 12, 5: 27, 6: 5 };

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  hidden: { label: "Hidden", cls: "bg-slate-100 text-slate-600 border-slate-300" },
};

const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 8;
const uid = () => "s" + Math.random().toString(36).slice(2, 8);

/* ---------- small pieces ---------- */
function CategoryIcon({ category, size = "h-10 w-10", iconSize = 20 }) {
  const Icon = CATEGORY_ICONS[category.icon] || Wrench;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg text-white ${size} ${category.color}`}>
      <Icon size={iconSize} />
    </span>
  );
}

function StatusPill({ status }) {
  const s = STATUS[status];
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

/* ---------- add / edit category modal ---------- */
function CategoryFormModal({ initial, existingNames, onClose, onSave }) {
  const editing = Boolean(initial);
  const [f, setF] = useState(
    initial
      ? { ...initial, subs: initial.subs.map((s) => ({ ...s })) }
      : { name: "", description: "", icon: "wrench", color: CATEGORY_COLORS[0], status: "active", subs: [{ id: uid(), name: "" }] }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setSub = (id, name) => setF((p) => ({ ...p, subs: p.subs.map((s) => (s.id === id ? { ...s, name } : s)) }));
  const addSub = () => setF((p) => ({ ...p, subs: [...p.subs, { id: uid(), name: "" }] }));
  const removeSub = (id) => setF((p) => ({ ...p, subs: p.subs.filter((s) => s.id !== id) }));

  const name = f.name.trim();
  const duplicate = existingNames.includes(name.toLowerCase());
  const valid = name && !duplicate;
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

  const submit = () => {
    const seen = new Set();
    const subs = f.subs
      .map((s) => ({ ...s, name: s.name.trim() }))
      .filter((s) => s.name && !seen.has(s.name.toLowerCase()) && seen.add(s.name.toLowerCase()));
    onSave({ ...f, name, description: f.description.trim(), subs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div role="dialog" aria-label={editing ? "Edit category" : "Add category"} className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit category" : "Add category"}</h2>
          <button onClick={onClose} aria-label="Close" className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 ${focus}`}><X size={20} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block text-sm font-medium text-slate-700">Category name
            <input className={`${input} mt-1.5`} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Electrical" />
            {duplicate && <span className="mt-1 block text-xs text-rose-600">A category with this name already exists.</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">Description
            <textarea rows={2} className={`${input} mt-1.5 resize-none`} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What kind of work belongs here?" />
          </label>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Icon</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={f.icon === key}
                  onClick={() => set("icon", key)}
                  className={`rounded-lg border p-2.5 ${focus} ${f.icon === key ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500 hover:border-teal-600"}`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Colour</p>
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c.replace("bg-", "").replace("-", " ")}
                  aria-pressed={f.color === c}
                  onClick={() => set("color", c)}
                  className={`h-8 w-8 rounded-full ${c} ${focus} ${f.color === c ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
                />
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700">Visibility
            <select className={`${input} mt-1.5 bg-white`} value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Active: customers can pick it</option>
              <option value="hidden">Hidden: not shown to customers</option>
            </select>
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Subcategories</p>
              <button type="button" onClick={addSub} className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-teal-700 hover:bg-teal-50 ${focus}`}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {f.subs.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-sm text-slate-500">No subcategories yet.</p>}
              {f.subs.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <input
                    className={input}
                    value={s.name}
                    onChange={(e) => setSub(s.id, e.target.value)}
                    placeholder={`Subcategory ${i + 1}`}
                    aria-label={`Subcategory ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeSub(s.id)} aria-label={`Remove subcategory ${i + 1}`} className={`rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 ${focus}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {editing && <p className="mt-2 text-xs text-slate-500">Removing a subcategory also removes it from the workers who chose it.</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button onClick={onClose} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
          <button
            disabled={!valid}
            onClick={submit}
            className={`rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300 ${focus}`}
          >
            {editing ? "Save changes" : "Add category"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- delete confirmation (used from the table row) ---------- */
function ConfirmDelete({ category, workerCount, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div role="alertdialog" aria-label="Delete category" className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">Delete {category.name}?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Its {category.subs.length} subcategories will be removed and {workerCount} worker{workerCount === 1 ? "" : "s"} will lose this category. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
          <button onClick={onConfirm} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 ${focus}`}>Delete category</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function JobCategoriesPage() {
  const [categories, setCategories] = useState(CATEGORY_SEED);
  const [workers, setWorkers] = useState(WORKER_SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [view, setView] = useState(null);       // { id, tab }
  const [form, setForm] = useState(null);       // null | "new" | category
  const [deleting, setDeleting] = useState(null);

  const workersOf = (catId) => workers.filter((w) => w.skills[catId]);
  const workerCount = (catId) => workersOf(catId).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = categories.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || c.name.toLowerCase().includes(q) || c.subs.some((s) => s.name.toLowerCase().includes(q)))
    );
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      workers: (a, b) => workerCount(b.id) - workerCount(a.id),
      jobs: (a, b) => (JOB_COUNTS[b.id] || 0) - (JOB_COUNTS[a.id] || 0),
      newest: (a, b) => b.createdAt - a.createdAt,
    };
    return [...list].sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, workers, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const viewing = view && categories.find((c) => c.id === view.id);

  const stats = [
    { label: "Categories", value: categories.length, icon: Layers, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Subcategories", value: categories.reduce((s, c) => s + c.subs.length, 0), icon: Tag, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Active", value: categories.filter((c) => c.status === "active").length, icon: Eye, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Hidden", value: categories.filter((c) => c.status === "hidden").length, icon: EyeOff, tone: "bg-amber-500", edge: "border-t-amber-500" },
  ];

  const saveCategory = (data) => {
    if (data.id) {
      const old = categories.find((c) => c.id === data.id);
      const keep = new Set(data.subs.map((s) => s.id));
      const removed = old.subs.filter((s) => !keep.has(s.id)).map((s) => s.id);
      setCategories((cs) => cs.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
      if (removed.length) {
        // a worker who only had the removed subcategories keeps the category with no subcategory
        setWorkers((ws) => ws.map((w) => (w.skills[data.id] ? { ...w, skills: { ...w.skills, [data.id]: w.skills[data.id].filter((id) => !removed.includes(id)) } } : w)));
      }
    } else {
      setCategories((cs) => [{ ...data, id: Date.now(), createdAt: Date.now() }, ...cs]);
      setSort("newest");
      setPage(1);
    }
    setForm(null);
  };

  const removeCategory = (id) => {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setWorkers((ws) => ws.map((w) => { const { [id]: _drop, ...rest } = w.skills; return { ...w, skills: rest }; }));
    setView(null);
    setDeleting(null);
  };

  const resetFilters = () => { setQuery(""); setStatus("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job categories</h1>
          <p className="text-sm text-slate-500">Organise the work types on De Lanka and see which workers offer them</p>
        </div>
        <button onClick={() => setForm("new")} className={`flex items-center gap-2 self-start rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:ring-offset-2 ${focus}`}>
          <Plus size={16} /> Add category
        </button>
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
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by category or subcategory"
              className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </label>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by status">
            {["all", "active", "hidden"].map((s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${focus} ${status === s ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            aria-label="Sort categories"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
          >
            <option value="name">Name A to Z</option>
            <option value="workers">Most workers</option>
            <option value="jobs">Most jobs</option>
            <option value="newest">Newest first</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-teal-50 text-xs text-teal-900">
              <tr>
                <th className={th}>Category</th>
                <th className={th}>Subcategories</th>
                <th className={th}>Workers</th>
                <th className={th}>Jobs</th>
                <th className={th}>Status</th>
                <th className={th}>Created</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => setView({ id: c.id, tab: "overview" })}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={c} />
                      <div className="min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setView({ id: c.id, tab: "overview" }); }}
                          className={`block truncate rounded text-left font-semibold text-slate-900 hover:text-teal-700 ${focus}`}
                        >
                          {c.name}
                        </button>
                        <span className="block max-w-[260px] truncate text-xs text-slate-500">{c.description || "No description"}</span>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      {c.subs.slice(0, 3).map((s) => (
                        <span key={s.id} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">{s.name}</span>
                      ))}
                      {c.subs.length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">+{c.subs.length - 3}</span>}
                      {c.subs.length === 0 && <span className="text-slate-400">None</span>}
                    </div>
                  </td>
                  <td className={td}>{workerCount(c.id)}</td>
                  <td className={td}>{JOB_COUNTS[c.id] || 0}</td>
                  <td className={td}><StatusPill status={c.status} /></td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(c.createdAt)}</td>
                  <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex gap-1.5">
                      <button onClick={() => setView({ id: c.id, tab: "workers" })} className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}>
                        <Users size={14} /> Workers
                      </button>
                      <button onClick={() => setForm(c)} aria-label={`Edit ${c.name}`} className={`rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-teal-600 hover:text-teal-800 ${focus}`}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} className={`rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-rose-400 hover:text-rose-600 ${focus}`}>
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
              <p className="mt-1 text-sm text-slate-500">Try a different search or status.</p>
              <button onClick={resetFilters} className={`mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
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

      {viewing && (
        <CategoryDetailsModal
          key={`${viewing.id}-${view.tab}`}
          category={viewing}
          workers={workersOf(viewing.id).map((w) => ({ ...w, subIds: w.skills[viewing.id] }))}
          jobsCount={JOB_COUNTS[viewing.id] || 0}
          initialTab={view.tab}
          onClose={() => setView(null)}
          onEdit={(c) => { setView(null); setForm(c); }}
          onDelete={removeCategory}
        />
      )}

      {form && (
        <CategoryFormModal
          initial={form === "new" ? null : form}
          existingNames={categories.filter((c) => c.id !== form?.id).map((c) => c.name.toLowerCase())}
          onClose={() => setForm(null)}
          onSave={saveCategory}
        />
      )}

      {deleting && (
        <ConfirmDelete
          category={deleting}
          workerCount={workerCount(deleting.id)}
          onCancel={() => setDeleting(null)}
          onConfirm={() => removeCategory(deleting.id)}
        />
      )}
    </div>
  );
}