import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-100";

/**
 * Move stock of one product from one branch to another.
 * `editableIds` = branches the user may take stock OUT of
 * (admin: all, manager: only their own). The destination can be any other branch.
 * Calls onSave({ productId, fromId, toId, qty, note }).
 */
export default function StockTransferModal({ product, branches, editableIds, startBranchId, onClose, onSave }) {
  const sources = branches.filter((b) => editableIds.includes(b.id));
  const firstWithStock = sources.find((b) => (product.stock[b.id] ?? 0) > 0)?.id;
  const [fromId, setFromId] = useState(() => (sources.some((b) => b.id === startBranchId) && (product.stock[startBranchId] ?? 0) > 0 ? startBranchId : firstWithStock ?? sources[0]?.id ?? ""));
  const [toId, setToId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const available = product.stock[fromId] ?? 0;
  const destinations = branches.filter((b) => b.id !== fromId);
  const n = Number(qty);
  const qtyOk = qty !== "" && Number.isInteger(n) && n >= 1 && n <= available;
  const name = (id) => branches.find((b) => b.id === id)?.name ?? "";

  const changeFrom = (id) => {
    setFromId(id);
    if (id === toId) setToId("");
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!toId) errs.to = "Choose the branch to send to";
    if (qty === "" || !Number.isInteger(n) || n < 1) errs.qty = "Enter a whole number, 1 or more";
    else if (n > available) errs.qty = `Only ${available} in stock at ${name(fromId)}`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ productId: product.id, fromId, toId, qty: n, note: note.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-title"
    >
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="transfer-title" className="text-lg font-bold text-slate-900">Transfer stock</h2>
            <p className="text-sm text-slate-500">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`rounded-lg p-2 text-slate-500 hover:bg-slate-100 ${focus}`}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">From</span>
              <select value={fromId} onChange={(e) => changeFrom(e.target.value)} disabled={sources.length === 1} className={field}>
                {sources.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <ArrowRight size={18} className="mb-2.5 text-slate-400" />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">To</span>
              <select value={toId} onChange={(e) => { setToId(e.target.value); setErrors((er) => ({ ...er, to: undefined })); }} className={field}>
                <option value="">Select branch</option>
                {destinations.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          </div>
          {errors.to && <p className="-mt-2 text-xs text-rose-600">{errors.to}</p>}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Quantity (up to {available})</span>
            <input type="number" min="1" max={available} step="1" value={qty} onChange={(e) => { setQty(e.target.value); setErrors((er) => ({ ...er, qty: undefined })); }} className={field} placeholder="0" />
            {errors.qty && <span className="mt-1 block text-xs text-rose-600">{errors.qty}</span>}
          </label>

          <div className="space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>{name(fromId)}: <span className="font-semibold text-slate-900">{available}</span> → <span className="font-semibold text-teal-800">{qtyOk ? available - n : "?"}</span></p>
            {toId && <p>{name(toId)}: <span className="font-semibold text-slate-900">{product.stock[toId] ?? 0}</span> → <span className="font-semibold text-teal-800">{qtyOk ? (product.stock[toId] ?? 0) + n : "?"}</span></p>}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="e.g. Branch ran out, sending extra" />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>Transfer</button>
        </div>
      </form>
    </div>
  );
}