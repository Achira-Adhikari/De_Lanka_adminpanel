import { useMemo, useState } from "react";
import WorkerDetailsModal from "../../components/user/Workerdetailsmodal";
import AddWorkerModal from "../../components/user/Addworkermodal";
import {
  Search, Plus, Download, HardHat, BadgeCheck, ShieldQuestion, ShieldAlert, Eye,
  Ban, CheckCircle2, ChevronLeft, ChevronRight, Star,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace SEED with your API (GET /workers) and wire
   `setStatusFor`, `reviewDocument` and `addWorker` to your endpoints.
   ===================================================================== */
const DAY = 86400000;
const NAMES = [
  "Dilshan Gamage", "Kasun Fernando", "Ruwan Pathirana", "Sunil Jayamaha", "Chaminda Rathnayake", "Nuwan Jayawardena",
  "Prasanna Wijesekara", "Lahiru Gunasekara", "Saman Kumara", "Bimal Ranasinghe", "Janaka Amarasinghe", "Mahesh Peiris",
  "Thushara Wickrama", "Gihan Alwis", "Ashan Dias", "Ranil Karunathilaka", "Supun Madushan", "Udara Welikala",
  "Kalana Jayatissa", "Harsha Gunawardena", "Rohan Abeysekara", "Duminda Silva", "Pubudu Hettiarachchi", "Tharaka Nanayakkara",
];
const TRADES = ["Electrician", "Plumber", "AC technician", "Carpenter", "Painter", "Mason", "Cleaner"];
const SKILLS = {
  Electrician: ["House wiring", "Fuse box repair", "Lighting install", "CCTV setup"],
  Plumber: ["Pipe fitting", "Leak repair", "Water tank install", "Bathroom fittings"],
  "AC technician": ["AC servicing", "Gas refill", "Split AC install", "Duct cleaning"],
  Carpenter: ["Cabinet making", "Door fitting", "Roof trusses", "Furniture repair"],
  Painter: ["Interior painting", "Exterior painting", "Wall putty", "Waterproofing"],
  Mason: ["Brickwork", "Plastering", "Tiling", "Concrete work"],
  Cleaner: ["Deep cleaning", "Post-construction cleanup", "Sofa cleaning", "Window cleaning"],
};
const CITIES = ["Colombo", "Negombo", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];
const DISTRICTS = ["Colombo", "Gampaha", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];
const JOB_TITLES = ["House wiring repair", "Plumbing line setup", "AC maintenance", "Roof leak repair", "Wall painting", "Kitchen cabinet install"];
const CUSTOMERS = ["Nimal Perera", "Kamal Silva", "Amaya Wickramasinghe", "Tharindu Rajapaksha", "Nadeesha Karunaratne", "Chamara Dissanayake"];
const COMMENTS = [
  "Arrived on time and finished the work neatly.",
  "Fair price and very professional. I would hire again.",
  "Good quality work, explained everything clearly.",
  "Took a little longer than planned but the result is great.",
  "Polite, careful and left the place clean.",
];

const SEED = NAMES.map((name, i) => {
  const trade = TRADES[i % TRADES.length];
  const status = i % 6 === 2 ? "pending" : i === 5 ? "suspended" : i === 13 ? "rejected" : i === 21 ? "suspended" : "active";
  const fresh = status === "pending" || status === "rejected";
  const completed = fresh ? 0 : 4 + ((i * 5) % 14);
  const ongoing = fresh || status === "suspended" ? 0 : (i * 3) % 4;
  const offersSent = fresh ? 0 : completed + ongoing + 3 + ((i * 7) % 15);
  const docStatus = (k) =>
    status === "pending" ? (k === 0 ? "approved" : "pending") : status === "rejected" ? (k === 2 ? "rejected" : "approved") : "approved";
  return {
    id: i + 1,
    name,
    email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(" ", ".") + "@example.com",
    phone: `07${[1, 2, 5, 6, 7, 8][i % 6]} ${String(100 + ((i * 41) % 900))} ${String(1000 + ((i * 577) % 9000))}`,
    city: CITIES[i % CITIES.length],
    district: DISTRICTS[i % CITIES.length],
    address: `${5 + ((i * 17) % 80)}, ${["Temple Road", "Lake Drive", "Station Road", "Main Street", "Hill Street"][i % 5]}`,
    trade,
    skills: SKILLS[trade],
    experience: 2 + ((i * 3) % 16),
    dailyRate: 6000 + ((i * 7) % 9) * 1000,
    bio: `${trade} based in ${CITIES[i % CITIES.length]} with hands-on experience in homes and small businesses. Works with clear quotes, keeps customers updated and cleans up after the job.`,
    available: i % 4 !== 1,
    rating: fresh ? 0 : 4.2 + ((i * 3) % 8) / 10,
    completed,
    ongoing,
    offersSent,
    offersAccepted: completed + ongoing,
    earned: completed * (18000 + ((i * 1300) % 12000)),
    status,
    joined: Date.now() - (i * 12 + 4) * DAY,
    lastActive: Date.now() - (((i * 5) % 60) + 1) * 3600000,
    documents: [
      { id: "nic", type: "National ID", fileName: `nic-${i + 1}.pdf`, status: docStatus(0) },
      { id: "cert", type: "Trade certificate (NVQ)", fileName: `certificate-${i + 1}.pdf`, status: docStatus(1) },
      { id: "police", type: "Police clearance report", fileName: `police-report-${i + 1}.pdf`, status: docStatus(2) },
    ],
  };
});

/* DEMO: jobs and reviews for one worker. Replace with API calls
   (e.g. GET /workers/:id/jobs?status=ongoing) when you connect a backend. */
function buildDetails(w) {
  const ongoingJobs = Array.from({ length: w.ongoing }, (_, i) => {
    const start = Date.now() - ((w.id + i * 3) % 9 + 1) * DAY;
    return {
      id: `${w.id}-o${i}`,
      title: JOB_TITLES[(w.id + i) % JOB_TITLES.length],
      customer: CUSTOMERS[(w.id + i) % CUSTOMERS.length],
      category: w.trade,
      price: 12000 + (((w.id + 2) * (i + 3) * 997) % 14) * 3000,
      startedAt: start,
      dueAt: start + (((w.id + i) % 9) - 1) * DAY + 3 * DAY,
      progress: 15 + ((w.id * 17 + i * 29) % 75),
    };
  });
  const completedJobs = Array.from({ length: w.completed }, (_, i) => ({
    id: `${w.id}-c${i}`,
    title: JOB_TITLES[(w.id + i + 2) % JOB_TITLES.length],
    customer: CUSTOMERS[(w.id + i + 1) % CUSTOMERS.length],
    category: w.trade,
    price: 9000 + (((w.id + 5) * (i + 2) * 1103) % 15) * 2500,
    completedAt: Date.now() - (i * 9 + 5) * DAY,
    rating: (w.id + i) % 7 === 0 ? 0 : 4 + ((w.id + i) % 3 === 0 ? 0 : 1),
  }));
  const reviews = completedJobs
    .filter((j) => j.rating)
    .slice(0, 6)
    .map((j, i) => ({ id: j.id, customer: j.customer, rating: j.rating, comment: COMMENTS[(w.id + i) % COMMENTS.length], at: j.completedAt }));
  return { ongoingJobs, completedJobs, reviews };
}

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  suspended: { label: "Suspended", cls: "bg-rose-100 text-rose-800 border-rose-300" },
  rejected: { label: "Rejected", cls: "bg-slate-100 text-slate-700 border-slate-300" },
};
const AVATARS = ["bg-teal-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600", "bg-violet-600"];
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const lkr = (v) => "LKR " + Math.round(v).toLocaleString("en-US");
const PAGE_SIZE = 8;

function Avatar({ name }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATARS[name.length % AVATARS.length]}`}>
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

/* ---------- page ---------- */
export default function WorkersPage() {
  const [workers, setWorkers] = useState(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [trade, setTrade] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = workers.filter(
      (w) =>
        (status === "all" || w.status === status) &&
        (trade === "all" || w.trade === trade) &&
        (!q || [w.name, w.email, w.phone, w.city, w.trade].some((v) => v.toLowerCase().includes(q)))
    );
    const by = {
      newest: (a, b) => b.joined - a.joined,
      rating: (a, b) => b.rating - a.rating,
      jobs: (a, b) => b.completed - a.completed,
      earned: (a, b) => b.earned - a.earned,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort]);
  }, [workers, query, status, trade, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const open = workers.find((w) => w.id === openId);
  const count = (s) => workers.filter((w) => w.status === s).length;

  const stats = [
    { label: "Total workers", value: workers.length, icon: HardHat, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Active", value: count("active"), icon: BadgeCheck, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "Pending review", value: count("pending"), icon: ShieldQuestion, tone: "bg-amber-500", edge: "border-t-amber-500" },
    { label: "Suspended", value: count("suspended"), icon: ShieldAlert, tone: "bg-rose-500", edge: "border-t-rose-500" },
  ];

  const setStatusFor = (ids, s) => {
    setWorkers((ws) => ws.map((w) => (ids.includes(w.id) ? { ...w, status: s } : w)));
    setSelected([]);
  };
  const reviewDocument = (id, docId, s) =>
    setWorkers((ws) => ws.map((w) => (w.id === id ? { ...w, documents: w.documents.map((d) => (d.id === docId ? { ...d, status: s } : d)) } : w)));
  const addWorker = (f) => {
    const approved = f.status === "active";
    const doc = (id, type) => ({ id, type, fileName: approved ? "Added by admin" : "Not uploaded", status: approved ? "approved" : "pending" });
    setWorkers((ws) => [
      {
        ...f,
        id: Date.now(),
        rating: 0, completed: 0, ongoing: 0, offersSent: 0, offersAccepted: 0, earned: 0,
        joined: Date.now(), lastActive: Date.now(),
        documents: [doc("nic", "National ID"), doc("cert", "Trade certificate (NVQ)"), doc("police", "Police clearance report")],
      },
      ...ws,
    ]);
    setAdding(false);
    setStatus("all");
    setTrade("all");
    setQuery("");
    setSort("newest");
    setPage(1);
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const resetFilters = () => { setQuery(""); setStatus("all"); setTrade("all"); setPage(1); };

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";
  const select = `rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workers</h1>
          <p className="text-sm text-slate-500">Verify tradespeople, track their jobs and manage their accounts</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${focus}`}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => setAdding(true)} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:ring-offset-2 ${focus}`}>
            <Plus size={16} /> Add worker
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

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search by name, email, phone, city or trade"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
            <select aria-label="Filter by trade" value={trade} onChange={(e) => { setTrade(e.target.value); setPage(1); }} className={select}>
              <option value="all">All trades</option>
              {TRADES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select aria-label="Sort workers" value={sort} onChange={(e) => setSort(e.target.value)} className={select}>
              <option value="newest">Newest first</option>
              <option value="rating">Highest rating</option>
              <option value="jobs">Most jobs done</option>
              <option value="earned">Highest earnings</option>
              <option value="name">Name A to Z</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit" role="group" aria-label="Filter by status">
            {[["all", "All"], ["active", "Active"], ["pending", "Pending review"], ["suspended", "Suspended"], ["rejected", "Rejected"]].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={status === v}
                onClick={() => { setStatus(v); setPage(1); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${focus} ${status === v ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {l}
                {v === "pending" && count("pending") > 0 && (
                  <span className="ml-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-amber-950">{count("pending")}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-teal-200 bg-teal-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-teal-900">{selected.length} selected</span>
            <button onClick={() => setStatusFor(selected, "suspended")} className={`flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-medium text-amber-800 shadow-sm hover:bg-amber-50 ${focus}`}>
              <Ban size={14} /> Suspend
            </button>
            <button onClick={() => setStatusFor(selected, "active")} className={`flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-medium text-teal-800 shadow-sm hover:bg-teal-100 ${focus}`}>
              <CheckCircle2 size={14} /> Activate
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
                <th className={th}>Worker</th>
                <th className={th}>Trade</th>
                <th className={th}>Rating</th>
                <th className={th}>Ongoing</th>
                <th className={th}>Completed</th>
                <th className={th}>Earned</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((w) => (
                <tr key={w.id} onClick={() => setOpenId(w.id)} className={`cursor-pointer transition-colors hover:bg-slate-50 ${selected.includes(w.id) ? "bg-teal-50/60" : ""}`}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select ${w.name}`} checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} />
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">{w.name}</span>
                        <span className="block truncate text-xs text-slate-500">{w.city}</span>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{w.trade}</td>
                  <td className={td}>
                    {w.rating ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-900"><Star size={14} className="fill-amber-400 text-amber-400" /> {w.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-slate-400">No ratings</span>
                    )}
                  </td>
                  <td className={td}>
                    {w.ongoing > 0 ? <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">{w.ongoing}</span> : <span className="text-slate-400">0</span>}
                  </td>
                  <td className={td}>{w.completed}</td>
                  <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(w.earned)}</td>
                  <td className={td}><StatusPill status={w.status} /></td>
                  <td className={`${td} text-right`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenId(w.id); }}
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
              <p className="font-semibold text-slate-900">No workers match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search, trade or status.</p>
              <button onClick={resetFilters} className={`mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} workers</p>
          <div className="flex items-center gap-2">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page" className={`rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium text-slate-700">Page {safePage} of {pages}</span>
            <button disabled={safePage === pages} onClick={() => setPage(safePage + 1)} aria-label="Next page" className={`rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {open && (
        <WorkerDetailsModal
          key={open.id}
          worker={open}
          {...buildDetails(open)}
          onClose={() => setOpenId(null)}
          onStatusChange={(id, s) => setStatusFor([id], s)}
          onDocumentReview={reviewDocument}
        />
      )}
      {adding && (
        <AddWorkerModal
          trades={TRADES}
          skillsByTrade={SKILLS}
          existingEmails={workers.map((w) => w.email)}
          onClose={() => setAdding(false)}
          onAdd={addWorker}
        />
      )}
    </div>
  );
}