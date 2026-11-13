import { useEffect, useState } from "react";
import { X, Phone, Mail, Pencil, Lock } from "lucide-react";
import { STATUS, lkr, fmtDate, orderTotal, orderQty, isOverdue } from "./orderUtils";

// local blue focus ring (replaces the `focus` that used to come from ./orderUtils)
const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children}</div>
    </div>
  );
}

/**
 * Order details. `canManage` is true when the user may change this order
 * (admin: any order, manager: only orders of their own branch).
 * Receiving an order adds its items to the stock of the delivery branch.
 */
export default function OrderDetailsModal({ order, supplier, branchName, canManage, onClose, onEdit, onReceive, onCancel }) {
  const [confirming, setConfirming] = useState(null); // "receive" | "cancel" | null

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const s = STATUS[order.status];
  const pending = order.status === "pending";
  const total = orderTotal(order);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071433]/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header (navy → blue gradient, same as the other admin modals) */}
        <div className="flex items-start justify-between bg-gradient-to-b from-[#071433] via-[#0A1F52] to-[#0E2D75] px-5 py-4 text-white">
          <div>
            <h2 id="order-details-title" className="flex flex-wrap items-center gap-3 text-lg font-bold">
              {order.code}
              <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>
            </h2>
            <p className="text-sm text-blue-100">Placed on {fmtDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Supplier">
              <p className="font-semibold">{supplier?.name ?? "Unknown supplier"}</p>
              {supplier && (
                <div className="mt-1 space-y-0.5 text-slate-600">
                  <p>{supplier.contactPerson}</p>
                  <p className="flex items-center gap-1.5"><Phone size={13} className="text-blue-600" /> {supplier.phone}</p>
                  {supplier.email && <p className="flex items-center gap-1.5"><Mail size={13} className="text-blue-600" /> {supplier.email}</p>}
                </div>
              )}
            </Info>
            <div className="space-y-4">
              <Info label="Deliver to branch"><span className="font-semibold">{branchName}</span></Info>
              <Info label="Expected delivery">
                {fmtDate(order.expectedDate)}
                {isOverdue(order) && <span className="ml-2 text-xs font-medium text-rose-600">Overdue</span>}
              </Info>
              {order.status === "received" && order.receivedAt && <Info label="Received on">{fmtDate(order.receivedAt)}</Info>}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto rounded-lg border border-blue-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-blue-50 text-xs text-blue-900">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-right font-medium">Unit cost</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {order.items.map((i) => (
                  <tr key={i.productId}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{i.name}</td>
                    <td className="px-4 py-2.5 text-right">{i.qty}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">{lkr(i.unitCost)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-slate-900">{lkr(i.qty * i.unitCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-blue-100 bg-blue-50/50">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{order.items.length} items</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{orderQty(order)}</td>
                  <td />
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-blue-950">{lkr(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.note && <Info label="Note"><p className="whitespace-pre-line text-slate-700">{order.note}</p></Info>}
        </div>

        {/* Footer */}
        <div className="border-t border-blue-100 bg-blue-50/40 px-5 py-3">
          {!pending ? (
            <div className="flex justify-end">
              <button onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Close</button>
            </div>
          ) : !canManage ? (
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-slate-500"><Lock size={14} className="text-blue-300" /> View only. This order is for another branch.</p>
              <button onClick={onClose} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Close</button>
            </div>
          ) : confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">
                {confirming === "receive"
                  ? <>Mark as received? <span className="font-semibold">{orderQty(order)} units</span> will be added to the {branchName} stock.</>
                  : "Cancel this order? This cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirming(null)} className={`rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>Back</button>
                {confirming === "receive" ? (
                  <button onClick={() => onReceive(order.id)} className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>Yes, received</button>
                ) : (
                  <button onClick={() => onCancel(order.id)} className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 ${focus}`}>Cancel order</button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => setConfirming("cancel")} className={`rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 ${focus}`}>Cancel order</button>
              <button onClick={() => onEdit(order)} className={`flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 ${focus}`}>
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => setConfirming("receive")} className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 ${focus}`}>Mark as received</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}