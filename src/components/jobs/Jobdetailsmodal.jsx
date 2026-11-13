import { useEffect, useRef, useState } from "react";
import {
  X, Mail, Phone, MapPin, Ban, Trash2, Briefcase, Wallet, Inbox, Clock, CalendarDays,
  Image as ImageIcon, Video, Mic, Play, BadgeCheck, BadgeAlert, Star, ChevronDown,
  Handshake, User, Wrench, TrendingDown, CheckCircle2,
} from "lucide-react";

/* =====================================================================
   JobDetailsModal: reusable, self-contained.

   <JobDetailsModal
     job={job}                    // required: the job record
     onClose={() => {}}
     onCancel={(id) => {}}        // cancel an open / hired job
     onDelete={(id) => {}}
   />

   job: {
     id, title, category, description, budget, city, address,
     status,                     // "open" | "hired" | "completed" | "cancelled"
     postedAt,
     customer: { id, name, email, phone },
     media: {
       images: [{ id, url }],     // max 6
       videos: [{ id, url, poster? }],   // max 2
       voice:  { url, duration } | null  // one voice message, duration like "0:42"
     },
     offers: [{ id, price, days, message, sentAt,
       worker: { id, name, email, phone, city, rating, completedJobs,
                 verified, skills: [], joined } }],
     hiredOfferId,               // id of the offer the customer selected, or null
   }
   ===================================================================== */

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const AVATARS = ["bg-blue-600", "bg-sky-500", "bg-indigo-600", "bg-emerald-600", "bg-violet-600"];

const JOB_PILL = {
  open: { label: "Receiving offers", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  hired: { label: "Worker hired", cls: "bg-blue-100 text-blue-800 border-blue-300" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 border-slate-300" },
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

function Avatar({ name, size = "h-10 w-10 text-sm" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size} ${AVATARS[name.length % AVATARS.length]}`}>
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

function Rating({ value }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-900">
      <Star size={14} className="fill-amber-400 text-amber-400" /> {value}
    </span>
  );
}

function SectionTitle({ children, hint }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="text-sm font-semibold text-blue-950">{children}</h3>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

/* A worker's full details. Used for the hired worker tab. */
function WorkerProfile({ offer }) {
  const w = offer.worker;
  const tiles = [
    { label: "Rating", value: w.rating, icon: Star, tone: "bg-amber-500" },
    { label: "Jobs completed", value: w.completedJobs, icon: CheckCircle2, tone: "bg-emerald-600" },
    { label: "Agreed price", value: lkr(offer.price), icon: Wallet, tone: "bg-blue-600" },
    { label: "Duration", value: `${offer.days} day${offer.days > 1 ? "s" : ""}`, icon: Clock, tone: "bg-sky-500" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
        <Avatar name={w.name} size="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900">{w.name}</p>
          <p className="text-sm text-slate-600">WRK-{String(w.id).padStart(4, "0")} &nbsp;|&nbsp; Selected by the customer</p>
        </div>
        <Pill cls="bg-emerald-600 text-white border-emerald-600">Hired</Pill>
      </div>

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
          <SectionTitle>Contact</SectionTitle>
          <dl className="space-y-4">
            <Field icon={Mail} label="Email">{w.email}</Field>
            <Field icon={Phone} label="Phone">{w.phone}<Verified ok={w.verified} /></Field>
            <Field icon={MapPin} label="City">{w.city}</Field>
          </dl>
        </section>
        <section>
          <SectionTitle>Worker</SectionTitle>
          <dl className="space-y-4">
            <Field icon={CalendarDays} label="Member since">{fmtDate(w.joined)}</Field>
            <Field icon={Clock} label="Offer sent">{fmtDateTime(offer.sentAt)}</Field>
            <Field icon={Wrench} label="Skills">
              <span className="mt-1 flex flex-wrap gap-1.5">
                {w.skills.map((s) => (
                  <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">{s}</span>
                ))}
              </span>
            </Field>
          </dl>
        </section>
      </div>

      <section>
        <SectionTitle>Message sent with the offer</SectionTitle>
        <p className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700">{offer.message}</p>
      </section>
    </div>
  );
}

const MAX_IMAGES = 6;
const MAX_VIDEOS = 2;

export default function JobDetailsModal({ job: j, onClose, onCancel, onDelete }) {
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [preview, setPreview] = useState(null);
  const panel = useRef(null);

  /* Esc closes the image preview first, then the modal. Lock page scroll, move focus in. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (preview) setPreview(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, preview]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  const images = (j.media?.images || []).slice(0, MAX_IMAGES);
  const videos = (j.media?.videos || []).slice(0, MAX_VIDEOS);
  const voice = j.media?.voice || null;
  const mediaCount = images.length + videos.length + (voice ? 1 : 0);

  const hiredOffer = j.offers.find((o) => o.id === j.hiredOfferId) || null;
  const lowest = j.offers.length ? Math.min(...j.offers.map((o) => o.price)) : 0;
  const sortedOffers = [...j.offers].sort((a, b) =>
    a.id === j.hiredOfferId ? -1 : b.id === j.hiredOfferId ? 1 : a.price - b.price
  );
  const canCancel = j.status === "open" || j.status === "hired";
  const status = JOB_PILL[j.status];

  const tiles = [
    { label: "Budget", value: lkr(j.budget), icon: Wallet, tone: "bg-blue-600" },
    { label: "Offers received", value: j.offers.length, icon: Inbox, tone: "bg-sky-500" },
    { label: "Lowest offer", value: j.offers.length ? lkr(lowest) : "None", icon: TrendingDown, tone: "bg-emerald-600" },
    { label: "Posted", value: ago(j.postedAt), icon: Clock, tone: "bg-amber-500" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "media", label: "Media", count: mediaCount },
    { id: "offers", label: "Offers", count: j.offers.length },
    ...(hiredOffer ? [{ id: "hired", label: "Hired worker" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#071433]/60" onClick={onClose} />

      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Job details for ${j.title}`}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Header (same navy → blue gradient as the sidebar / logo) */}
        <div className="bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-6 pb-0 pt-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-sky-300/50">
                <Briefcase size={28} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{j.title}</h2>
                  <Pill cls={status.cls}>{status.label}</Pill>
                </div>
                <p className="mt-1 text-sm text-blue-100">
                  JOB-{String(j.id).padStart(4, "0")} &nbsp;|&nbsp; {j.category} &nbsp;|&nbsp; Posted {fmtDate(j.postedAt)}
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
                className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
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

              <section>
                <SectionTitle>Description</SectionTitle>
                <p className="whitespace-pre-line rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700">{j.description}</p>
              </section>

              {hiredOffer && (
                <button
                  onClick={() => setTab("hired")}
                  className={`flex w-full items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-left hover:bg-emerald-100 ${focus}`}
                >
                  <Avatar name={hiredOffer.worker.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-emerald-800">Hired worker</span>
                    <span className="block truncate text-sm font-semibold text-slate-900">{hiredOffer.worker.name}</span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-800">{lkr(hiredOffer.price)}</span>
                </button>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <SectionTitle>Posted by</SectionTitle>
                  <dl className="space-y-4">
                    <Field icon={User} label="Customer">{j.customer.name}</Field>
                    <Field icon={Mail} label="Email">{j.customer.email}</Field>
                    <Field icon={Phone} label="Phone">{j.customer.phone}</Field>
                  </dl>
                </section>
                <section>
                  <SectionTitle>Job location</SectionTitle>
                  <dl className="space-y-4">
                    <Field icon={MapPin} label="Address">{j.address}, {j.city}</Field>
                    <Field icon={CalendarDays} label="Posted on">{fmtDateTime(j.postedAt)}</Field>
                    <Field icon={Wallet} label="Customer budget">{lkr(j.budget)}</Field>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {/* ---------- Media ---------- */}
          {tab === "media" &&
            (mediaCount === 0 ? (
              <Empty icon={ImageIcon} text="The customer did not attach any photos, videos or voice message." />
            ) : (
              <div className="space-y-6">
                <section>
                  <SectionTitle hint={`${images.length} of ${MAX_IMAGES}`}>Photos</SectionTitle>
                  {images.length === 0 ? (
                    <p className="text-sm text-slate-500">No photos attached.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => img.url && setPreview(img)}
                          aria-label={`Open photo ${i + 1}`}
                          className={`group relative aspect-[4/3] overflow-hidden rounded-lg border border-blue-100 bg-blue-50 ${focus}`}
                        >
                          {img.url ? (
                            <img src={img.url} alt={`Job photo ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-blue-300">
                              <ImageIcon size={24} />
                              <span className="text-xs">Photo {i + 1}</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle hint={`${videos.length} of ${MAX_VIDEOS}`}>Videos</SectionTitle>
                  {videos.length === 0 ? (
                    <p className="text-sm text-slate-500">No videos attached.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {videos.map((v, i) => (
                        <div key={v.id} className="overflow-hidden rounded-lg border border-blue-100 bg-[#071433]">
                          {v.url ? (
                            <video controls preload="metadata" poster={v.poster} className="aspect-video w-full bg-black">
                              <source src={v.url} />
                            </video>
                          ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-blue-200">
                              <Play size={28} />
                              <span className="text-xs">Video {i + 1}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle>Voice message</SectionTitle>
                  {!voice ? (
                    <p className="text-sm text-slate-500">No voice message attached.</p>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-100 p-3">
                      <span className="rounded-lg bg-blue-600 p-2.5 text-white"><Mic size={18} /></span>
                      {voice.url ? (
                        <audio controls preload="metadata" src={voice.url} className="h-10 w-full flex-1" />
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">Voice message from {j.customer.name}</p>
                          <p className="text-xs text-slate-500">Audio file not available</p>
                        </div>
                      )}
                      {voice.duration && <span className="text-xs font-medium text-slate-500">{voice.duration}</span>}
                    </div>
                  )}
                </section>
              </div>
            ))}

          {/* ---------- Offers ---------- */}
          {tab === "offers" &&
            (sortedOffers.length === 0 ? (
              <Empty icon={Inbox} text="No workers have sent an offer for this job yet." />
            ) : (
              <ul className="space-y-3">
                {sortedOffers.map((o) => {
                  const isHired = o.id === j.hiredOfferId;
                  const isOpen = expanded === o.id;
                  return (
                    <li key={o.id} className={`overflow-hidden rounded-xl border ${isHired ? "border-emerald-300 bg-emerald-50/50" : "border-blue-100"}`}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : o.id)}
                        aria-expanded={isOpen}
                        className={`flex w-full items-center gap-3 p-3 text-left hover:bg-blue-50/60 ${focus}`}
                      >
                        <Avatar name={o.worker.name} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">{o.worker.name}</span>
                            {isHired && <Pill cls="bg-emerald-600 text-white border-emerald-600">Selected</Pill>}
                            {!isHired && o.price === lowest && <Pill cls="bg-sky-100 text-sky-800 border-sky-300">Lowest</Pill>}
                          </span>
                          <span className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                            <Rating value={o.worker.rating} />
                            <span>{o.days} day{o.days > 1 ? "s" : ""}</span>
                            <span>{o.worker.city}</span>
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-sm font-bold text-slate-900">{lkr(o.price)}</span>
                        <ChevronDown size={18} className={`shrink-0 text-blue-400 transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isOpen && (
                        <div className="space-y-4 border-t border-blue-100 bg-white p-4">
                          <p className="rounded-lg bg-blue-50/50 p-3 text-sm text-slate-700">{o.message}</p>
                          <dl className="grid gap-4 sm:grid-cols-2">
                            <Field icon={Mail} label="Email">{o.worker.email}</Field>
                            <Field icon={Phone} label="Phone">{o.worker.phone}<Verified ok={o.worker.verified} /></Field>
                            <Field icon={Handshake} label="Jobs completed">{o.worker.completedJobs}</Field>
                            <Field icon={Clock} label="Offer sent">{fmtDateTime(o.sentAt)}</Field>
                          </dl>
                          <div className="flex flex-wrap gap-1.5">
                            {o.worker.skills.map((s) => (
                              <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ))}

          {/* ---------- Hired worker ---------- */}
          {tab === "hired" && hiredOffer && <WorkerProfile offer={hiredOffer} />}
        </div>

        {/* Footer actions */}
        <div className="border-t border-blue-100 bg-blue-50/40 px-6 py-4">
          {confirmDelete ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rose-900">Delete "{j.title}"? All offers on this job will be removed too. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
                <button onClick={() => onDelete(j.id)} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 ${focus}`}>Delete job</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setConfirmDelete(true)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 ${focus}`}>
                <Trash2 size={16} /> Delete
              </button>
              <div className="flex gap-2">
                <a href={`mailto:${j.customer.email}`} className={`flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                  <Mail size={16} /> Email customer
                </a>
                {canCancel && (
                  <button onClick={() => onCancel(j.id)} className={`flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 ${focus}`}>
                    <Ban size={16} /> Cancel job
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo preview */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo preview">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreview(null)} />
          <img src={preview.url} alt="Job photo enlarged" className="relative max-h-full max-w-full rounded-lg object-contain" />
          <button onClick={() => setPreview(null)} aria-label="Close preview" className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}