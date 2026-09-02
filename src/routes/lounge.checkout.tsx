import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ShoppingBag } from "lucide-react";
import { loungeContextQuery } from "./lounge";
import { placePickupOrder, placeGuestOrder, getMyDeliverableBookings } from "@/lib/lounge.functions";
import { bwp, lineTotal, useLoungeCart, whatsappOrderLink, PAYMENT_LABELS } from "@/lib/lounge-cart";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/lounge/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Engliton Lounge" },
      {
        name: "description",
        content: "Review your Engliton Lounge basket and choose collection or delivery to Rest Easy Apartment in Rakops.",
      },
      { property: "og:title", content: "Checkout — Engliton Lounge" },
      { property: "og:description", content: "Collection or delivery, paid on arrival or by transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { data } = useSuspenseQuery(loungeContextQuery);
  const settings = data.settings;
  const navigate = useNavigate();
  const { user } = useSession();
  const { lines, setQuantity, remove, clear, subtotal, count, hydrated } = useLoungeCart();

  const pickupFn = useServerFn(placePickupOrder);
  const guestFn = useServerFn(placeGuestOrder);
  const bookingsFn = useServerFn(getMyDeliverableBookings);

  const bookings = useQuery({
    queryKey: ["lounge-deliverable-bookings"],
    queryFn: () => bookingsFn(),
    enabled: !!user,
  });

  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [bookingId, setBookingId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [promo, setPromo] = useState("");
  const [payment, setPayment] = useState(settings?.payment_methods?.[0] ?? "cash");
  const [busy, setBusy] = useState(false);

  const deliveryFee = orderType === "delivery" ? Number(settings?.delivery_fee_bwp ?? 0) : 0;
  const minimum = Number(settings?.minimum_order_bwp ?? 0);
  const belowMinimum = orderType === "delivery" && subtotal < minimum;
  const canDeliver = !!settings?.delivery_enabled;
  const wa = whatsappOrderLink(settings?.whatsapp_number ?? "", lines, { orderType, name, note: notes });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) return;
    setBusy(true);
    const payload = {
      lines: lines.map((l) => ({
        item_id: l.item_id,
        quantity: l.quantity,
        extra_ids: l.extras.map((x) => x.id),
        instructions: l.instructions || null,
      })),
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      customer_notes: notes || null,
      payment_method: payment,
      promo_code: promo.trim() || null,
    };
    try {
      const order =
        user
          ? await guestFn({
              data: {
                ...payload,
                order_type: orderType,
                pickup_time: pickupTime || null,
                booking_id: orderType === "delivery" ? bookingId || null : null,
                delivery_instructions: deliveryInstructions || null,
              },
            })
          : await pickupFn({ data: { ...payload, pickup_time: pickupTime || null } });
      clear();
      toast.success(`Order ${order.reference} sent to the kitchen`);
      navigate({ to: "/lounge/order", search: { ref: order.reference } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't place that order");
    }
    setBusy(false);
  }

  if (hydrated && !count) {
    return (
      <div className="py-16 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-ember" />
        <h1 className="mt-5 font-display text-3xl">Your basket is empty</h1>
        <p className="mt-3 text-sm text-paper/60">Pick a few dishes and they'll appear here.</p>
        <Link
          to="/lounge/menu"
          className="mt-8 inline-block bg-ember px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">Checkout</p>
        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">Almost at the table.</h1>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Your basket</h2>
          <div className="mt-4 divide-y divide-ember/10 border border-ember/15">
            {lines.map((l) => (
              <div key={l.key} className="flex items-start gap-4 p-4">
                {l.image_url ? (
                  <img src={l.image_url} alt={l.name} loading="lazy" className="h-16 w-16 flex-none object-cover" />
                ) : null}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg leading-tight">{l.name}</h3>
                      {l.extras.length > 0 && (
                        <p className="mt-1 text-xs text-ember-light">
                          + {l.extras.map((e) => e.name).join(", ")}
                        </p>
                      )}
                      {l.instructions && <p className="mt-1 text-xs text-paper/45">“{l.instructions}”</p>}
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">{bwp(lineTotal(l))}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Decrease ${l.name}`}
                      onClick={() => setQuantity(l.key, l.quantity - 1)}
                      className="h-8 w-8 border border-ember/30 hover:border-ember"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${l.name}`}
                      onClick={() => setQuantity(l.key, l.quantity + 1)}
                      className="h-8 w-8 border border-ember/30 hover:border-ember"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => remove(l.key)}
                      className="ml-auto text-paper/40 hover:text-ember-light"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={bwp(subtotal)} />
            {orderType === "delivery" && <Row label="Delivery" value={bwp(deliveryFee)} />}
            <div className="flex items-center justify-between border-t border-ember/15 pt-3 text-base">
              <dt className="uppercase tracking-[0.2em] text-paper/60">Total</dt>
              <dd className="font-semibold text-ember-light">{bwp(subtotal + deliveryFee)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-paper/45">
            Discount codes and final totals are confirmed by the kitchen when your order is accepted.
          </p>
        </section>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">How would you like it?</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <TypeButton active={orderType === "pickup"} onClick={() => setOrderType("pickup")} title="Collection">
                Ready in ~{settings?.estimated_prep_minutes ?? 30} min
              </TypeButton>
              <TypeButton
                active={orderType === "delivery"}
                onClick={() => canDeliver && setOrderType("delivery")}
                title="Delivery"
                disabled={!canDeliver}
              >
                {canDeliver
                  ? `${bwp(settings?.delivery_fee_bwp ?? 0)} · ~${settings?.estimated_delivery_minutes ?? 45} min`
                  : "Unavailable today"}
              </TypeButton>
            </div>
          </div>

          {orderType === "delivery" && (
            <div className="border border-ember/20 p-4">
              {!user ? (
                <p className="text-sm text-paper/70">
                  Delivery is for guests staying at Rest Easy Apartment.{" "}
                  <Link to="/auth" className="text-ember-light underline">
                    Sign in
                  </Link>{" "}
                  to pick your booking, or choose collection.
                </p>
              ) : (
                <>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                    Deliver to booking
                    <select
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      required
                      className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper focus:border-ember/60 focus:outline-none"
                    >
                      <option value="">Select your stay…</option>
                      {(bookings.data ?? []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.apartment_name}
                          {b.apartment_number ? ` (${b.apartment_number})` : ""} · {b.check_in} → {b.check_out}
                        </option>
                      ))}
                    </select>
                  </label>
                  {bookings.data && bookings.data.length === 0 && (
                    <p className="mt-3 text-xs text-paper/50">
                      No active bookings found on your account — choose collection or{" "}
                      <Link to="/book" className="text-gold underline">
                        book a room
                      </Link>
                      .
                    </p>
                  )}
                  <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                    Delivery notes
                    <input
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Call on arrival, gate code…"
                      className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-ember/60 focus:outline-none"
                    />
                  </label>
                  {settings?.delivery_instructions && (
                    <p className="mt-3 text-xs leading-relaxed text-paper/45">{settings.delivery_instructions}</p>
                  )}
                </>
              )}
            </div>
          )}

          <Field label="Your name" value={name} onChange={setName} required />
          <Field label="Phone number" value={phone} onChange={setPhone} required placeholder="+267 …" />
          <Field label="Email (optional)" value={email} onChange={setEmail} type="email" />
          {orderType === "pickup" && (
            <Field label="Collection time (optional)" value={pickupTime} onChange={setPickupTime} placeholder="19:30" />
          )}

          <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
            Payment method
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper focus:border-ember/60 focus:outline-none"
            >
              {(settings?.payment_methods ?? ["cash"]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m] ?? m}
                </option>
              ))}
            </select>
          </label>

          <Field label="Discount code (optional)" value={promo} onChange={setPromo} />

          <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
            Anything else?
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper focus:border-ember/60 focus:outline-none"
            />
          </label>

          {belowMinimum && (
            <p className="text-sm text-ember-light">
              Delivery orders start at {bwp(minimum)}. Add a little more or switch to collection.
            </p>
          )}

          <button
            type="submit"
            disabled={busy || belowMinimum || (orderType === "delivery" && (!user || !bookingId))}
            className="w-full bg-ember py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark transition-colors hover:bg-ember-light disabled:opacity-50"
          >
            {busy ? "Sending to the kitchen…" : `Place order · ${bwp(subtotal + deliveryFee)}`}
          </button>

          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-whatsapp/50 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-whatsapp hover:bg-whatsapp hover:text-dark"
          >
            Or send this order on WhatsApp
          </a>
        </form>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-paper/55">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border p-4 text-left transition-colors disabled:opacity-40 ${
        active ? "border-ember bg-ember/10" : "border-ember/20 hover:border-ember/60"
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-[11px] text-paper/55">{children}</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-ember/60 focus:outline-none"
      />
    </label>
  );
}
