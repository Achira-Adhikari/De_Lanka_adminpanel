/* Small helpers shared by the orders page and its components */

export const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
export const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

export const STATUS = {
  pending: { label: "Pending delivery", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  received: { label: "Received", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-800 border-rose-300" },
};
export const STATUS_ORDER = ["pending", "received", "cancelled"];

export const lkr = (v) => "LKR " + Number(v).toLocaleString("en-US");
export const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/* <input type="date"> uses "YYYY-MM-DD" (local time) */
const pad = (n) => String(n).padStart(2, "0");
export const toInputDate = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const fromInputDate = (s) => new Date(`${s}T00:00:00`).getTime();

export const orderTotal = (o) => o.items.reduce((n, i) => n + i.qty * i.unitCost, 0);
export const orderQty = (o) => o.items.reduce((n, i) => n + i.qty, 0);

export const isOverdue = (o) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return o.status === "pending" && o.expectedDate < today.getTime();
};