import { useMemo, useState } from "react";
import JobDetailsModal from "../../components/jobs/Jobdetailsmodal";
import {
  Search, Download, Briefcase, Inbox, UserCheck, CheckCircle2, Eye,
  Ban, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Mic,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API (GET /jobs) and wire the actions in
   `setStatusFor` and `remove` to your endpoints.

   Job flow on De Lanka:
   1. Customer posts a job (with photos, videos, a voice message)
   2. Workers send offers        -> status "open"      (Receiving offers)
   3. Customer picks one worker  -> status "hired"     (Worker hired)
   4. Work is finished           -> status "completed"
   A job can also be "cancelled".
   ===================================================================== */
const CUSTOMERS = [
  "Nimal Perera", "Kamal Silva", "Sunil Jayamaha", "Ruwan Pathirana", "Amaya Wickramasinghe",
  "Tharindu Rajapaksha", "Nadeesha Karunaratne", "Chamara Dissanayake", "Isuru Bandara", "Sanduni Herath",
];
const WORKER_NAMES = [
  "Dilshan Gamage", "Kasun Fernando", "Pradeep Kumara", "Hasitha Madushanka", "Dinuka Senanayake",
  "Roshan Liyanage", "Thilina Ekanayake", "Sajith Premadasa",
];
const CITIES = ["Colombo", "Negombo", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];
const CATEGORIES = ["Electrical", "Plumbing", "AC & cooling", "Carpentry", "Painting", "Cleaning"];
const SKILLS = {
  Electrical: ["Wiring", "Fan fitting", "Fault finding"],
  Plumbing: ["Pipe fitting", "Leak repair", "Water tanks"],
  "AC & cooling": ["AC service", "Gas refill", "Installation"],
  Carpentry: ["Cabinets", "Doors", "Furniture repair"],
  Painting: ["Interior", "Exterior", "Wall putty"],
  Cleaning: ["Deep clean", "Post-build clean"],
};
const TITLES = [
  "House wiring repair", "Plumbing line setup", "AC maintenance", "Roof leak repair",
  "Wall painting", "Kitchen cabinet install", "Ceiling fan fitting", "Bathroom tile work",
];
const MESSAGES = [
  "I have done similar work many times. I can start this week and bring my own tools.",
  "Happy to visit first and check the site. The price includes labour only.",
  "Available from tomorrow. I will finish within the days I mentioned.",
];
const STATUS_ORDER = ["open", "hired", "completed", "cancelled"];

const DAY = 86400000;
const SEED = Array.from({ length: 30 }, (_, i) => {
  const status = i % 11 === 6 ? "cancelled" : STATUS_ORDER[i % 3];
  const category = CATEGORIES[i % CATEGORIES.length];
  const customerName = CUSTOMERS[(i * 7) % CUSTOMERS.length];
  const postedAt = Date.now() - (i * 2 + 1) * DAY - i * 3600000;
  const offerCount = status === "open" && i % 5 === 0 ? 0 : 2 + ((i * 3) % 6);

  const offers = Array.from({ length: offerCount }, (_, k) => {
    const name = WORKER_NAMES[(i + k * 3) % WORKER_NAMES.length];
    const wid = ((i + k * 3) % WORKER_NAMES.length) + 1;
    return {
      id: `${i}-o${k}`,
      price: 12000 + (((i + 2) * (k + 3) * 977) % 14) * 2500,
      days: 1 + ((i + k) % 6),
      message: MESSAGES[(i + k) % MESSAGES.length],
      sentAt: postedAt + (k + 1) * 5 * 3600000,
      worker: {
        id: wid,
        name,
        email: name.toLowerCase().replace(" ", ".") + "@example.com",
        phone: `07${[1, 2, 5, 6, 7, 8][wid % 6]} ${String(100 + ((wid * 37) % 900))} ${String(1000 + ((wid * 731) % 9000))}`,
        city: CITIES[(wid * 3) % CITIES.length],
        rating: (4 + (((i + k) * 3) % 10) / 10).toFixed(1),
        completedJobs: 8 + ((wid * 11 + k) % 60),
        verified: (wid + k) % 4 !== 0,
        skills: SKILLS[category],
        joined: Date.now() - (wid * 40 + 60) * DAY,
      },
    };
  });

  const imageCount = i % 7;                 // 0 to 6 photos
  const videoCount = i % 3;                 // 0 to 2 videos
  return {
    id: i + 1,
    title: TITLES[i % TITLES.length],
    category,
    description:
      "The problem started last week and is getting worse.\nPlease check the photos and the voice message for details. Materials can be discussed with the selected worker.",
    budget: 15000 + (((i + 3) * 977) % 12) * 5000,
    city: CITIES[(i * 5) % CITIES.length],
    address: `${10 + ((i * 13) % 90)}, ${["Temple Road", "Lake Drive", "Station Road", "Main Street", "Hill Street"][i % 5]}`,
    status,
    postedAt,
    customer: {
      id: (i * 7) % CUSTOMERS.length + 1,
      name: customerName,
      email: customerName.toLowerCase().replace(/[^a-z ]/g, "").replace(" ", ".") + "@example.com",
      phone: `07${[1, 2, 5, 6, 7, 8][i % 6]} ${String(100 + ((i * 37) % 900))} ${String(1000 + ((i * 731) % 9000))}`,
    },
    /* In production these are real file URLs from your storage (S3, Cloudinary, etc). */
    media: {
      images: Array.from({ length: imageCount }, (_, k) => ({ id: `${i}-img${k}`, url: "" })),
      videos: Array.from({ length: videoCount }, (_, k) => ({ id: `${i}-vid${k}`, url: "", poster: "" })),
      voice: i % 2 === 0 ? { url: "", duration: `0:${String(15 + ((i * 7) % 40)).padStart(2, "0")}` } : null,
    },
    offers,
    hiredOfferId: status === "hired" || status === "completed" ? offers[0]?.id ?? null : null,
  };
});

const STATUS = {
  open: { label: "Receiving offers", cls: "bg-sky-100 text-sky-800 border-sky-300" },
  hired: { label: "Worker hired", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-800 border-rose-300" },
};

const lkr = (v) => "LKR " + v.toLocaleString("en-US");
const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const PAGE_SIZE = 8;
const AVATARS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600"];

/* ---------- small pieces ---------- */
function Avatar({ name, size = "h-9 w-9 text-sm" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size} ${AVATARS[name.length % AVATARS.length]}`}>
      {initials}
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

/* small icons showing what media a job has */
function MediaBadges({ media }) {
  const items = [
    { icon: ImageIcon, n: media.images.length, label: "photos" },
    { icon: Video, n: media.videos.length, label: "videos" },
    { icon: Mic, n: media.voice ? 1 : 0, label: "voice message" },
  ].filter((m) => m.n > 0);
  if (items.length === 0) return <span className="text-slate-400">None</span>;
  return (
    <span className="flex items-center gap-2.5 text-slate-600">
      {items.map(({ icon: Icon, n, label }) => (
        <span key={label} title={`${n} ${label}`} className="inline-flex items-center gap-1 text-xs">
          <Icon size={14} /> {n}
        </span>
      ))}
    </span>
  );
}

/* ---------- page ---------- */
export default function AllJobsPage() {
  const [jobs, setJobs] = useState(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = jobs.filter(
      (j) =>
        (status === "all" || j.status === status) &&
        (category === "all" || j.category === category) &&
        (!q || [j.title, j.customer.name, j.city, j.category].some((v) => v.toLowerCase().includes(q)))
    );
    const by = {
      newest: (a, b) => b.postedAt - a.postedAt,
      budget: (a, b) => b.budget - a.budget,
      offers: (a, b) => b.offers.length - a.offers.length,
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return [...list].sort(by[sort]);
  }, [jobs, query, status, category, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const open = jobs.find((j) => j.id === openId);

  const count = (s) => jobs.filter((j) => j.status === s).length;
  const stats = [
    { label: "Total jobs", value: jobs.length, icon: Briefcase, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Receiving offers", value: count("open"), icon: Inbox, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Worker hired", value: count("hired"), icon: UserCheck, tone: "bg-amber-500", edge: "border-t-amber-500" },
    { label: "Completed", value: count("completed"), icon: CheckCircle2, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
  ];

  const setStatusFor = (ids, s) => {
    setJobs((js) => js.map((j) => (ids.includes(j.id) ? { ...j, status: s } : j)));
    setSelected([]);
  };
  const remove = (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    setJobs((js) => js.filter((j) => !list.includes(j.id)));
    setOpenId(null);
    setSelected((s) => s.filter((x) => !list.includes(x)));
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const resetFilters = () => { setQuery(""); setStatus("all"); setCategory("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All jobs</h1>
          <p className="text-sm text-slate-500">Track jobs posted by customers, the offers from workers and who got hired</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${focus}`}>
            <Download size={16} /> Export
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
                placeholder="Search by job, customer, city or category"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
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
              aria-label="Sort jobs"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
            >
              <option value="newest">Newest first</option>
              <option value="budget">Highest budget</option>
              <option value="offers">Most offers</option>
              <option value="title">Title A to Z</option>
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
            <button onClick={() => setStatusFor(selected, "cancelled")} className={`flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-medium text-amber-800 shadow-sm hover:bg-amber-50 ${focus}`}>
              <Ban size={14} /> Cancel
            </button>
            <button onClick={() => remove(selected)} className={`flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-medium text-rose-700 shadow-sm hover:bg-rose-50 ${focus}`}>
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
                <th className={th}>Job</th>
                <th className={th}>Customer</th>
                <th className={th}>City</th>
                <th className={th}>Budget</th>
                <th className={th}>Media</th>
                <th className={th}>Offers</th>
                <th className={th}>Hired worker</th>
                <th className={th}>Status</th>
                <th className={th}>Posted</th>
                <th className={`${th} text-right`}>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((j) => {
                const hired = j.offers.find((o) => o.id === j.hiredOfferId);
                return (
                  <tr key={j.id} className={`cursor-pointer transition-colors hover:bg-slate-50 ${selected.includes(j.id) ? "bg-teal-50/60" : ""}`} onClick={() => setOpenId(j.id)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`Select ${j.title}`} checked={selected.includes(j.id)} onChange={() => toggle(j.id)} />
                    </td>
                    <td className={td}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenId(j.id); }}
                        className={`block truncate rounded text-left font-semibold text-slate-900 hover:text-teal-700 ${focus}`}
                      >
                        {j.title}
                      </button>
                      <span className="block text-xs text-slate-500">{j.category}</span>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={j.customer.name} size="h-8 w-8 text-xs" />
                        <span className="whitespace-nowrap">{j.customer.name}</span>
                      </div>
                    </td>
                    <td className={td}>{j.city}</td>
                    <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(j.budget)}</td>
                    <td className={td}><MediaBadges media={j.media} /></td>
                    <td className={td}>{j.offers.length}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {hired ? hired.worker.name : <span className="text-slate-400">Not hired yet</span>}
                    </td>
                    <td className={td}><StatusPill status={j.status} /></td>
                    <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(j.postedAt)}</td>
                    <td className={`${td} text-right`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenId(j.id); }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800 ${focus}`}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-900">No jobs match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search, category or status.</p>
              <button onClick={resetFilters} className={`mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
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

      {open && (
        <JobDetailsModal
          job={open}
          onClose={() => setOpenId(null)}
          onCancel={(id) => setStatusFor([id], "cancelled")}
          onDelete={remove}
        />
      )}
    </div>
  );
}