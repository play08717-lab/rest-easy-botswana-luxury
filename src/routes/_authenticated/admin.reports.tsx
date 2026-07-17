import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReport } from "@/lib/admin.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

function ReportsPage() {
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const { data, isFetching } = useQuery({
    queryKey: ["admin-report", start, end],
    queryFn: () => getReport({ data: { start, end } }),
  });

  const exportCsv = (rows: Array<Record<string, unknown>>, filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const flatPayments = (data?.payments ?? []).map((p) => ({
    date: p.recorded_at, amount_bwp: p.amount_bwp, method: p.method, is_refund: p.is_refund, booking_id: p.booking_id,
  }));
  const flatBookings = (data?.bookings ?? []).map((b) => ({
    reference: b.reference, guest: b.guest_name, apartment: Array.isArray(b.apartments) ? b.apartments[0]?.name : b.apartments?.name,
    check_in: b.check_in, check_out: b.check_out, nights: b.nights, total_bwp: b.total_bwp, status: b.status,
  }));

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Reports</h1>

      <div className="flex flex-wrap items-end gap-4 mb-8 bg-dark border border-gold/15 p-5">
        <label className="text-[10px] uppercase tracking-[0.2em] text-paper/60">Start
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="block mt-1 bg-paper/5 border border-gold/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-[10px] uppercase tracking-[0.2em] text-paper/60">End
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="block mt-1 bg-paper/5 border border-gold/20 px-3 py-2 text-sm" />
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={() => exportCsv(flatPayments, `payments-${start}-to-${end}.csv`)} className="bg-gold text-dark px-4 py-2 text-[10px] uppercase tracking-[0.2em]">Export Payments CSV</button>
          <button onClick={() => exportCsv(flatBookings, `bookings-${start}-to-${end}.csv`)} className="border border-gold/30 text-gold px-4 py-2 text-[10px] uppercase tracking-[0.2em]">Export Bookings CSV</button>
          <button onClick={() => window.print()} className="border border-gold/30 text-paper/70 px-4 py-2 text-[10px] uppercase tracking-[0.2em]">Print / PDF</button>
        </div>
      </div>

      {isFetching && <p className="text-paper/50 text-sm">Loading…</p>}

      {data && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-3">
            <Kpi label="Total revenue" value={`P${data.revenue.toFixed(2)}`} accent />
            <Kpi label="Bookings" value={String(data.bookings.length)} />
            <Kpi label="Payments" value={String(data.payments.length)} />
            <Kpi label="Methods" value={String(Object.keys(data.byMethod).length)} />
          </div>

          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">By payment method</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {Object.entries(data.byMethod).map(([m, v]) => (
                <div key={m} className="bg-dark border border-gold/15 p-4">
                  <p className="text-xs text-paper/50">{m.replace("_", " ")}</p>
                  <p className="font-display text-xl mt-1">P{v.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-dark border border-gold/15 p-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-paper/50">{label}</p>
      <p className={`font-display text-2xl mt-2 ${accent ? "text-gold" : "text-paper"}`}>{value}</p>
    </div>
  );
}
