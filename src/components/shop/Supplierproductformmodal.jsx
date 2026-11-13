import { useEffect, useRef, useState } from "react";
import { X, ImagePlus, Trash2 } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

const EMPTY = {
  supplierId: "",
  name: "",
  category: "",
  subCategory: "",
  unitCost: "",
  minOrderQty: "1",
  availability: "available",
  description: "",
  image: "",
};

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
 * A product that a SUPPLIER sells (the supplier's own catalog, separate from
 * the products you sell in your branches). Used for both Add and Edit.
 *  - product = null    -> add mode
 *  - product = {...}   -> update mode (form is pre-filled)
 * `suppliers` = active suppliers (plus the product's current one when editing).
 * `subCategories` = { "Electrical": ["Wiring", ...], "Cleaning": [] }
 */
export default function SupplierProductFormModal({ product, suppliers, categories, subCategories = {}, onClose, onSave }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(
      product
        ? { ...EMPTY, ...product, supplierId: String(product.supplierId), unitCost: String(product.unitCost), minOrderQty: String(product.minOrderQty) }
        : EMPTY
    );
    setErrors({});
  }, [product]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const subsForCategory = subCategories[form.category] ?? [];
  const hasSubs = subsForCategory.length > 0;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCategory = (e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: "" }));

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    /* Demo only: a local preview URL. In production, upload the file to your
       storage (S3, Cloudinary, etc) and save the returned URL instead. */
    setForm((f) => ({ ...f, image: URL.createObjectURL(file) }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.supplierId) errs.supplierId = "Choose the supplier";
    if (!form.name.trim()) errs.name = "Enter the product name";
    if (!form.category) errs.category = "Choose a category";
    if (hasSubs && !form.subCategory) errs.subCategory = "Choose a sub category";
    if (!(Number(form.unitCost) > 0)) errs.unitCost = "Enter the supplier price above 0";
    const moq = Number(form.minOrderQty);
    if (!Number.isInteger(moq) || moq < 1) errs.minOrderQty = "Whole number, 1 or more";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      ...form,
      supplierId: Number(form.supplierId),
      name: form.name.trim(),
      description: form.description.trim(),
      subCategory: hasSubs ? form.subCategory : "",
      unitCost: Number(form.unitCost),
      minOrderQty: moq,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sp-form-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="sp-form-title" className="text-lg font-bold">
              {isEdit ? "Edit supplier product" : "Add supplier product"}
            </h2>
            <p className="text-sm text-blue-100">
              {isEdit ? "Update what this supplier sells" : "Add a product that a supplier sells to you"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <Field label="Supplier" error={errors.supplierId}>
            <select value={form.supplierId} onChange={set("supplierId")} className={field}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Product name" error={errors.name}>
            <input value={form.name} onChange={set("name")} placeholder="e.g. PVC pipe 1 inch (6m)" className={field} />
          </Field>

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

          <Field label="Supplier price (LKR)" error={errors.unitCost}>
            <input type="number" min="0" value={form.unitCost} onChange={set("unitCost")} placeholder="0" className={field} />
          </Field>

          <Field label="Minimum order quantity" error={errors.minOrderQty}>
            <input type="number" min="1" step="1" value={form.minOrderQty} onChange={set("minOrderQty")} className={field} />
          </Field>

          <Field label="Availability">
            <select value={form.availability} onChange={set("availability")} className={field}>
              <option value="available">Available</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={set("description")} placeholder="Size, brand, pack details and anything else worth knowing" className={field} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Product image</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
            {form.image ? (
              <div className="flex items-center gap-4">
                <img src={form.image} alt="Product preview" className="h-20 w-20 rounded-lg border border-blue-100 object-cover" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className={`rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Change</button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))} className={`flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 ${focus}`}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className={`flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-blue-300 bg-blue-50/40 py-6 text-sm text-slate-500 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 ${focus}`}>
                <ImagePlus size={22} className="text-blue-600" />
                Click to upload an image
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Cancel</button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
            {isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}