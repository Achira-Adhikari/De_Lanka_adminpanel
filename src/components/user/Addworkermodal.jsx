import { useEffect, useRef, useState } from "react";
import { X, UserPlus } from "lucide-react";

/* =====================================================================
   AddWorkerModal: reusable, self-contained.

   <AddWorkerModal
     trades={["Electrician", "Plumber"]}
     skillsByTrade={{ Electrician: ["House wiring"], Plumber: ["Pipe fitting"] }}
     existingEmails={["a@b.com"]}       // used to block duplicates
     onClose={() => {}}
     onAdd={(worker) => {}}             // see shape below
   />

   onAdd receives:
   { name, email, phone, trade, skills[], experience, dailyRate,
     city, district, address, bio, available, status }
   status is "pending" (needs document review) or "active".
   ===================================================================== */

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna",
  "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2";
const ok = "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20";
const bad = "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20";

function Field({ label, error, hint, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
        <div className="mt-1.5">{children}</div>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-rose-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 w-full border-b border-blue-100 pb-2 text-sm font-semibold text-blue-950">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function AddWorkerModal({
  trades = ["Electrician", "Plumber", "AC technician", "Carpenter", "Painter", "Mason", "Cleaner"],
  skillsByTrade = {},
  existingEmails = [],
  onClose,
  onAdd,
}) {
  const [f, setF] = useState({
    name: "", email: "", phone: "", trade: trades[0], skills: [], experience: "", dailyRate: "",
    city: "", district: "Colombo", address: "", bio: "", available: true, status: "pending",
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const first = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const changeTrade = (e) => setF((s) => ({ ...s, trade: e.target.value, skills: [] }));
  const toggleSkill = (skill) =>
    setF((s) => ({ ...s, skills: s.skills.includes(skill) ? s.skills.filter((x) => x !== skill) : [...s.skills, skill] }));

  /* ---------- validation ---------- */
  const errors = {};
  if (!f.name.trim()) errors.name = "Enter the worker's full name.";
  if (!/\S+@\S+\.\S+/.test(f.email)) errors.email = "Enter a valid email address.";
  else if (existingEmails.map((x) => x.toLowerCase()).includes(f.email.trim().toLowerCase()))
    errors.email = "A user with this email already exists.";
  if (f.phone.replace(/\D/g, "").length < 9) errors.phone = "Enter a valid phone number.";
  if (f.experience !== "" && (Number(f.experience) < 0 || Number(f.experience) > 60)) errors.experience = "Enter 0 to 60 years.";
  if (f.dailyRate !== "" && Number(f.dailyRate) < 0) errors.dailyRate = "Rate cannot be negative.";

  const show = (k) => (touched[k] || submitted) && errors[k];
  const cls = (k) => `${inputBase} ${show(k) ? bad : ok}`;

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    onAdd({
      ...f,
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      city: f.city.trim() || f.district,
      address: f.address.trim() || "Not provided",
      experience: Number(f.experience) || 0,
      dailyRate: Number(f.dailyRate) || 0,
      bio: f.bio.trim() || "New worker. Profile details have not been added yet.",
    });
  };

  const skillOptions = skillsByTrade[f.trade] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#071433]/60" onClick={onClose} />

      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label="Add worker"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header (same navy → blue gradient as the sidebar / logo) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-gradient-to-br from-sky-300 to-sky-500 p-2.5 text-blue-950"><UserPlus size={20} /></span>
            <div>
              <h2 className="text-lg font-bold">Add worker</h2>
              <p className="text-sm text-blue-100">Create a worker profile on their behalf</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={22} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <Section title="Personal details">
            <Field label="Full name" required error={show("name")}>
              <input ref={first} className={cls("name")} value={f.name} onChange={set("name")} onBlur={blur("name")} placeholder="Dilshan Gamage" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required error={show("email")}>
                <input type="email" className={cls("email")} value={f.email} onChange={set("email")} onBlur={blur("email")} placeholder="dilshan@example.com" />
              </Field>
              <Field label="Phone" required error={show("phone")}>
                <input type="tel" className={cls("phone")} value={f.phone} onChange={set("phone")} onBlur={blur("phone")} placeholder="077 123 4567" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <input className={`${inputBase} ${ok}`} value={f.city} onChange={set("city")} placeholder="Negombo" />
              </Field>
              <Field label="District">
                <select className={`${inputBase} ${ok}`} value={f.district} onChange={set("district")}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Street address">
              <input className={`${inputBase} ${ok}`} value={f.address} onChange={set("address")} placeholder="12, Temple Road" />
            </Field>
          </Section>

          <Section title="Work details">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Trade" required>
                <select className={`${inputBase} ${ok}`} value={f.trade} onChange={changeTrade}>
                  {trades.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Experience (years)" error={show("experience")}>
                <input type="number" min="0" max="60" className={cls("experience")} value={f.experience} onChange={set("experience")} onBlur={blur("experience")} placeholder="5" />
              </Field>
              <Field label="Daily rate (LKR)" error={show("dailyRate")}>
                <input type="number" min="0" step="500" className={cls("dailyRate")} value={f.dailyRate} onChange={set("dailyRate")} onBlur={blur("dailyRate")} placeholder="8000" />
              </Field>
            </div>

            {skillOptions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Skills">
                  {skillOptions.map((s) => {
                    const on = f.skills.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        aria-pressed={on}
                        onClick={() => toggleSkill(s)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${focus} ${
                          on ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-800"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Field label="About the worker" hint="A short summary customers will see on their profile.">
              <textarea rows={3} className={`${inputBase} ${ok} resize-none`} value={f.bio} onChange={set("bio")} placeholder="Experienced electrician serving the Negombo area." />
            </Field>
          </Section>

          <Section title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Starting status"
                hint={f.status === "pending" ? "Documents must be approved before the worker can take jobs." : "The worker can take jobs straight away."}
              >
                <select className={`${inputBase} ${ok}`} value={f.status} onChange={set("status")}>
                  <option value="pending">Pending review</option>
                  <option value="active">Active (skip review)</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 self-start rounded-lg border border-blue-100 bg-blue-50/40 p-3 sm:mt-[26px]">
                <input
                  type="checkbox"
                  checked={f.available}
                  onChange={(e) => setF((s) => ({ ...s, available: e.target.checked }))}
                  className={`h-4 w-4 rounded border-slate-300 text-blue-700 ${focus}`}
                />
                <span className="text-sm font-medium text-slate-700">Open to new jobs</span>
              </label>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-blue-100 bg-blue-50/40 px-6 py-4">
          <p className="text-xs text-slate-500"><span className="text-rose-500">*</span> Required</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
              Cancel
            </button>
            <button type="submit" className={`rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 focus-visible:ring-offset-2 ${focus}`}>
              Add worker
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}