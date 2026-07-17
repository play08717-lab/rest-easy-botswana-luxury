import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getCalendarData } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CalendarPage,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function monthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const days: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days };
}

function CalendarPage() {
  const [monthBase, setMonthBase] = useState(() => new Date());
  const { start, end, days } = useMemo(() => monthRange(monthBase), [monthBase]);

  const { data } = useSuspenseQuery({
    queryKey: ["admin-calendar", start, end],
    queryFn: () => getCalendarData({ data: { start, end } }),
  });

  const bookingCell = (aptId: string, day: string) => {
    const b = data.bookings.find((x) => x.apartment_id === aptId && x.check_in <= day && x.check_out > day);
    if (b) return { color: b.status === "checked_in" ? "bg-gold/70" : "bg-gold/30", label: b.guest_name };
    const bl = data.blocks.find((x) => x.apartment_id === aptId && x.start_date <= day && x.end_date > day);
    if (bl) return { color: "bg-red-500/40", label: bl.reason ?? "Blocked" };
    return null;
  };

  const monthLabel = monthBase.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-4xl">Calendar</h1>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
          <button onClick={() => setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth() - 1, 1))} className="border border-gold/20 px-3 py-2 hover:bg-gold/10">← Prev</button>
          <span className="text-gold font-display text-lg normal-case tracking-normal">{monthLabel}</span>
          <button onClick={() => setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 1))} className="border border-gold/20 px-3 py-2 hover:bg-gold/10">Next →</button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gold/15">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="bg-dark">
              <th className="sticky left-0 bg-dark px-3 py-2 text-left text-paper/60 border-r border-gold/15 z-10">Unit</th>
              {days.map((d) => {
                const day = new Date(d).getDate();
                const isHoliday = data.holidays.some((h) => h.date === d);
                return (
                  <th key={d} className={`px-1 py-2 text-center min-w-[38px] ${isHoliday ? "text-gold" : "text-paper/50"}`}>
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.apartments.map((apt) => (
              <tr key={apt.id} className="border-t border-gold/10">
                <td className="sticky left-0 bg-dark px-3 py-2 text-paper border-r border-gold/15 font-medium">{apt.name}</td>
                {days.map((d) => {
                  const c = bookingCell(apt.id, d);
                  return (
                    <td key={d} className="p-0.5 align-middle">
                      <div className={`h-8 rounded-sm ${c ? c.color : "bg-paper/[0.03]"}`} title={c?.label ?? ""} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 mt-6 text-[11px] text-paper/60">
        <Legend color="bg-gold/70" label="Checked in" />
        <Legend color="bg-gold/30" label="Confirmed / pending" />
        <Legend color="bg-red-500/40" label="Blocked / maintenance" />
        <Legend color="bg-paper/[0.03] border border-gold/15" label="Available" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`inline-block w-4 h-4 ${color}`} />{label}</span>;
}
