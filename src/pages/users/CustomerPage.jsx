import { useMemo, useState } from "react";
import CustomerDetailsModal from "../../components/user/Customerdetailsmodal";
import {
  Search, Plus, Download, Users, UserCheck, UserPlus, ShieldAlert, X, Eye,
  Ban, CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace with your API (GET /customers) and wire the
   actions in `setStatus`, `remove` and `addCustomer` to your endpoints.
   ===================================================================== */
const NAMES = [
  "Nimal Perera", "Kamal Silva", "Sunil Jayamaha", "Ruwan Pathirana", "Dilshan Gamage", "Kasun Fernando",
  "Amaya Wickramasinghe", "Tharindu Rajapaksha", "Nadeesha Karunaratne", "Chamara Dissanayake", "Isuru Bandara",
  "Sanduni Herath", "Pradeep Kumara", "Lakshmi Selvaraj", "Hasitha Madushanka", "Dinuka Senanayake",
  "Menaka Abeywardena", "Roshan Liyanage", "Gayani Jayasinghe", "Thilina Ekanayake", "Anuradha Mendis",
  "Sajith Premadasa", "Yasodha Weerasinghe", "Buddhika Samarasinghe",
];
const DISTRICTS = ["Colombo", "Gampaha", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];
const CITIES = ["Colombo", "Negombo", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Matara"];
const JOBS = ["House wiring repair", "Plumbing line setup", "AC maintenance", "Roof leak repair", "Wall painting", "Kitchen cabinet install"];
const JOB_STATUS = ["Receiving offers", "Worker hired", "Completed"];

const DAY = 86400000;
const SEED = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(" ", ".") + "@example.com",
  phone: `07${[1, 2, 5, 6, 7, 8][i % 6]} ${String(100 + ((i * 37) % 900))} ${String(1000 + ((i * 731) % 9000))}`,
  city: CITIES[i % CITIES.length],
  jobs: (i * 3) % 11,
  orders: (i * 5) % 9,
  spent: ((i * 7919) % 90) * 1500 + 4500,
  status: i % 9 === 4 ? "suspended" : i % 7 === 3 ? "unverified" : "active",
  joined: Date.now() - (i * 9 + 2) * DAY,
  address: `${10 + ((i * 13) % 90)}, ${["Temple Road", "Lake Drive", "Station Road", "Main Street", "Hill Street"][i % 5]}`,
  district: DISTRICTS[i % CITIES.length],
  lastActive: Date.now() - ((i * 7) % 72 + 1) * 3600000,
  emailVerified: i % 7 !== 3,
  phoneVerified: i % 5 !== 2,
}));

/* DEMO: build the jobs / orders / activity for one customer.
   Replace with API calls (e.g. GET /customers/:id/jobs) when you connect a backend. */
const CATEGORIES = ["Electrical", "Plumbing", "AC & cooling", "Carpentry", "Painting", "Cleaning"];
const WORKERS = ["Dilshan Gamage", "Kasun Fernando", "Ruwan Pathirana", "Sunil Jayamaha"];
const PRODUCTS = ["Cordless drill kit", "PVC pipe set", "Safety gloves & helmet", "LED panel light 18W", "Paint roller set"];
const ORDER_STATUS = ["Processing", "Shipped", "Delivered"];

function buildDetails(c) {
  const jobs = Array.from({ length: c.jobs }, (_, i) => {
    const status = ["Receiving offers", "Worker hired", "Completed", "Cancelled"][(c.id + i) % 4];
    return {
      id: `${c.id}-j${i}`,
      title: JOBS[(c.id + i) % JOBS.length],
      category: CATEGORIES[(c.id + i) % CATEGORIES.length],
      budget: 15000 + (((c.id + 3) * (i + 2) * 977) % 12) * 5000,
      offers: 2 + ((i * 3 + c.id) % 7),
      status,
      hiredWorker: status === "Worker hired" || status === "Completed" ? WORKERS[(c.id + i) % WORKERS.length] : null,
      postedAt: Date.now() - (i * 11 + 3) * DAY,
    };
  });
  const orders = Array.from({ length: c.orders }, (_, i) => ({
    id: `ORD-${1000 + c.id * 10 + i}`,
    items: `${PRODUCTS[(c.id + i) % PRODUCTS.length]} x${1 + ((i + c.id) % 3)}`,
    amount: 2500 + (((c.id + 1) * (i + 3) * 1319) % 14) * 1500,
    status: ORDER_STATUS[(c.id + i) % 3],
    placedAt: Date.now() - (i * 8 + 1) * DAY,
  }));
  const activity = [
    ...jobs.map((j) => ({ id: j.id, text: `Posted job: ${j.title}`, at: j.postedAt, type: "info" })),
    ...orders.map((o) => ({ id: o.id, text: `Placed order ${o.id}`, at: o.placedAt, type: "info" })),
    ...(c.status === "suspended" ? [{ id: "susp", text: "Account suspended by an admin", at: c.lastActive, type: "warning" }] : []),
    { id: "joined", text: "Created an account", at: c.joined, type: "info" },
  ].sort((a, b) => b.at - a.at);
  return { jobs, orders, activity };
}

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  unverified: { label: "Unverified", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  suspended: { label: "Suspended", cls: "bg-rose-100 text-rose-800 border-rose-300" },
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

/* ---------- add customer modal ---------- */
function AddModal({ onClose, onAdd }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", city: CITIES[0] });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.name.trim() && /\S+@\S+\.\S+/.test(f.email);
  const input = `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div role="dialog" aria-label="Add customer" className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Add customer</h2>
          <button onClick={onClose} aria-label="Close" className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 ${focus}`}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Full name
            <input className={`${input} mt-1.5`} value={f.name} onChange={set("name")} placeholder="Nimal Perera" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Email
            <input type="email" className={`${input} mt-1.5`} value={f.email} onChange={set("email")} placeholder="nimal@example.com" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-700">Phone
              <input className={`${input} mt-1.5`} value={f.phone} onChange={set("phone")} placeholder="077 123 4567" />
            </label>
            <label className="block text-sm font-medium text-slate-700">City
              <select className={`${input} mt-1.5 bg-white`} value={f.city} onChange={set("city")}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onAdd(f)}
            className={`rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300 ${focus}`}
          >
            Add customer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function CustomersPage() {
  const [customers, setCustomers] = useState(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = customers.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || [c.name, c.email, c.phone, c.city].some((v) => v.toLowerCase().includes(q)))
    );
    const by = { newest: (a, b) => b.joined - a.joined, spent: (a, b) => b.spent - a.spent, jobs: (a, b) => b.jobs - a.jobs, name: (a, b) => a.name.localeCompare(b.name) };
    return [...list].sort(by[sort]);
  }, [customers, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const open = customers.find((c) => c.id === openId);

  const count = (s) => customers.filter((c) => c.status === s).length;
  const month = Date.now() - 30 * DAY;
  const stats = [
    { label: "Total customers", value: customers.length, icon: Users, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "Active", value: count("active"), icon: UserCheck, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
    { label: "New this month", value: customers.filter((c) => c.joined > month).length, icon: UserPlus, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Suspended", value: count("suspended"), icon: ShieldAlert, tone: "bg-amber-500", edge: "border-t-amber-500" },
  ];

  const setStatusFor = (ids, s) => {
    setCustomers((cs) => cs.map((c) => (ids.includes(c.id) ? { ...c, status: s } : c)));
    setSelected([]);
  };
  const remove = (id) => {
    setCustomers((cs) => cs.filter((c) => c.id !== id));
    setOpenId(null);
    setSelected((s) => s.filter((x) => x !== id));
  };
  const addCustomer = (f) => {
    setCustomers((cs) => [{ id: Date.now(), ...f, address: "Not provided", district: f.city, jobs: 0, orders: 0, spent: 0, status: "unverified", joined: Date.now(), lastActive: Date.now(), emailVerified: false, phoneVerified: false }, ...cs]);
    setAdding(false);
    setSort("newest");
    setPage(1);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Manage the people who post jobs and shop on De Lanka</p>
        </div>
        {/* <div className="flex gap-3">
          <button className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${focus}`}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => setAdding(true)} className={`flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:ring-offset-2 ${focus}`}>
            <Plus size={16} /> Add customer
          </button>
        </div> */}
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
              placeholder="Search by name, email, phone or city"
              className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </label>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter by status">
            {["all", "active", "unverified", "suspended"].map((s) => (
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
            aria-label="Sort customers"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${focus}`}
          >
            <option value="newest">Newest first</option>
            <option value="spent">Highest spend</option>
            <option value="jobs">Most jobs</option>
            <option value="name">Name A to Z</option>
          </select>
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
                <th className={th}>Customer</th>
                <th className={th}>City</th>
                <th className={th}>Jobs</th>
                <th className={th}>Orders</th>
                <th className={th}>Total spent</th>
                <th className={th}>Status</th>
                <th className={th}>Joined</th>
                <th className={`${th} text-right`}>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className={`cursor-pointer transition-colors hover:bg-slate-50 ${selected.includes(c.id) ? "bg-teal-50/60" : ""}`} onClick={() => setOpenId(c.id)}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select ${c.name}`} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}
                          className={`block truncate rounded text-left font-semibold text-slate-900 hover:text-teal-700 ${focus}`}
                        >
                          {c.name}
                        </button>
                        <span className="block truncate text-xs text-slate-500">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{c.city}</td>
                  <td className={td}>{c.jobs}</td>
                  <td className={td}>{c.orders}</td>
                  <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{lkr(c.spent)}</td>
                  <td className={td}><StatusPill status={c.status} /></td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(c.joined)}</td>
                  <td className={`${td} text-right`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}
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
              <p className="font-semibold text-slate-900">No customers match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or status.</p>
              <button onClick={resetFilters} className={`mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Clear filters</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <p>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} customers
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
        <CustomerDetailsModal
          customer={open}
          {...buildDetails(open)}
          onClose={() => setOpenId(null)}
          onStatusChange={(id, st) => setStatusFor([id], st)}
          onDelete={remove}
        />
      )}
      {adding && <AddModal onClose={() => setAdding(false)} onAdd={addCustomer} />}
    </div>
  );
}