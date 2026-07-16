import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getBookingById } from "@/lib/booking.functions";
import { PageHero } from "@/components/PageHero";

export const Route = createFileRoute("/_authenticated/account/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking details — Rest Easy Apartment" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["booking", params.bookingId],
      queryFn: () => getBookingById({ data: { id: params.bookingId } }),
    }),
  component: BookingDetail,
  errorComponent: ({ error }) => <p className="text-red-400 mt-10">{error.message}</p>,
});

function BookingDetail() {
  const { bookingId } = Route.useParams();
  const { data } = useSuspenseQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById({ data: { id: bookingId } }),
  });
  const b = data.booking;
  const s = data.settings;
  const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;

  const showPaymentInstructions = b.status === "pending_payment";
  const whatsappMsg = encodeURIComponent(
    `Hello, I've paid for booking ${b.reference} — please confirm. Thank you.`,
  );

  return (
    <>
      <PageHero
        eyebrow={b.reference}
        title={<>{apt?.name ?? "Booking"}</>}
        intro={`${b.check_in} → ${b.check_out} · ${b.guests} guest${b.guests > 1 ? "s" : ""} · ${b.nights} night${b.nights > 1 ? "s" : ""}`}
      />

      <div className="mt-6">
        <Link to="/account" className="text-xs text-paper/60 hover:text-gold uppercase tracking-[0.2em]">← Back to bookings</Link>
      </div>

      <section className="mt-10 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Summary">
            <Row label="Status" value={b.status.replace("_", " ")} />
            <Row label="Guest" value={b.guest_name} />
            <Row label="Email" value={b.guest_email} />
            <Row label="Phone" value={b.guest_phone} />
            <Row label="Nightly rate" value={`P${Number(b.nightly_rate_bwp).toFixed(2)}`} />
            <Row label="Nights" value={String(b.nights)} />
            <Row label="Total" value={`P${Number(b.total_bwp).toFixed(2)}`} highlight />
            {b.special_requests && <Row label="Requests" value={b.special_requests} />}
          </Card>

          {data.payments.length > 0 && (
            <Card title="Payments received">
              {data.payments.map((p) => (
                <Row key={p.id} label={new Date(p.recorded_at).toLocaleDateString()} value={`P${Number(p.amount_bwp).toFixed(2)} · ${p.method}`} />
              ))}
            </Card>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-6">
          {showPaymentInstructions && s && (
            <div className="bg-paper text-dark p-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-dark/50">Payment instructions</span>
              <h3 className="font-display text-2xl mt-3">Pay P{Number(b.total_bwp).toFixed(2)}</h3>
              <p className="text-sm mt-3 text-dark/70">Use booking reference <strong className="text-dark">{b.reference}</strong> so we can match your payment.</p>
              <dl className="mt-6 space-y-2 text-sm">
                <BankRow label="Bank" value={s.bank_name} />
                <BankRow label="Account name" value={s.bank_account_name} />
                <BankRow label="Account #" value={s.bank_account_number} />
                <BankRow label="Branch" value={s.bank_branch} />
                <BankRow label="SWIFT" value={s.bank_swift} />
              </dl>
              <p className="mt-4 text-xs text-dark/50">
                Bank details not set? Please contact reception at {s.contact_phone}.
              </p>
              <a
                href={`https://wa.me/${s.whatsapp_number}?text=${whatsappMsg}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-dark text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em]"
              >
                I've paid — notify reception
              </a>
            </div>
          )}

          <div className="bg-dark border border-gold/15 p-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Voucher</span>
            <h3 className="font-display text-xl mt-3">Booking voucher</h3>
            <p className="text-sm text-paper/60 mt-3">
              Show this reference at check-in: <strong className="text-gold-light">{b.reference}</strong>
            </p>
            <button
              onClick={() => window.print()}
              className="mt-6 text-[10px] uppercase tracking-[0.2em] border border-gold/40 px-4 py-3 hover:bg-gold/10"
            >
              Print / Save PDF
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark border border-gold/15 p-8">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-6">{title}</h3>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-gold/5 pb-2">
      <dt className="text-paper/50">{label}</dt>
      <dd className={highlight ? "text-gold-light font-medium" : "text-paper"}>{value}</dd>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dark/10 pb-1">
      <dt className="text-dark/50">{label}</dt>
      <dd className="text-dark font-medium">{value || "—"}</dd>
    </div>
  );
}
