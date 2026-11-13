import { useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

/* `categories` is an array, so this works for one category or a bulk delete.
   A category that still has products cannot be deleted. */
export default function DeleteCategoryModal({ categories, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const many = categories.length > 1;
  const blocked = categories.filter((c) => c.productCount > 0);
  const subCount = categories.reduce((n, c) => n + c.subCategories.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        {blocked.length > 0 ? (
          <>
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-amber-100 p-2.5 text-amber-700"><AlertTriangle size={20} /></span>
              <div>
                <h2 id="delete-category-title" className="text-lg font-bold text-blue-950">Cannot delete yet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These categories still have products. Move or delete those products first:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {blocked.map((c) => (
                    <li key={c.id}><span className="font-medium">{c.name}</span> ({c.productCount} products)</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-rose-100 p-2.5 text-rose-700"><Trash2 size={20} /></span>
              <div>
                <h2 id="delete-category-title" className="text-lg font-bold text-blue-950">
                  {many ? `Delete ${categories.length} categories?` : "Delete this category?"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {many ? "These categories" : <span className="font-medium text-slate-700">{categories[0]?.name}</span>}
                  {subCount > 0 && ` and ${subCount} sub ${subCount === 1 ? "category" : "categories"}`} will be removed permanently. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                Cancel
              </button>
              <button onClick={onConfirm} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 ${focus}`}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}