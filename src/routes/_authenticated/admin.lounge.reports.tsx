import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download } from "lucide-react";
import { getLoungeReports } from "@/lib/lounge-admin.functions";
import { bwp, PAYMENT_LABELS } from "@/lib/lounge-cart";

export const Route = createFileRoute("/_authenticated/admin/lounge/reports")({
  head: () => ({ meta: [{ title: "Sales reports — Engliton Lounge" }, { name: "robots", content: "noindex" }] }),
  component: LoungeReports,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function LoungeReports() {
  const load = useServerFn(getLoungeReports);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(iso(monthStart));
  const [to, setTo] = useState(iso(today));

  const { data, error, isLoading } = useQuery({
    queryKey: ["lounge-reports", from, to],
    queryFn: () => load({ data: { from, to } }),
  });

  function exportCsv() {
    if (!data) return;
    const rows: string[] = ["Section,Label,Count,Sales (BWP)"];
    data.by_day.forEach((d) => rows.push(`Day,${d.day},${d.orders},${d.sales.toFixed(2)}`));
    data.by_category.forEach((c) => rows.push(`Category,"${c.key}",${c.qty},${c.sales.toFixed(2)}`));
    data.by_item.forEach((i) => rows.push(`Item,"${i.key}",${i.qty},${i.sales.toFixed(2)}`));
    data.by_payment.forEach((p) =>
      rows.push(`Payment,"${PAYMENT_LABELS[p.key] ?? p.key}",${p.qty},${p.sales.toFixed(2)}`),
    );
    data.orders_list.forEach((o) =>
      rows.push(`Order,"${o.reference} ${o.date} ${o.status} ${o.type}",1,${o.total.toFixed(2)}`),
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engliton-lounge-sales-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-red-400">{(error as Error).message}</p>;

  const maxDay = Math.max(1, ...(data?.by_day ?? []).map((d) => d.sales));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Sales reports</h1>
          <p className="mt-2 text-sm text-paper/55">Cancelled orders are excluded from sales totals.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 border border-ember/40 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <label className="text-[11px] uppercase tracking-[0.2em] text-paper/50">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-2 block border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
          />
        </label>
        <label className="text-[11px] uppercase tracking-[0.2em] text-paper/50">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-2 block border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
          />
        </label>
      </div>

      {isLoading && <p className="mt-8 text-sm text-paper/50">Crunching numbers…</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Sales" value={bwp(data?.summary.sales ?? 0)} />
        <Kpi label="Orders" value={String(data?.summary.orders ?? 0)} />
        <Kpi label="Average order" value={bwp(data?.summary.average_order ?? 0)} />
        <Kpi label="Delivery" value={String(data?.summary.delivery ?? 0)} />
        <Kpi label="Collection" value={String(data?.summary.pickup ?? 0)} />
        <Kpi label="Cancelled" value={String(data?.summary.cancelled ?? 0)} />
      </div>

      <section className="mt-12">
        <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Sales by day</h2>
        <div className="mt-4 space-y-2">
          {(data?.by_day ?? []).map((d) => (
            <div key={d.day} className="flex items-center gap-3 text-xs">
              <span className="w-24 text-paper/50">{d.day}</span>
              <div className="h-2 flex-1 bg-ember/10">
                <div className="h-full bg-ember" style={{ width: `${(d.sales / maxDay) * 100}%` }} />
              </div>
              <span className="w-28 text-right text-paper/70">{bwp(d.sales)}</span>
              <span className="w-14 text-right text-paper/40">{d.orders}x</span>
            </div>
          ))}
          {(data?.by_day.length ?? 0) === 0 && !isLoading && (
            <p className="text-sm text-paper/40">No orders in this range.</p>
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <Table
          title="Top items"
          head={["Item", "Qty", "Sales"]}
          rows={(data?.by_item ?? []).map((i) => [i.key, String(i.qty), bwp(i.sales)])}
        />
        <Table
          title="By category"
          head={["Category", "Qty", "Sales"]}
          rows={(data?.by_category ?? []).map((c) => [c.key, String(c.qty), bwp(c.sales)])}
        />
        <Table
          title="By payment method"
          head={["Method", "Orders", "Sales"]}
          rows={(data?.by_payment ?? []).map((p) => [PAYMENT_LABELS[p.key] ?? p.key, String(p.qty), bwp(p.sales)])}
        />
        <Table
          title="Orders in range"
          head={["Reference", "Date", "Total"]}
          rows={(data?.orders_list ?? []).map((o) => [
            `${o.reference} · ${o.status}`,
            o.date,
            bwp(o.total),
          ])}
        />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ember/15 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-paper/45">{label}</p>
      <p className="mt-2 font-display text-2xl text-ember-light">{value}</p>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">{title}</h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-ember/15 text-left text-[10px] uppercase tracking-[0.2em] text-paper/40">
            {head.map((h) => (
              <th key={h} className="py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-ember/10">
              {r.map((c, j) => (
                <td key={j} className={`py-2 ${j === 0 ? "text-paper/80" : "text-paper/60"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="py-3 text-paper/35">
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
