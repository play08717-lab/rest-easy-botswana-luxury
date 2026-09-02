import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Check, Clock } from "lucide-react";
import { getLoungeOrderStatus } from "@/lib/lounge.functions";
import { bwp, PAYMENT_LABELS, STATUS_FLOW, STATUS_LABELS } from "@/lib/lounge-cart";

const searchSchema = z.object({ ref: z.string().optional() });

type OrderStatus = Awaited<ReturnType<typeof getLoungeOrderStatus>>;

export const Route = createFileRoute("/lounge/order")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Track your order — Engliton Lounge" },
      {
        name: "description",
        content: "Check the live status of your Engliton Lounge order using your order number and phone number.",
      },
      { property: "og:title", content: "Track your Engliton Lounge order" },
      { property: "og:description", content: "Live kitchen status for collection and delivery orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const { ref } = Route.useSearch();
  const lookup = useServerFn(getLoungeOrderStatus);
  const [reference, setReference] = useState(ref ?? "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref) setReference(ref);
  }, [ref]);

  // Refresh a loaded order every 30s so the kitchen status stays current.
  useEffect(() => {
    if (!result) return;
    const id = setInterval(async () => {
      try {
        setResult(await lookup({ data: { reference, phone } }));
      } catch {
        /* keep showing the last known state */
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [result, reference, phone, lookup]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResult(await lookup({ data: { reference: reference.trim(), phone: phone.trim() } }));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Lookup failed");
    }
    setBusy(false);
  }

  const status = result?.order.status ?? "";
  const flow = STATUS_FLOW.filter(
    (s) => s !== "out_for_delivery" || result?.order.order_type === "delivery",
  );
  const activeIndex = flow.indexOf(status as (typeof STATUS_FLOW)[number]);

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">Order status</p>
        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
          Where's <span className="italic text-ember-light">my food?</span>
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-paper/65">
          Enter your order number and the phone number you ordered with. The status refreshes automatically.
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
          Order number
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
            placeholder="EL-00045"
            className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-ember/60 focus:outline-none"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
          Phone number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+267 …"
            className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-ember/60 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="self-end bg-ember px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light disabled:opacity-50"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </form>

      {error && <p className="mt-6 text-sm text-ember-light">{error}</p>}

      {result && (
        <section className="mt-12 max-w-3xl border border-ember/20 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-ember">{result.order.reference}</p>
              <h2 className="mt-2 font-display text-3xl">
                {STATUS_LABELS[result.order.status] ?? result.order.status}
              </h2>
              <p className="mt-2 text-sm text-paper/60">
                {result.order.order_type === "delivery"
                  ? `Delivery${result.apartment_name ? ` to ${result.apartment_name}` : ""}`
                  : "Collection at the lounge"}
                {result.order.pickup_time ? ` · ${result.order.pickup_time}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ember-light">{bwp(result.order.total_bwp)}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-paper/45">
                {PAYMENT_LABELS[result.order.payment_method] ?? result.order.payment_method} ·{" "}
                {result.order.payment_status}
              </p>
            </div>
          </div>

          {result.order.status === "cancelled" ? (
            <p className="mt-6 border border-ember/30 bg-ember/5 p-4 text-sm text-paper/70">
              This order was cancelled. {result.order.cancelled_reason ?? ""}
            </p>
          ) : (
            <ol className="mt-8 space-y-3">
              {flow.map((s, i) => {
                const done = activeIndex >= i;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                        done ? "border-ember bg-ember text-dark" : "border-paper/20 text-paper/40"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={`text-sm ${done ? "text-paper" : "text-paper/45"}`}>{STATUS_LABELS[s]}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-8 border-t border-ember/15 pt-6">
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Your order</h3>
            <ul className="mt-4 space-y-3">
              {result.items.map((it, idx) => (
                <li key={idx} className="flex items-start justify-between gap-4 text-sm">
                  <span>
                    {it.quantity} × {it.item_name}
                    {Array.isArray(it.extras) && it.extras.length > 0 && (
                      <span className="block text-xs text-ember-light">
                        + {(it.extras as Array<{ name: string }>).map((e) => e.name).join(", ")}
                      </span>
                    )}
                    {it.instructions && <span className="block text-xs text-paper/45">“{it.instructions}”</span>}
                  </span>
                  <span className="whitespace-nowrap">{bwp(Number(it.line_total_bwp))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-paper/55">Subtotal</dt>
                <dd>{bwp(result.order.subtotal_bwp)}</dd>
              </div>
              {Number(result.order.delivery_fee_bwp) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-paper/55">Delivery</dt>
                  <dd>{bwp(result.order.delivery_fee_bwp)}</dd>
                </div>
              )}
              {Number(result.order.discount_bwp) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-paper/55">Discount</dt>
                  <dd>− {bwp(result.order.discount_bwp)}</dd>
                </div>
              )}
            </dl>
          </div>

          {result.events.length > 0 && (
            <div className="mt-8 border-t border-ember/15 pt-6">
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Kitchen timeline</h3>
              <ul className="mt-4 space-y-2 text-xs text-paper/55">
                {result.events.map((ev, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-ember" />
                    {STATUS_LABELS[ev.status] ?? ev.status} ·{" "}
                    {new Date(ev.created_at).toLocaleString("en-GB", { hour12: false })}
                    {ev.note ? ` · ${ev.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="mt-12 flex flex-wrap gap-4 border-t border-ember/15 pt-8">
        <Link
          to="/lounge/menu"
          className="bg-ember px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          Order again
        </Link>
        <Link
          to="/lounge"
          className="border border-ember/40 px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark"
        >
          Back to the lounge
        </Link>
      </div>
    </>
  );
}
