import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { getLoungeBoard, updateLoungeOrder } from "@/lib/lounge-admin.functions";
import { bwp, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/lounge-cart";

export const Route = createFileRoute("/_authenticated/admin/lounge/")({
  head: () => ({ meta: [{ title: "Order board — Engliton Lounge" }, { name: "robots", content: "noindex" }] }),
  component: OrderBoard,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

const COLUMNS = [
  { status: "received", label: "New" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "out_for_delivery", label: "Out for delivery" },
] as const;

const NEXT: Record<string, string> = {
  received: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
  out_for_delivery: "completed",
};

function OrderBoard() {
  const qc = useQueryClient();
  const boardFn = useServerFn(getLoungeBoard);
  const updateFn = useServerFn(updateLoungeOrder);
  const [busyId, setBusyId] = useState("");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["lounge-board"],
    queryFn: () => boardFn(),
    refetchInterval: 20_000,
  });

  async function move(orderId: string, status: string, reason?: string) {
    setBusyId(orderId);
    try {
      await updateFn({ data: { order_id: orderId, status: status as never, cancelled_reason: reason } });
      await qc.invalidateQueries({ queryKey: ["lounge-board"] });
      toast.success(`Order moved to ${STATUS_LABELS[status] ?? status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
    setBusyId("");
  }

  if (error) return <p className="text-red-400">{(error as Error).message}</p>;

  const k = data?.kpis;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Live order board</h1>
          <p className="mt-2 text-sm text-paper/55">Auto-refreshes every 20 seconds.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 border border-ember/40 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Orders today" value={String(k?.today_orders ?? 0)} />
        <Kpi label="Awaiting action" value={String(k?.pending ?? 0)} />
        <Kpi label="In kitchen" value={String(k?.preparing ?? 0)} />
        <Kpi label="Ready / on route" value={String(k?.ready ?? 0)} />
        <Kpi label="Completed today" value={String(k?.completed_today ?? 0)} />
        <Kpi label="Sales today" value={bwp(k?.today_sales ?? 0)} />
        <Kpi label="Sales this month" value={bwp(k?.month_sales ?? 0)} />
        <Kpi label="Delivery today" value={String(k?.delivery_today ?? 0)} />
        <Kpi label="Collection today" value={String(k?.pickup_today ?? 0)} />
        <Kpi label="Cancelled today" value={String(k?.cancelled_today ?? 0)} />
      </div>

      {isLoading && <p className="mt-10 text-sm text-paper/50">Loading orders…</p>}

      <div className="mt-10 grid gap-4 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const orders = (data?.orders ?? []).filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="border border-ember/15 p-3">
              <header className="flex items-center justify-between border-b border-ember/10 pb-2">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper/60">{col.label}</h2>
                <span className="text-[11px] text-ember">{orders.length}</span>
              </header>
              <div className="mt-3 space-y-3">
                {orders.length === 0 && <p className="text-xs text-paper/35">Nothing here.</p>}
                {orders.map((o) => (
                  <article key={o.id} className="border border-ember/20 bg-ember/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-[0.15em] text-ember-light">{o.reference}</span>
                      <span className="text-xs font-semibold">{bwp(o.total_bwp)}</span>
                    </div>
                    <p className="mt-2 text-sm">{o.customer_name}</p>
                    <p className="text-xs text-paper/50">{o.customer_phone}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-paper/45">
                      {o.order_type === "delivery"
                        ? `Delivery${o.apartment_name ? ` · ${o.apartment_name}` : ""}`
                        : `Collection${o.pickup_time ? ` · ${o.pickup_time}` : ""}`}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-paper/65">
                      {o.items.map((i, idx) => (
                        <li key={idx}>
                          {i.quantity} × {i.item_name}
                          {i.extras.length > 0 && (
                            <span className="block text-ember-light">+ {i.extras.map((e) => e.name).join(", ")}</span>
                          )}
                          {i.instructions && <span className="block text-paper/40">“{i.instructions}”</span>}
                        </li>
                      ))}
                    </ul>
                    {o.customer_notes && <p className="mt-2 text-xs text-paper/45">Note: {o.customer_notes}</p>}
                    <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-paper/40">
                      {PAYMENT_LABELS[o.payment_method] ?? o.payment_method} · {o.payment_status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.status === "ready" && o.order_type === "delivery" ? (
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => move(o.id, "out_for_delivery")}
                          className="bg-ember px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark hover:bg-ember-light disabled:opacity-50"
                        >
                          Send out
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => move(o.id, NEXT[o.status] ?? "completed")}
                          className="bg-ember px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark hover:bg-ember-light disabled:opacity-50"
                        >
                          {STATUS_LABELS[NEXT[o.status] ?? "completed"]}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => {
                          const reason = window.prompt("Reason for cancelling?") ?? "";
                          if (reason) move(o.id, "cancelled", reason);
                        }}
                        className="border border-paper/20 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-paper/60 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {(data?.popular?.length ?? 0) > 0 && (
        <section className="mt-12 border-t border-ember/15 pt-8">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Most ordered this month</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {data?.popular.map((p) => (
              <span key={p.name} className="border border-ember/20 px-4 py-2 text-xs text-paper/70">
                {p.name} · <span className="text-ember-light">{p.qty}</span>
              </span>
            ))}
          </div>
        </section>
      )}
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
