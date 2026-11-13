import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { lkr, toInputDate, fromInputDate } from "./orderUtils";

// local blue versions (replace the `focus` and `field` that used to come from ./orderUtils)
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

let keySeed = 0;
const newRow = (r = {}) => ({ key: ++keySeed, productId: "", qty: "1", unitCost: "", ...r });

const init = (order, branches) =>
  order
    ? {
        supplierId: String(order.supplierId),
        branchId: order.branchId,
        expectedDate: toInputDate(order.expectedDate),
        note: order.note || "",
        rows: order.items.map((i) => newRow({ productId: String(i.productId), qty: String(i.qty), unitCost: String(i.unitCost) })),
      }
    : {
        supplierId: "",
        branchId: branches.length === 1 ? branches[0].id : "",
        expectedDate: "",
        note: "",
        rows: [newRow()],
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
 * Used for both "New order" and "Edit order" (only while the order is pending).
 *  - order = null     -> new order
 *  - order = {...}    -> edit mode (form is pre-filled)
 * `branches` is the list of branches this user may order for
 * (admin: all branches, manager: only their own).
 */
export default function OrderFormModal({ order, suppliers, branches, products, onClose, onSave }) {
  const isEdit = Boolean(order);
  const [form, setForm] = useState(() => init(order, branches));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setRow = (key, patch) => setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const addRow = () => setForm((f) => ({ ...f, rows: [...f.rows, newRow()] }));
  const removeRow = (key) => setForm((f) => ({ ...f, rows: f.rows.length > 1 ? f.rows.filter((r) => r.key !== key) : f.rows }));

  const pickProduct = (key, productId) => {
    const p = products.find((x) => String(x.id) === productId);
    setRow(key, { productId, unitCost: p ? String(p.cost) : "" }); // fills the usual cost, the user can change it
  };

  const lineTotal = (r) => (Number(r.qty) || 0) * (Number(r.unitCost) || 0);
  const total = form.rows.reduce((n, r) => n + lineTotal(r), 0);

  const validate = () => {
    const e = {};
    if (!form.supplierId) e.supplierId = "Choose a supplier";
    if (!form.branchId) e.branchId = "Choose the branch to deliver to";
    if (!form.expectedDate) e.expectedDate = "Choose the expected delivery date";
    form.rows.forEach((r) => {
      const qty = Number(r.qty);
      const cost = Number(r.unitCost);
      if (!r.productId) e[`row_${r.key}`] = "Choose a product";
      else if (!Number.isInteger(qty) || qty < 1) e[`row_${r.key}`] = "Quantity must be a whole number, 1 or more";
      else if (!(cost > 0)) e[`row_${r.key}`] = "Enter the unit cost";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      supplierId: Number(form.supplierId),
      branchId: form.branchId,
      expectedDate: fromInputDate(form.expectedDate),
      note: form.note.trim(),
      items: form.rows.map((r) => {
        const p = products.find((x) => String(x.id) === r.productId);
        return { productId: p.id, name: p.name, qty: Number(r.qty), unitCost: Number(r.unitCost) };
      }),
    });
  };

  const usedIds = form.rows.map((r) => r.productId).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-form-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="order-form-title" className="text-lg font-bold">
              {isEdit ? `Edit order ${order.code}` : "New order"}
            </h2>
            <p className="text-sm text-blue-100">
              {isEdit ? "Update the order while it is still pending" : "Order stock from a supplier for one of your branches"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Supplier" error={errors.supplierId}>
              <select value={form.supplierId} onChange={set("supplierId")} className={field}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Deliver to branch" error={errors.branchId}>
              <select value={form.branchId} onChange={set("branchId")} disabled={branches.length === 1} className={`${field} disabled:cursor-not-allowed disabled:bg-blue-50`}>
                {branches.length > 1 && <option value="">Select branch</option>}
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Expected delivery" error={errors.expectedDate}>
              <input type="date" min={isEdit ? undefined : toInputDate(Date.now())} value={form.expectedDate} onChange={set("expectedDate")} className={field} />
            </Field>
          </div>

          {/* Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-950">Items</span>
              <button type="button" onClick={addRow} className={`flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-900 hover:border-blue-600 hover:bg-blue-50 ${focus}`}>
                <Plus size={14} /> Add item
              </button>
            </div>

            <div className="hidden gap-2 px-1 pb-1 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-12">
              <span className="col-span-5">Product</span>
              <span className="col-span-2">Quantity</span>
              <span className="col-span-2">Unit cost (LKR)</span>
              <span className="col-span-2 text-right">Line total</span>
            </div>

            <ul className="space-y-3">
              {form.rows.map((r) => (
                <li key={r.key}>
                  <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
                    <select
                      aria-label="Product"
                      value={r.productId}
                      onChange={(e) => pickProduct(r.key, e.target.value)}
                      className={`${field} col-span-2 sm:col-span-5`}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={usedIds.includes(String(p.id)) && String(p.id) !== r.productId}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input aria-label="Quantity" type="number" min="1" step="1" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} className={`${field} sm:col-span-2`} />
                    <input aria-label="Unit cost" type="number" min="0" value={r.unitCost} onChange={(e) => setRow(r.key, { unitCost: e.target.value })} placeholder="0" className={`${field} sm:col-span-2`} />
                    <span className="col-span-1 text-right text-sm font-medium text-slate-900 sm:col-span-2">{lkr(lineTotal(r))}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(r.key)}
                      disabled={form.rows.length === 1}
                      aria-label="Remove item"
                      className={`col-span-1 justify-self-end rounded-lg p-2 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30 ${focus}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {errors[`row_${r.key}`] && <p className="mt-1 text-xs text-rose-600">{errors[`row_${r.key}`]}</p>}
                </li>
              ))}
            </ul>
          </div>

          <Field label="Note (optional)">
            <textarea rows={2} value={form.note} onChange={set("note")} placeholder="Anything the supplier or the branch should know" className={field} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <p className="text-sm text-slate-500">Order total: <span className="text-base font-bold text-blue-950">{lkr(total)}</span></p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
              Cancel
            </button>
            <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
              {isEdit ? "Save changes" : "Place order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}