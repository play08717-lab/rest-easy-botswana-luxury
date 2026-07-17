import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getManagerKpis } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Manager Dashboard — Rest Easy" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["manager-kpis"], queryFn: () => getManagerKpis() }),
  component: Dashboard,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

const money = (n: number) => `P${n.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Dashboard() {
  const { data: k } = useSuspenseQuery({ queryKey: ["manager-kpis"], queryFn: () => getManagerKpis() });

  const kpis = [
    { label: "Today's Revenue", value: money(k.todayRevenue), tone: "gold" },
    { label: "Month Revenue", value: money(k.monthRevenue), tone: "gold" },
    { label: "Outstanding", value: money(k.outstanding), tone: "warn" },
    { label: "Monthly Profit", value: money(k.monthProfit) },
    { label: "Total Bookings", value: String(k.totalBookings) },
    { label: "Confirmed", value: String(k.confirmed) },
    { label: "Pending", value: String(k.pending), tone: "warn" },
    { label: "Cancelled", value: String(k.cancelled) },
    { label: "Rooms Occupied", value: `${k.roomsOccupied} / ${k.totalApts}` },
    { label: "Rooms Available", value: String(k.roomsAvailable) },
    { label: "Occupancy Rate", value: `${k.occupancyRate}%`, tone: "gold" },
    { label: "Expected Check-ins", value: String(k.expectedIn) },
    { label: "Expected Check-outs", value: String(k.expectedOut) },
    { label: "Repeat Guests", value: String(k.repeatGuests) },
    { label: "New Guests / Month", value: String(k.newGuestsThisMonth) },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Manager Dashboard</h1>
      <p className="text-paper/50 text-sm mb-8">Everything, at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-dark border border-gold/15 p-5 hover:border-gold/40 transition-colors">
            <p className="text-[9px] uppercase tracking-[0.28em] text-paper/50">{k.label}</p>
            <p className={`font-display text-2xl mt-3 ${k.tone === "gold" ? "text-gold" : k.tone === "warn" ? "text-amber-400" : "text-paper"}`}>{k.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
