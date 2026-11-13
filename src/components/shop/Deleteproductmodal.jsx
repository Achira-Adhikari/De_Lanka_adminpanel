import { useEffect } from "react";
import { Trash2 } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";

/* `products` is an array, so this works for one product or a bulk delete. */
export default function DeleteProductModal({ products, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const many = products.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-rose-100 p-2.5 text-rose-700"><Trash2 size={20} /></span>
          <div>
            <h2 id="delete-title" className="text-lg font-bold text-slate-900">
              {many ? `Delete ${products.length} products?` : "Delete this product?"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {many
                ? "These products will be removed permanently. This cannot be undone."
                : <><span className="font-medium text-slate-700">{products[0]?.name}</span> will be removed permanently. This cannot be undone.</>}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focus}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 ${focus}`}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}