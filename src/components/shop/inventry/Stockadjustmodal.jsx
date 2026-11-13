import { useEffect, useState } from "react";
import { X } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-100";

const MODES = [
  { id: "add", label: "Add stock" },
  { id: "remove", label: "Remove stock" },
  { id: "set", label: "Set exact count" },
];
const REASONS = {
  add: ["Stock found", "Returned by customer", "Correction", "Other"],
  remove: ["Damaged", "Lost or stolen", "Expired", "Correction", "Other"],
  set: ["Stock count", "Correction"],
};

/**
 * Change the stock of one product in one branch and say why (it goes into the stock history).
 * `editableIds` = branches this user may change (admin: all, manager: only their own).
 * Calls onSave({ productId, branchId, change, reason, note }) where `change` is + or -.
 */
export default function StockAdjustModal({ product, branches, editableIds, startBranchId, onClose, onSave }) {
  const options = branches.filter((b) => editableIds.includes(b.id));
  const [branchId, setBranchId] = useState(() => (options.some((b) => b.id === startBranchId) ? startBranchId : options[0]?.id ?? ""));
  const [mode, setMode] = useState("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(REASONS.add[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = product.stock[branchId] ?? 0;
  const n = Number(qty);
  const qtyOk = qty !== "" && Number.isInteger(n) && n >= (mode === "set" ? 0 : 1);
  const next = !qtyOk ? null : mode === "add" ? current + n : mode === "remove" ? current - n : n;

  const changeMode = (m) => {
    setMode(m);
    setReason(REASONS[m][0]);
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!qtyOk) return setError(mode === "set" ? "Enter a whole number, 0 or more" : "Enter a whole number, 1 or more");
    if (next < 0) return setError(`You cannot remove more than the ${current} in stock`);
    if (next === current) return setError("The stock would not change");
    onSave({ productId: product.id, branchId, change: next - current, reason, note: note.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-title"
    >
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="adjust-title" className="text-lg font-bold text-slate-900">Adjust stock</h2>
            <p className="text-sm text-slate-500">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`rounded-lg p-2 text-slate-500 hover:bg-slate-100 ${focus}`}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Branch</span>
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setError(""); }} disabled={options.length === 1} className={field}>
              {options.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>

          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Type of change">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => changeMode(m.id)}
                className={`flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition ${focus} ${mode === m.id ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{mode === "set" ? "New count" : "Quantity"}</span>
              <input type="number" min={mode === "set" ? 0 : 1} step="1" value={qty} onChange={(e) => { setQty(e.target.value); setError(""); }} className={field} placeholder="0" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Reason</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
                {REASONS[mode].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Stock in {branches.find((b) => b.id === branchId)?.name}:{" "}
            <span className="font-semibold text-slate-900">{current}</span>
            {" → "}
            <span className="font-semibold text-teal-800">{next === null ? "?" : next}</span>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Anything worth remembering about this change" />
          </label>

          {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>Cancel</button>
          <button type="submit" className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 ${focus}`}>Save change</button>
        </div>
      </form>
    </div>
  );
}