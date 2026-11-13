import { useMemo, useState } from "react";
import {
  Download, TrendingUp, TrendingDown, Banknote, UserPlus, Briefcase, Handshake, Star,
} from "lucide-react";

/* =====================================================================
   DEMO DATA: replace `buildData` with your API response.
   Shape it returns: { labels, revenue:{jobs,shop}, users:{customers,workers},
   jobsPosted, categories, products, workers }
   ===================================================================== */
const RANGES = {
  "7d": { label: "7 days", n: 7, step: 1, unit: "day", factor: 1 },
  "30d": { label: "30 days", n: 30, step: 1, unit: "day", factor: 1 },
  "90d": { label: "90 days", n: 13, step: 7, unit: "week", factor: 7 },
  "12m": { label: "12 months", n: 12, step: 0, unit: "month", factor: 30 },
};

const wave = (n, base, trend, seed) =>
  Array.from({ length: n }, (_, i) =>
    Math.round(base * (1 + trend * (i / n)) * (1 + 0.18 * Math.sin(i * 1.7 + seed)))
  );

function makeLabels({ n, step, unit }) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const back = n - 1 - i;
    const d = new Date(now);
    if (unit === "month") {
      d.setMonth(now.getMonth() - back);
      return d.toLocaleDateString("en-GB", { month: "short" });
    }
    d.setDate(now.getDate() - back * step);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  });
}

function buildData(key) {
  const r = RANGES[key];
  const f = r.factor;
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const users = { customers: wave(r.n, 4 * f, 0.5, 1), workers: wave(r.n, 1.4 * f, 0.35, 2) };
  const jobsPosted = sum(wave(r.n, 6 * f, 0.3, 3));
  return {
    labels: makeLabels(r),
    revenue: { jobs: wave(r.n, 9000 * f, 0.3, 0.5), shop: wave(r.n, 14000 * f, 0.45, 2.2) },
    users,
    jobsPosted,
    categories: [
      { name: "Electrical", value: Math.round(jobsPosted * 0.26) },
      { name: "Plumbing", value: Math.round(jobsPosted * 0.21) },
      { name: "AC & cooling", value: Math.round(jobsPosted * 0.17) },
      { name: "Carpentry", value: Math.round(jobsPosted * 0.13) },
      { name: "Painting", value: Math.round(jobsPosted * 0.12) },
      { name: "Cleaning", value: Math.round(jobsPosted * 0.11) },
    ],
    products: [
      { name: "Cordless drill kit", units: Math.round(1.1 * f * 3), revenue: Math.round(f * 3 * 1.1 * 18500) },
      { name: "PVC pipe set (20 pcs)", units: Math.round(f * 3 * 1.6), revenue: Math.round(f * 3 * 1.6 * 4200) },
      { name: "Safety gloves & helmet", units: Math.round(f * 3 * 2.2), revenue: Math.round(f * 3 * 2.2 * 2600) },
      { name: "LED panel light 18W", units: Math.round(f * 3 * 2.8), revenue: Math.round(f * 3 * 2.8 * 1900) },
    ],
    workers: [
      { name: "Dilshan Gamage", trade: "Electrician", jobs: Math.max(2, Math.round(f * 0.9)), rating: 4.9, earned: Math.round(f * 0.9 * 24000) },
      { name: "Kasun Fernando", trade: "Plumber", jobs: Math.max(2, Math.round(f * 0.8)), rating: 4.8, earned: Math.round(f * 0.8 * 21000) },
      { name: "Ruwan Pathirana", trade: "AC technician", jobs: Math.max(1, Math.round(f * 0.6)), rating: 4.8, earned: Math.round(f * 0.6 * 30000) },
      { name: "Sunil Jayamaha", trade: "Carpenter", jobs: Math.max(1, Math.round(f * 0.5)), rating: 4.7, earned: Math.round(f * 0.5 * 26000) },
    ],
  };
}

/* ---------- helpers ---------- */
const sum = (a) => a.reduce((s, v) => s + v, 0);
const lkr = (v) => "LKR " + Math.round(v).toLocaleString("en-US");
const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? Math.round(v / 1e3) + "k" : String(v));
function trend(values) {
  const t = Math.max(1, Math.floor(values.length / 3));
  const a = sum(values.slice(0, t)) / t;
  const b = sum(values.slice(-t)) / t;
  return a === 0 ? 0 : ((b - a) / a) * 100;
}
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  return Math.ceil((v * 1.05) / (p / 2)) * (p / 2);
}

/* ---------- Line chart (pure SVG, no chart library needed) ---------- */
function LineChart({ labels, series, format = String }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 250, L = 46, R = 14, T = 12, B = 28;
  const n = labels.length;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
  const x = (i) => L + (i * (W - L - R)) / (n - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => max * p);
  const every = Math.ceil(n / 6);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.min(n - 1, Math.max(0, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? "" : "3 4"} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{short(t)}</text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % every === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{l}</text>
          ) : null
        )}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`);
          return (
            <g key={s.name}>
              <polygon points={`${x(0)},${y(0)} ${pts.join(" ")} ${x(n - 1)},${y(0)}`} fill={s.color} opacity="0.08" />
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#94a3b8" strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 min-w-[150px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${Math.min(82, Math.max(18, (x(hover) / W) * 100))}%` }}
        >
          <p className="mb-1 font-semibold text-slate-900">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-4 text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}
              </span>
              <span className="font-semibold text-slate-900">{format(s.values[hover])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- UI pieces ---------- */
function Panel({ title, sub, className = "", children }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Delta({ value }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon size={14} /> {Math.abs(value).toFixed(1)}% over this period
    </p>
  );
}

const th = "px-3 py-3 font-medium";
const td = "px-3 py-3";

/* ---------- Page ---------- */
export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const d = useMemo(() => buildData(range), [range]);

  const revTotal = d.revenue.jobs.map((v, i) => v + d.revenue.shop[i]);
  const newUsers = d.users.customers.map((v, i) => v + d.users.workers[i]);
  const hired = Math.round(d.jobsPosted * 0.61);
  const funnel = [
    { label: "Jobs posted", value: d.jobsPosted, bar: "bg-teal-700" },
    { label: "Received offers", value: Math.round(d.jobsPosted * 0.82), bar: "bg-teal-600" },
    { label: "Worker hired", value: hired, bar: "bg-amber-500" },
    { label: "Completed", value: Math.round(d.jobsPosted * 0.54), bar: "bg-emerald-600" },
  ];
  const topCat = d.categories[0].value;

  const kpis = [
    { label: "Total revenue", value: lkr(sum(revTotal)), delta: trend(revTotal), icon: Banknote, tone: "bg-teal-600", edge: "border-t-teal-600" },
    { label: "New users", value: sum(newUsers).toLocaleString(), delta: trend(newUsers), icon: UserPlus, tone: "bg-amber-500", edge: "border-t-amber-500" },
    { label: "Jobs posted", value: d.jobsPosted.toLocaleString(), delta: trend(newUsers) * 0.6, icon: Briefcase, tone: "bg-sky-600", edge: "border-t-sky-600" },
    { label: "Hire rate", value: "61%", delta: 3.2, icon: Handshake, tone: "bg-emerald-600", edge: "border-t-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">How jobs, users and the shop are performing</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Date range">
            {Object.entries(RANGES).map(([k, r]) => (
              <button
                key={k}
                onClick={() => setRange(k)}
                aria-pressed={range === k}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  range === k ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, delta, icon: Icon, tone, edge }) => (
          <div key={label} className={`rounded-xl border border-t-4 border-slate-200 bg-white p-5 shadow-sm ${edge}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
              </div>
              <span className={`rounded-lg p-2.5 text-white ${tone}`}><Icon size={20} /></span>
            </div>
            <Delta value={delta} />
          </div>
        ))}
      </div>

      {/* Revenue + funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Revenue" sub="Job commissions and shop sales" className="lg:col-span-2">
          <LineChart
            labels={d.labels}
            format={lkr}
            series={[
              { name: "Shop sales", color: "#f59e0b", values: d.revenue.shop },
              { name: "Job commissions", color: "#0f766e", values: d.revenue.jobs },
            ]}
          />
        </Panel>

        <Panel title="Job funnel" sub="Where jobs drop off">
          <ul className="space-y-4">
            {funnel.map((f) => (
              <li key={f.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-900">{f.value.toLocaleString()}</span> ({Math.round((f.value / d.jobsPosted) * 100)}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${f.bar}`} style={{ width: `${(f.value / d.jobsPosted) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Users + categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="User growth" sub="New sign-ups by type" className="lg:col-span-2">
          <LineChart
            labels={d.labels}
            series={[
              { name: "Customers", color: "#0f766e", values: d.users.customers },
              { name: "Workers", color: "#f59e0b", values: d.users.workers },
            ]}
          />
        </Panel>

        <Panel title="Popular job categories" sub="Jobs posted in this period">
          <ul className="space-y-4">
            {d.categories.map((c) => (
              <li key={c.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{c.name}</span>
                  <span className="font-semibold text-slate-900">{c.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${(c.value / topCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top selling products" sub="By revenue">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-teal-50 text-xs text-teal-900">
                <tr>
                  <th className={`${th} rounded-l-lg`}>Product</th>
                  <th className={th}>Units</th>
                  <th className={`${th} rounded-r-lg`}>Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.products.map((p) => (
                  <tr key={p.name}>
                    <td className={`${td} font-medium text-slate-900`}>{p.name}</td>
                    <td className={td}>{p.units}</td>
                    <td className={td}>{lkr(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Top workers" sub="By earnings from completed jobs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-teal-50 text-xs text-teal-900">
                <tr>
                  <th className={`${th} rounded-l-lg`}>Worker</th>
                  <th className={th}>Jobs</th>
                  <th className={th}>Rating</th>
                  <th className={`${th} rounded-r-lg`}>Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.workers.map((w) => (
                  <tr key={w.name}>
                    <td className={td}>
                      <span className="block font-medium text-slate-900">{w.name}</span>
                      <span className="block text-xs text-slate-500">{w.trade}</span>
                    </td>
                    <td className={td}>{w.jobs}</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" /> {w.rating}
                      </span>
                    </td>
                    <td className={td}>{lkr(w.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}