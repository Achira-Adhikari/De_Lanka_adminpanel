import { useEffect, useState } from "react";
import { X } from "lucide-react";

// local blue versions (replace the `focus` and `field` that used to come from ./orderUtils)
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

const EMPTY = { name: "", contactPerson: "", phone: "", email: "", city: "", status: "active", categories: [] };

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

/**
 * Used for both "Add supplier" and "Edit supplier".
 *  - supplier = null    -> add mode
 *  - supplier = {...}   -> update mode (form is pre-filled)
 * `existingNames` = names of the OTHER suppliers, to stop duplicates.
 */
export default function SupplierFormModal({ supplier, categories, existingNames, onClose, onSave }) {
  const isEdit = Boolean(supplier);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(supplier ? { ...EMPTY, ...supplier, categories: [...supplier.categories] } : EMPTY);
    setErrors({});
  }, [supplier]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleCat = (c) =>
    setForm((f) => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c] }));

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const errs = {};
    if (!name) errs.name = "Enter the supplier name";
    else if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) errs.name = "A supplier with this name already exists";
    if (!form.contactPerson.trim()) errs.contactPerson = "Enter a contact person";
    if (!form.phone.trim()) errs.phone = "Enter a phone number";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      ...form,
      name,
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-form-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="supplier-form-title" className="text-lg font-bold">{isEdit ? "Edit supplier" : "Add supplier"}</h2>
            <p className="text-sm text-blue-100">{isEdit ? "Update the details and save your changes" : "Add a supplier you buy stock from"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Supplier name" error={errors.name}>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Lanka Electricals (Pvt) Ltd" className={field} />
            </Field>
          </div>
          <Field label="Contact person" error={errors.contactPerson}>
            <input value={form.contactPerson} onChange={set("contactPerson")} className={field} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="011 234 5678" className={field} />
          </Field>
          <Field label="Email (optional)" error={errors.email}>
            <input type="email" value={form.email} onChange={set("email")} className={field} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={set("city")} className={field} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={field}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Supplies (optional)</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = form.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCat(c)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${focus} ${on ? "border-blue-600 bg-blue-50 font-medium text-blue-900" : "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-800"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Cancel</button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
            {isEdit ? "Save changes" : "Add supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}