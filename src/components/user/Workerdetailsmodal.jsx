import { useEffect, useRef, useState } from "react";
import {
  X, Mail, Phone, MapPin, Ban, CheckCircle2, XCircle, BadgeCheck, Star,
  Hammer, Banknote, Clock, Wrench, FileText, MessageSquare, Briefcase,
  RotateCcw, Timer,
} from "lucide-react";

/* =====================================================================
   WorkerDetailsModal: reusable, self-contained.

   <WorkerDetailsModal
     worker={worker}
     ongoingJobs={[]}          // jobs the worker is doing right now
     completedJobs={[]}        // jobs the worker has finished
     reviews={[]}              // customer reviews
     onClose={() => {}}
     onStatusChange={(id, status) => {}}          // active | suspended | pending | rejected
     onDocumentReview={(id, docId, status) => {}} // approved | rejected | pending
   />

   worker: { id, name, email, phone, address, city, district, trade, skills[],
     experience, dailyRate, bio, available, rating, offersSent, offersAccepted,
     earned, status, joined, lastActive, documents[] }
   document:  { id, type, fileName, status }
   ongoing:   { id, title, customer, category, price, startedAt, dueAt, progress }
   completed: { id, title, customer, category, price, completedAt, rating }
   review:    { id, customer, rating, comment, at }
   ===================================================================== */

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const AVATARS = ["bg-blue-600", "bg-sky-500", "bg-indigo-600", "bg-emerald-600", "bg-violet-600"];
const DAY = 86400000;

const ACCOUNT = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  suspended: { label: "Suspended", cls: "bg-rose-100 text-rose-800 border-rose-300" },
  rejected: { label: "Rejected", cls: "bg-slate-100 text-slate-700 border-slate-300" },
};
const DOC = {
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  pending: { label: "Needs review", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-800 border-rose-300" },
};

const lkr = (v) => "LKR " + Number(v).toLocaleString("en-US");
const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ))}
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

export default function WorkerDetailsModal({
  worker: w, ongoingJobs = [], completedJobs = [], reviews = [], onClose, onStatusChange, onDocumentReview,
}) {
  const [tab, setTab] = useState("overview");
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

  const initials = w.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const acceptance = w.offersSent ? Math.round((w.offersAccepted / w.offersSent) * 100) : 0;
  const docsApproved = w.documents.length > 0 && w.documents.every((d) => d.status === "approved");
  const pendingDocs = w.documents.filter((d) => d.status === "pending").length;
  const status = ACCOUNT[w.status];

  const tiles = [
    { label: "Jobs completed", value: completedJobs.length, icon: CheckCircle2, tone: "bg-emerald-600" },
    { label: "Ongoing jobs", value: ongoingJobs.length, icon: Hammer, tone: "bg-blue-600" },
    { label: "Total earned", value: lkr(w.earned), icon: Banknote, tone: "bg-amber-500" },
    { label: "Rating", value: w.rating ? `${w.rating.toFixed(1)} / 5` : "No ratings", icon: Star, tone: "bg-sky-500" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "ongoing", label: "Ongoing jobs", count: ongoingJobs.length },
    { id: "completed", label: "Completed jobs", count: completedJobs.length },
    { id: "reviews", label: "Reviews", count: reviews.length },
    { id: "verification", label: "Verification", count: pendingDocs || undefined, hot: pendingDocs > 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#071433]/60" onClick={onClose} />

      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Worker details for ${w.name}`}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Header (same navy → blue gradient as the sidebar / logo) */}
        <div className="bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-6 pb-0 pt-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-sky-300/50 ${AVATARS[w.name.length % AVATARS.length]}`}>
                {initials}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{w.name}</h2>
                  <Pill cls={status.cls}>{status.label}</Pill>
                </div>
                <p className="mt-1 text-sm text-blue-100">
                  {w.trade} &nbsp;|&nbsp; WRK-{String(w.id).padStart(4, "0")} &nbsp;|&nbsp; Joined {fmtDate(w.joined)}
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
                className={`flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  tab === t.id ? "bg-white text-blue-950" : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.hot ? "bg-amber-400 text-amber-950" : tab === t.id ? "bg-blue-100 text-blue-800" : "bg-white/15 text-white"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          {/* ---------- Overview ---------- */}
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

              <div className="grid gap-6 md:grid-cols-3">
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-blue-950">Contact</h3>
                  <dl className="space-y-4">
                    <Field icon={Mail} label="Email">{w.email}</Field>
                    <Field icon={Phone} label="Phone">{w.phone}</Field>
                    <Field icon={MapPin} label="Address">{w.address}, {w.city}, {w.district} District</Field>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-blue-950">Professional</h3>
                  <dl className="space-y-4">
                    <Field icon={Wrench} label="Trade and experience">{w.trade}, {w.experience} years</Field>
                    <Field icon={Banknote} label="Daily rate">{lkr(w.dailyRate)}</Field>
                    <Field icon={Briefcase} label="Availability">
                      <span className={w.available ? "text-emerald-700" : "text-slate-500"}>{w.available ? "Open to new jobs" : "Not taking new jobs"}</span>
                    </Field>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-blue-950">Performance</h3>
                  <dl className="space-y-4">
                    <Field icon={FileText} label="Offers sent">{w.offersSent}</Field>
                    <Field icon={CheckCircle2} label="Offers accepted">{w.offersAccepted} ({acceptance}% acceptance)</Field>
                    <Field icon={Clock} label="Last active">{ago(w.lastActive)}</Field>
                  </dl>
                </section>
              </div>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-blue-950">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {w.skills.map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">{s}</span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-blue-950">About</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{w.bio}</p>
              </section>
            </div>
          )}

          {/* ---------- Ongoing jobs ---------- */}
          {tab === "ongoing" &&
            (ongoingJobs.length === 0 ? (
              <Empty icon={Hammer} text="This worker has no jobs in progress right now." />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {ongoingJobs.map((j) => {
                  const days = Math.ceil((j.dueAt - Date.now()) / DAY);
                  const late = days < 0;
                  return (
                    <li key={j.id} className="rounded-xl border border-blue-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{j.title}</p>
                          <p className="text-xs text-slate-500">{j.category} for {j.customer}</p>
                        </div>
                        <Pill cls={late ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-blue-100 text-blue-800 border-blue-300"}>
                          {late ? `Overdue ${-days}d` : days === 0 ? "Due today" : `Due in ${days}d`}
                        </Pill>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="font-medium text-slate-600">Progress</span>
                          <span className="font-semibold text-slate-900">{j.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                          <div className={`h-full rounded-full ${late ? "bg-rose-500" : "bg-gradient-to-r from-blue-600 to-sky-400"}`} style={{ width: `${j.progress}%` }} />
                        </div>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div><dt className="text-slate-500">Agreed price</dt><dd className="font-semibold text-slate-900">{lkr(j.price)}</dd></div>
                        <div><dt className="text-slate-500">Started</dt><dd className="font-semibold text-slate-900">{fmtDate(j.startedAt)}</dd></div>
                        <div><dt className="text-slate-500">Due</dt><dd className="font-semibold text-slate-900">{fmtDate(j.dueAt)}</dd></div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            ))}

          {/* ---------- Completed jobs ---------- */}
          {tab === "completed" &&
            (completedJobs.length === 0 ? (
              <Empty icon={CheckCircle2} text="This worker has not completed a job yet." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-blue-100">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-blue-50 text-xs text-blue-900">
                    <tr>
                      <th className={th}>Job</th><th className={th}>Customer</th><th className={th}>Earned</th>
                      <th className={th}>Rating</th><th className={th}>Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {completedJobs.map((j) => (
                      <tr key={j.id}>
                        <td className={td}>
                          <span className="block font-medium text-slate-900">{j.title}</span>
                          <span className="block text-xs text-slate-500">{j.category}</span>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>{j.customer}</td>
                        <td className={`${td} whitespace-nowrap`}>{lkr(j.price)}</td>
                        <td className={td}>{j.rating ? <Stars value={j.rating} /> : <span className="text-xs text-slate-400">Not rated</span>}</td>
                        <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(j.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ---------- Reviews ---------- */}
          {tab === "reviews" &&
            (reviews.length === 0 ? (
              <Empty icon={MessageSquare} text="No customer reviews yet." />
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-blue-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-slate-900">{r.customer}</p>
                        <Stars value={r.rating} />
                      </div>
                      <span className="text-xs text-slate-500">{fmtDate(r.at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  </li>
                ))}
              </ul>
            ))}

          {/* ---------- Verification ---------- */}
          {tab === "verification" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {docsApproved
                  ? "All documents are approved."
                  : "Review each document. A worker can be approved once every document is approved."}
              </p>
              <ul className="space-y-3">
                {w.documents.map((d) => (
                  <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-blue-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-blue-50 p-2.5 text-blue-600"><FileText size={18} /></span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{d.type}</p>
                        <p className="text-xs text-slate-500">{d.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill cls={DOC[d.status].cls}>{DOC[d.status].label}</Pill>
                      {d.status !== "approved" && (
                        <button onClick={() => onDocumentReview(w.id, d.id, "approved")} className={`rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 ${focus}`}>Approve</button>
                      )}
                      {d.status !== "rejected" && (
                        <button onClick={() => onDocumentReview(w.id, d.id, "rejected")} className={`rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 ${focus}`}>Reject</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 bg-blue-50/40 px-6 py-4">
          <a href={`mailto:${w.email}`} className={`flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
            <Mail size={16} /> Email
          </a>

          <div className="flex flex-wrap items-center gap-2">
            {w.status === "pending" && (
              <>
                {!docsApproved && <span className="flex items-center gap-1.5 text-xs text-amber-700"><Timer size={14} /> Approve all documents first</span>}
                <button onClick={() => onStatusChange(w.id, "rejected")} className={`flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 ${focus}`}>
                  <XCircle size={16} /> Reject application
                </button>
                <button
                  disabled={!docsApproved}
                  onClick={() => onStatusChange(w.id, "active")}
                  className={`flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 ${focus}`}
                >
                  <BadgeCheck size={16} /> Approve worker
                </button>
              </>
            )}
            {w.status === "active" && (
              <button onClick={() => onStatusChange(w.id, "suspended")} className={`flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 ${focus}`}>
                <Ban size={16} /> Suspend account
              </button>
            )}
            {w.status === "suspended" && (
              <button onClick={() => onStatusChange(w.id, "active")} className={`flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 ${focus}`}>
                <CheckCircle2 size={16} /> Reactivate account
              </button>
            )}
            {w.status === "rejected" && (
              <button onClick={() => onStatusChange(w.id, "pending")} className={`flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 ${focus}`}>
                <RotateCcw size={16} /> Reopen application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}