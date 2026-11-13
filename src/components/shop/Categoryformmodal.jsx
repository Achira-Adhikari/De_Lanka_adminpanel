import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

const EMPTY = { name: "", description: "", status: "active", subCategories: [] };

/**
 * Used for both "Add category" and "Edit category".
 *  - category = null     -> add mode
 *  - category = {...}    -> update mode (form is pre-filled)
 * `existingNames` is the list of the OTHER categories' names, used to stop duplicates.
 * A category can have zero sub categories.
 */
export default function CategoryFormModal({ category, existingNames, onClose, onSave }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState(EMPTY);
  const [subInput, setSubInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(category ? { ...EMPTY, ...category, subCategories: [...category.subCategories] } : EMPTY);
    setSubInput("");
    setErrors({});
  }, [category]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addSub = () => {
    const name = subInput.trim();
    if (!name) return;
    if (form.subCategories.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setErrors((er) => ({ ...er, sub: "That sub category is already added" }));
      return;
    }
    setForm((f) => ({ ...f, subCategories: [...f.subCategories, name] }));
    setSubInput("");
    setErrors((er) => ({ ...er, sub: undefined }));
  };

  const removeSub = (name) => setForm((f) => ({ ...f, subCategories: f.subCategories.filter((s) => s !== name) }));

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const errs = {};
    if (!name) errs.name = "Enter the category name";
    else if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) errs.name = "A category with this name already exists";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // if the user typed a sub category but forgot to press Add, include it
    const pending = subInput.trim();
    const subs =
      pending && !form.subCategories.some((s) => s.toLowerCase() === pending.toLowerCase())
        ? [...form.subCategories, pending]
        : form.subCategories;

    onSave({ ...form, name, description: form.description.trim(), subCategories: subs });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="category-form-title" className="text-lg font-bold">
              {isEdit ? "Edit category" : "Add category"}
            </h2>
            <p className="text-sm text-blue-100">
              {isEdit ? "Update the details and save your changes" : "Create a category and, if needed, its sub categories"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Category name</span>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Electrical" className={field} />
            {errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea rows={2} value={form.description} onChange={set("description")} placeholder="Short note about what belongs in this category" className={field} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select value={form.status} onChange={set("status")} className={field}>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>

          {/* Sub categories */}
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Sub categories</span>
            <p className="mb-2 text-xs text-slate-500">Optional. Leave empty if this category has no sub categories.</p>
            <div className="flex gap-2">
              <input
                value={subInput}
                onChange={(e) => { setSubInput(e.target.value); setErrors((er) => ({ ...er, sub: undefined })); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }}
                placeholder="Type a sub category and press Enter"
                className={field}
              />
              <button type="button" onClick={addSub} className={`flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-900 hover:border-blue-600 hover:bg-blue-50 ${focus}`}>
                <Plus size={14} /> Add
              </button>
            </div>
            {errors.sub && <span className="mt-1 block text-xs text-rose-600">{errors.sub}</span>}

            {form.subCategories.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {form.subCategories.map((s) => (
                  <li key={s} className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pl-3 pr-1 text-sm text-blue-900">
                    {s}
                    <button type="button" onClick={() => removeSub(s)} aria-label={`Remove ${s}`} className={`rounded-full p-1 text-blue-700 hover:bg-blue-100 ${focus}`}>
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
            Cancel
          </button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
            {isEdit ? "Save changes" : "Add category"}
          </button>
        </div>
      </form>
    </div>
  );
}