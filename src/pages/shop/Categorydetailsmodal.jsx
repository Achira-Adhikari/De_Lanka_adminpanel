import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Search, Star, Mail, Phone, MapPin, Users, Layers, Briefcase, Pencil, Trash2,
  Zap, Droplets, Snowflake, Hammer, PaintRoller, Sparkles, Wrench, Leaf, ChevronRight,
} from "lucide-react";

/* =====================================================================
   CategoryDetailsModal: reusable, self-contained.

   <CategoryDetailsModal
     category={category}          // required
     workers={[]}                 // workers who work in this category
     jobsCount={0}                // jobs posted in this category
     initialTab="overview"        // "overview" | "workers"
     onClose={() => {}}
     onEdit={(category) => {}}
     onDelete={(id) => {}}
   />

   category: { id, name, description, status, icon, color, createdAt,
               subs: [{ id, name }] }
   worker:   { id, name, email, phone, city, rating, completedJobs, status,
               subIds: [] }      // subIds = this worker's subcategories INSIDE this category
   ===================================================================== */

/* Shared with the Categories page so both use the same icon and colour sets. */
export const CATEGORY_ICONS = {
  zap: Zap,
  droplets: Droplets,
  snowflake: Snowflake,
  hammer: Hammer,
  paint: PaintRoller,
  sparkles: Sparkles,
  wrench: Wrench,
  leaf: Leaf,
};
export const CATEGORY_COLORS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600", "bg-rose-500"];

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const AVATARS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600"];

const CATEGORY_PILL = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  hidden: { label: "Hidden", cls: "bg-slate-100 text-slate-600 border-slate-300" },
};
const ACCOUNT = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  unverified: { label: "Unverified", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  suspended: { label: "Suspended", cls: "bg-rose-100 text-rose-800 border-rose-300" },
};

const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Pill({ cls, children }) {
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}

function Avatar({ name, size = "h-9 w-9 text-sm" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size} ${AVATARS[name.length % AVATARS.length]}`}>
      {initials}
    </span>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
      <Icon size={26} className="mx-auto text-slate-300" />
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export default function CategoryDetailsModal({ category: c, workers = [], jobsCount = 0, initialTab = "overview", onClose, onEdit, onDelete }) {
  const [tab, setTab] = useState(initialTab);
  const [subFilter, setSubFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const Icon = CATEGORY_ICONS[c.icon] || Wrench;
  const status = CATEGORY_PILL[c.status];

  const countFor = (subId) => workers.filter((w) => w.subIds.includes(subId)).length;
  const avgRating = workers.length ? (workers.reduce((s, w) => s + Number(w.rating), 0) / workers.length).toFixed(1) : "0.0";

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workers
      .filter(
        (w) =>
          (subFilter === "all" || w.subIds.includes(subFilter)) &&
          (!q || [w.name, w.email, w.phone, w.city].some((v) => v.toLowerCase().includes(q)))
      )
      .sort((a, b) => Number(b.rating) - Number(a.rating));
  }, [workers, subFilter, query]);

  const subName = (id) => c.subs.find((s) => s.id === id)?.name;

  const tiles = [
    { label: "Subcategories", value: c.subs.length, icon: Layers, tone: "bg-teal-600" },
    { label: "Workers", value: workers.length, icon: Users, tone: "bg-sky-600" },
    { label: "Jobs posted", value: jobsCount, icon: Briefcase, tone: "bg-emerald-600" },
    { label: "Average rating", value: avgRating, icon: Star, tone: "bg-amber-500" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "workers", label: "Workers", count: workers.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Category details for ${c.name}`}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-teal-700 to-teal-800 px-6 pb-0 pt-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/40">
                <Icon size={28} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{c.name}</h2>
                  <Pill cls={status.cls}>{status.label}</Pill>
                </div>
                <p className="mt-1 text-sm text-teal-100">
                  CAT-{String(c.id).padStart(4, "0")} &nbsp;|&nbsp; {c.subs.length} subcategories &nbsp;|&nbsp; Created {fmtDate(c.createdAt)}
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-teal-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <X size={22} />
            </button>
          </div>

          <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  tab === t.id ? "bg-white text-teal-900" : "text-teal-100 hover:bg-white/10"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === t.id ? "bg-teal-100 text-teal-800" : "bg-white/15 text-white"}`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tiles.map(({ label, value, icon: TileIcon, tone }) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-3">
                    <span className={`mb-2 inline-flex rounded-lg p-2 text-white ${tone}`}><TileIcon size={16} /></span>
                    <p className="truncate text-base font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Description</h3>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {c.description || "No description added."}
                </p>
                {c.status === "hidden" && (
                  <p className="mt-2 text-xs text-amber-700">This category is hidden. Customers cannot pick it when posting a new job.</p>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Subcategories</h3>
                {c.subs.length === 0 ? (
                  <Empty icon={Layers} text="No subcategories yet. Edit the category to add some." />
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {c.subs.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => { setSubFilter(s.id); setTab("workers"); }}
                          className={`flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 ${focus}`}
                        >
                          <span className="flex-1 text-sm font-medium text-slate-900">{s.name}</span>
                          <span className="text-xs text-slate-500">{countFor(s.id)} worker{countFor(s.id) === 1 ? "" : "s"}</span>
                          <ChevronRight size={16} className="text-slate-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {tab === "workers" && (
            <div className="space-y-4">
              <label className="relative block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workers by name, email, phone or city"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </label>

              {/* Subcategory filter */}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by subcategory">
                {[{ id: "all", name: "All", n: workers.length }, ...c.subs.map((s) => ({ ...s, n: countFor(s.id) }))].map((s) => (
                  <button
                    key={s.id}
                    aria-pressed={subFilter === s.id}
                    onClick={() => setSubFilter(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${focus} ${
                      subFilter === s.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-600"
                    }`}
                  >
                    {s.name} <span className={subFilter === s.id ? "text-teal-100" : "text-slate-400"}>{s.n}</span>
                  </button>
                ))}
              </div>

              {shown.length === 0 ? (
                <Empty icon={Users} text={workers.length === 0 ? "No workers have chosen this category yet." : "No workers match this filter."} />
              ) : (
                <ul className="space-y-3">
                  {shown.map((w) => (
                    <li key={w.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={w.name} size="h-10 w-10 text-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{w.name}</p>
                            <Pill cls={ACCOUNT[w.status].cls}>{ACCOUNT[w.status].label}</Pill>
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {w.rating}</span>
                            <span>{w.completedJobs} jobs done</span>
                            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {w.city}</span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {w.subIds.map((id) => (
                            <span key={id} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">{subName(id)}</span>
                          ))}
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1"><Mail size={12} /> {w.email}</span>
                          <span className="inline-flex items-center gap-1"><Phone size={12} /> {w.phone}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          {confirmDelete ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rose-900">
                Delete {c.name}? Its {c.subs.length} subcategories will be removed and {workers.length} worker{workers.length === 1 ? "" : "s"} will lose this category. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
                <button onClick={() => onDelete(c.id)} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 ${focus}`}>Delete category</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setConfirmDelete(true)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 ${focus}`}>
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={() => onEdit(c)} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 ${focus}`}>
                <Pencil size={16} /> Edit category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}