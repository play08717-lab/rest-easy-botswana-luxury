import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/booking.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Rest Easy" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() }),
  component: Dashboard,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function Dashboard() {
  const { data } = useSuspenseQuery({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Stat label="Check-ins today" value={String(data.checkInsToday.length)} />
        <Stat label="Check-outs today" value={String(data.checkOutsToday.length)} />
        <Stat label="Revenue this month" value={`P${data.monthRevenue.toFixed(2)}`} />
      </div>

      <Section title="Pending payment">
        {data.pendingPayments.length === 0 && <p className="text-paper/50 text-sm">None waiting.</p>}
        <ul className="space-y-2">
          {data.pendingPayments.map((b) => (
            <li key={b.id} className="flex justify-between text-sm border-b border-gold/10 py-3">
              <Link to="/admin/bookings" className="text-gold-light">{b.reference}</Link>
              <span>{b.guest_name}</span>
              <span>P{Number(b.total_bwp).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <Section title="Arriving today">
          {data.checkInsToday.length === 0 ? (
            <p className="text-paper/50 text-sm">No arrivals.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.checkInsToday.map((b) => {
                const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
                return <li key={b.id}>{b.reference} — {b.guest_name} · {apt?.name}</li>;
              })}
            </ul>
          )}
        </Section>
        <Section title="Departing today">
          {data.checkOutsToday.length === 0 ? (
            <p className="text-paper/50 text-sm">No departures.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.checkOutsToday.map((b) => {
                const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
                return <li key={b.id}>{b.reference} — {b.guest_name} · {apt?.name}</li>;
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark border border-gold/15 p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{label}</p>
      <p className="font-display text-3xl mt-2">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark border border-gold/15 p-6">
      <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">{title}</h2>
      {children}
    </div>
  );
}
