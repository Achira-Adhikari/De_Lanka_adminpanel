import { useEffect, useRef, useState } from "react";
import { X, ImagePlus, Trash2, Lock } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

const blank = (branches) => ({
  name: "",
  category: "",
  subCategory: "",
  price: "",
  status: "active",
  description: "",
  image: "",
  stock: Object.fromEntries(branches.map((b) => [b.id, "0"])),
});

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
 * Used for both "Add product" and "Edit product".
 *  - product = null   -> add mode
 *  - product = {...}  -> update mode (form is pre-filled)
 * `stock` is an object with one number per branch: { colombo: 12, kandy: 3, ... }
 *
 * `subCategories` = { "Electrical": ["Wiring", ...], "Cleaning": [] }
 *  The sub category field only shows when the chosen category has sub categories.
 *
 * `editableIds` = branches this user may set stock for.
 *  Admin   -> every branch
 *  Manager -> only their own branch (other branches are locked, they stay at 0 on a new product)
 */
export default function ProductFormModal({ product, categories, subCategories = {}, branches, editableIds, onClose, onSave }) {
  const isEdit = Boolean(product);
  const canEditBranch = (id) => !editableIds || editableIds.includes(id);
  const [form, setForm] = useState(() => blank(branches));
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(
      product
        ? {
            ...blank(branches),
            ...product,
            price: String(product.price),
            stock: Object.fromEntries(branches.map((b) => [b.id, String(product.stock[b.id] ?? 0)])),
          }
        : blank(branches)
    );
    setErrors({});
  }, [product, branches]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const subsForCategory = subCategories[form.category] ?? [];
  const hasSubs = subsForCategory.length > 0;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  // changing the category clears the sub category, because the old one may not belong to the new category
  const setCategory = (e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: "" }));
  const setStock = (id) => (e) => setForm((f) => ({ ...f, stock: { ...f.stock, [id]: e.target.value } }));

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    /* Demo only: a local preview URL. In production, upload the file to your
       storage (S3, Cloudinary, etc) and save the returned URL instead. */
    setForm((f) => ({ ...f, image: URL.createObjectURL(file) }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter the product name";
    if (!form.category) e.category = "Choose a category";
    if (hasSubs && !form.subCategory) e.subCategory = "Choose a sub category";
    if (form.price === "" || Number(form.price) <= 0) e.price = "Enter a price above 0";
    branches.filter((b) => canEditBranch(b.id)).forEach((b) => {
      const v = form.stock[b.id];
      const n = Number(v);
      if (v === "" || n < 0 || !Number.isInteger(n)) e[`stock_${b.id}`] = "Whole number, 0 or more";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      subCategory: hasSubs ? form.subCategory : "",
      price: Number(form.price),
      // Locked branches are never changed: keep the old value (edit) or 0 (new product)
      stock: Object.fromEntries(
        branches.map((b) => [
          b.id,
          canEditBranch(b.id) ? Number(form.stock[b.id]) : isEdit ? product.stock[b.id] ?? 0 : 0,
        ])
      ),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="product-form-title" className="text-lg font-bold">
              {isEdit ? "Edit product" : "Add product"}
            </h2>
            <p className="text-sm text-blue-100">
              {isEdit ? "Update the details and save your changes" : "Fill in the details to add a new product"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Product name" error={errors.name}>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Ceiling fan 56 inch" className={field} />
            </Field>
          </div>

          <Field label="Category" error={errors.category}>
            <select value={form.category} onChange={setCategory} className={field}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {hasSubs && (
            <Field label="Sub category" error={errors.subCategory}>
              <select value={form.subCategory} onChange={set("subCategory")} className={field}>
                <option value="">Select sub category</option>
                {subsForCategory.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          )}

          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={field}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </Field>

          <Field label="Price (LKR)" error={errors.price}>
            <input type="number" min="0" value={form.price} onChange={set("price")} placeholder="0" className={field} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={set("description")} placeholder="What is this product, and what should customers know?" className={field} />
            </Field>
          </div>

          {/* Stock per branch */}
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 text-sm font-semibold text-blue-950">Stock by branch</legend>
            {editableIds && editableIds.length < branches.length && (
              <p className="mb-2 text-xs text-slate-500">You can only set the stock for your own branch. Other branches start at 0.</p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {branches.map((b) => {
                const ok = canEditBranch(b.id);
                return (
                  <Field
                    key={b.id}
                    label={<span className="flex items-center gap-1.5">{b.name}{!ok && <Lock size={12} className="text-blue-300" />}</span>}
                    error={errors[`stock_${b.id}`]}
                  >
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!ok}
                      value={ok ? form.stock[b.id] : isEdit ? product.stock[b.id] ?? 0 : 0}
                      onChange={setStock(b.id)}
                      className={`${field} disabled:cursor-not-allowed disabled:bg-blue-50 disabled:text-slate-500`}
                    />
                  </Field>
                );
              })}
            </div>
          </fieldset>

          {/* Image */}
          <div className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Product image</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
            {form.image ? (
              <div className="flex items-center gap-4">
                <img src={form.image} alt="Product preview" className="h-20 w-20 rounded-lg border border-blue-100 object-cover" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className={`rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                    Change
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))} className={`flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 ${focus}`}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-blue-300 bg-blue-50/40 py-6 text-sm text-slate-500 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 ${focus}`}
              >
                <ImagePlus size={22} className="text-blue-600" />
                Click to upload an image
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
            Cancel
          </button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
            {isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}