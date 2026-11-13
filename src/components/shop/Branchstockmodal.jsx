import { useEffect, useState } from "react";
import { X, Lock } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

const stockState = (n) =>
  n === 0
    ? { label: "Out of stock", cls: "bg-rose-100 text-rose-800 border-rose-300" }
    : n <= 5
    ? { label: "Low stock", cls: "bg-amber-100 text-amber-800 border-amber-300" }
    : { label: "In stock", cls: "bg-sky-100 text-sky-800 border-sky-300" };

/**
 * Stock of one product in every branch.
 *  - Branches in `editableIds` can be changed.
 *  - All other branches are shown as view only (with a lock).
 *
 * Admin   -> editableIds = all branch ids
 * Manager -> editableIds = [their own branch id]
 */
export default function BranchStockModal({ product, branches, editableIds, myBranchId, onClose, onSave }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(branches.map((b) => [b.id, String(product.stock[b.id] ?? 0)]))
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canEdit = editableIds.length > 0;
  const total = branches.reduce((sum, b) => sum + (Number(draft[b.id]) || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    editableIds.forEach((id) => {
      const n = Number(draft[id]);
      if (draft[id] === "" || n < 0 || !Number.isInteger(n)) errs[id] = "Whole number, 0 or more";
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Only send the branches this user is allowed to change
    const changes = Object.fromEntries(editableIds.map((id) => [id, Number(draft[id])]));
    onSave(product.id, changes);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-stock-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-start justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="branch-stock-title" className="text-lg font-bold">{product.name}</h2>
            <p className="text-sm text-blue-100">
              {canEdit && editableIds.length < branches.length
                ? "You can update your own branch. Other branches are view only."
                : canEdit
                ? "Update the stock for each branch"
                : "Stock in each branch"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        <ul className="divide-y divide-blue-50 overflow-y-auto px-5">
          {branches.map((b) => {
            const editable = editableIds.includes(b.id);
            const st = stockState(Number(draft[b.id]) || 0);
            return (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    {b.name}
                    {b.id === myBranchId && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Your branch</span>
                    )}
                  </p>
                  <span className={`mt-1 inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>

                {editable ? (
                  <div className="text-right">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`${b.name} stock`}
                      value={draft[b.id]}
                      onChange={(e) => setDraft((d) => ({ ...d, [b.id]: e.target.value }))}
                      className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    {errors[b.id] && <p className="mt-1 text-xs text-rose-600">{errors[b.id]}</p>}
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-slate-600" title="View only">
                    <Lock size={14} className="text-blue-300" />
                    <span className="w-16 text-right font-semibold text-slate-900">{draft[b.id]}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          <p className="text-sm text-slate-500">Total: <span className="font-semibold text-blue-950">{total}</span></p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
              {canEdit ? "Cancel" : "Close"}
            </button>
            {canEdit && (
              <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>
                Save stock
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}