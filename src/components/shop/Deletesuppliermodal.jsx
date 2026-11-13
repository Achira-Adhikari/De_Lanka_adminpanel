import { useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { focus } from "./orderUtils";

/* A supplier that already has orders cannot be deleted (it would break the order history).
   Set it to Inactive instead. */
export default function DeleteSupplierModal({ supplier, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const blocked = supplier.orderCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-supplier-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className={`rounded-lg p-2.5 ${blocked ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
            {blocked ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
          </span>
          <div>
            <h2 id="delete-supplier-title" className="text-lg font-bold text-slate-900">
              {blocked ? "Cannot delete this supplier" : "Delete this supplier?"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {blocked ? (
                <><span className="font-medium text-slate-700">{supplier.name}</span> has {supplier.orderCount} {supplier.orderCount === 1 ? "order" : "orders"} in your history. Edit the supplier and set it to Inactive instead.</>
              ) : (
                <><span className="font-medium text-slate-700">{supplier.name}</span> will be removed permanently. This cannot be undone.</>
              )}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>
            {blocked ? "Close" : "Cancel"}
          </button>
          {!blocked && (
            <button onClick={onConfirm} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 ${focus}`}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}