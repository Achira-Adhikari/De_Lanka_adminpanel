import { useEffect, useRef, useState } from "react";
import {
  X, Mail, Phone, MapPin, Ban, CheckCircle2, Trash2, BadgeCheck, BadgeAlert,
  Briefcase, ShoppingBag, Banknote, Clock, Handshake, CalendarDays,
} from "lucide-react";

/* =====================================================================
   CustomerDetailsModal: reusable, self-contained.

   <CustomerDetailsModal
     customer={customer}          // required: the customer record
     jobs={[]}                    // jobs this customer posted
     orders={[]}                  // shop orders this customer placed
     activity={[]}                // [{ id, text, at, type }] newest first
     onClose={() => {}}
     onStatusChange={(id, status) => {}}   // "active" | "suspended"
     onDelete={(id) => {}}
   />

   customer: { id, name, email, phone, address, city, district, status,
     joined, lastActive, emailVerified, phoneVerified, jobs, orders, spent }
   job:   { id, title, category, budget, offers, status, hiredWorker, postedAt }
   order: { id, items, amount, status, placedAt }
   ===================================================================== */

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const AVATARS = ["bg-blue-600", "bg-sky-500", "bg-indigo-600", "bg-emerald-600", "bg-violet-600"];

const ACCOUNT = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-300",
  unverified: "bg-amber-100 text-amber-800 border-amber-300",
  suspended: "bg-rose-100 text-rose-800 border-rose-300",
};
const JOB_PILL = {
  "Receiving offers": "bg-amber-100 text-amber-800 border-amber-300",
  "Worker hired": "bg-blue-100 text-blue-800 border-blue-300",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-300",
};
const ORDER_PILL = {
  Processing: "bg-sky-100 text-sky-800 border-sky-300",
  Shipped: "bg-violet-100 text-violet-800 border-violet-300",
  Delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-300",
};

const lkr = (v) => "LKR " + Number(v).toLocaleString("en-US");
const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (t) =>
  new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
function ago(t) {
  const h = Math.round((Date.now() - t) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function Pill({ cls, children }) {
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}

function Avatar({ name }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-sky-300/50 ${AVATARS[name.length % AVATARS.length]}`}>
      {initials}
    </span>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600"><Icon size={16} /></span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-words text-sm font-medium text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

function Verified({ ok }) {
  return ok ? (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><BadgeCheck size={14} /> Verified</span>
  ) : (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700"><BadgeAlert size={14} /> Not verified</span>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="rounded-lg border border-dashed border-blue-200 px-6 py-10 text-center">
      <Icon size={26} className="mx-auto text-blue-300" />
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

const th = "px-4 py-3 font-medium";
const td = "px-4 py-3";
const thead = "bg-blue-50 text-xs text-blue-900";

export default function CustomerDetailsModal({ customer: c, jobs = [], orders = [], activity = [], onClose, onStatusChange, onDelete }) {
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panel = useRef(null);

  /* Esc to close, lock page scroll, move focus into the dialog */
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

  const hired = jobs.filter((j) => j.status === "Worker hired" || j.status === "Completed").length;
  const avgBudget = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.budget, 0) / jobs.length) : 0;

  const tiles = [
    { label: "Jobs posted", value: c.jobs, icon: Briefcase, tone: "bg-blue-600" },
    { label: "Workers hired", value: hired, icon: Handshake, tone: "bg-emerald-600" },
    { label: "Shop orders", value: c.orders, icon: ShoppingBag, tone: "bg-sky-500" },
    { label: "Total spent", value: lkr(c.spent), icon: Banknote, tone: "bg-amber-500" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: "Jobs", count: jobs.length },
    { id: "orders", label: "Orders", count: orders.length },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#071433]/60" onClick={onClose} />

      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Customer details for ${c.name}`}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Header (same navy → blue gradient as the sidebar / logo) */}
        <div className="bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-6 pb-0 pt-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={c.name} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{c.name}</h2>
                  <Pill cls={ACCOUNT[c.status]}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Pill>
                </div>
                <p className="mt-1 text-sm text-blue-100">
                  CUS-{String(c.id).padStart(4, "0")} &nbsp;|&nbsp; Joined {fmtDate(c.joined)}
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
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
                className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  tab === t.id ? "bg-white text-blue-950" : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === t.id ? "bg-blue-100 text-blue-800" : "bg-white/15 text-white"}`}>{t.count}</span>
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
                {tiles.map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-xl border border-blue-100 p-3">
                    <span className={`mb-2 inline-flex rounded-lg p-2 text-white ${tone}`}><Icon size={16} /></span>
                    <p className="truncate text-base font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-blue-950">Contact</h3>
                  <dl className="space-y-4">
                    <Field icon={Mail} label="Email">{c.email}<Verified ok={c.emailVerified} /></Field>
                    <Field icon={Phone} label="Phone">{c.phone}<Verified ok={c.phoneVerified} /></Field>
                    <Field icon={MapPin} label="Address">{c.address}, {c.city}, {c.district} District</Field>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-blue-950">Account</h3>
                  <dl className="space-y-4">
                    <Field icon={CalendarDays} label="Member since">{fmtDate(c.joined)}</Field>
                    <Field icon={Clock} label="Last active">{ago(c.lastActive)}</Field>
                    <Field icon={Banknote} label="Average job budget">{jobs.length ? lkr(avgBudget) : "No jobs yet"}</Field>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {tab === "jobs" &&
            (jobs.length === 0 ? (
              <Empty icon={Briefcase} text="This customer has not posted a job yet." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-blue-100">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className={thead}>
                    <tr>
                      <th className={th}>Job</th><th className={th}>Budget</th><th className={th}>Offers</th>
                      <th className={th}>Hired worker</th><th className={th}>Status</th><th className={th}>Posted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {jobs.map((j) => (
                      <tr key={j.id}>
                        <td className={td}>
                          <span className="block font-medium text-slate-900">{j.title}</span>
                          <span className="block text-xs text-slate-500">{j.category}</span>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>{lkr(j.budget)}</td>
                        <td className={td}>{j.offers}</td>
                        <td className={`${td} whitespace-nowrap`}>{j.hiredWorker || "Not hired yet"}</td>
                        <td className={td}><Pill cls={JOB_PILL[j.status]}>{j.status}</Pill></td>
                        <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(j.postedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "orders" &&
            (orders.length === 0 ? (
              <Empty icon={ShoppingBag} text="This customer has not bought anything from the shop yet." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-blue-100">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className={thead}>
                    <tr>
                      <th className={th}>Order</th><th className={th}>Items</th><th className={th}>Amount</th>
                      <th className={th}>Status</th><th className={th}>Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className={`${td} font-medium text-slate-900`}>{o.id}</td>
                        <td className={td}>{o.items}</td>
                        <td className={`${td} whitespace-nowrap`}>{lkr(o.amount)}</td>
                        <td className={td}><Pill cls={ORDER_PILL[o.status]}>{o.status}</Pill></td>
                        <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(o.placedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "activity" &&
            (activity.length === 0 ? (
              <Empty icon={Clock} text="No activity recorded for this customer." />
            ) : (
              <ol className="relative space-y-5 border-l-2 border-blue-100 pl-6">
                {activity.map((a) => (
                  <li key={a.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${a.type === "warning" ? "bg-amber-500" : "bg-blue-600"}`} />
                    <p className="text-sm font-medium text-slate-900">{a.text}</p>
                    <p className="text-xs text-slate-500">{fmtDateTime(a.at)}</p>
                  </li>
                ))}
              </ol>
            ))}
        </div>

        {/* Footer actions */}
        <div className="border-t border-blue-100 bg-blue-50/40 px-6 py-4">
          {confirmDelete ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rose-900">Delete {c.name}? Their jobs and orders will be removed too. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
                <button onClick={() => onDelete(c.id)} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 ${focus}`}>Delete customer</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setConfirmDelete(true)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 ${focus}`}>
                <Trash2 size={16} /> Delete
              </button>
              <div className="flex gap-2">
                <a href={`mailto:${c.email}`} className={`flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                  <Mail size={16} /> Email
                </a>
                {c.status === "suspended" ? (
                  <button onClick={() => onStatusChange(c.id, "active")} className={`flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 ${focus}`}>
                    <CheckCircle2 size={16} /> Reactivate account
                  </button>
                ) : (
                  <button onClick={() => onStatusChange(c.id, "suspended")} className={`flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 ${focus}`}>
                    <Ban size={16} /> Suspend account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}