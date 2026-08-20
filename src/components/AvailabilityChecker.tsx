import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import { getAvailabilityCalendar } from "@/lib/booking.functions";

const WHATSAPP = "26771621866";
const DAY = 86_400_000;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function nightsBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / DAY);
}
function fmtBwp(n: number) {
  return `BWP ${n.toLocaleString("en-BW", { maximumFractionDigits: 0 })}`;
}
function pretty(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AvailabilityChecker({
  apartmentSlug,
  title = "Check availability & rates",
}: {
  apartmentSlug?: string;
  title?: string;
}) {
  const fetchCalendar = useServerFn(getAvailabilityCalendar);
  const { data, isPending, isError } = useQuery({
    queryKey: ["availability-calendar", 90],
    queryFn: () => fetchCalendar({ data: { days: 90 } }),
    staleTime: 60_000,
  });

  const today = iso(new Date());
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(iso(new Date(Date.now() + DAY)));
  const [guests, setGuests] = useState(2);

  const units = useMemo(() => {
    const list = data?.apartments ?? [];
    return apartmentSlug ? list.filter((a) => a.slug === apartmentSlug) : list;
  }, [data, apartmentSlug]);

  const nights = nightsBetween(checkIn, checkOut);
  const validRange = nights >= 1;

  const stayDates = useMemo(() => {
    if (!validRange) return [] as string[];
    const out: string[] = [];
    for (let i = 0; i < nights; i++) out.push(iso(new Date(new Date(`${checkIn}T00:00:00Z`).getTime() + i * DAY)));
    return out;
  }, [checkIn, nights, validRange]);

  const results = units.map((u) => {
    const clash = stayDates.some((d) => u.occupied.includes(d));
    return {
      ...u,
      available: validRange && !clash && guests <= u.max_guests,
      reason: !validRange
        ? "Choose at least one night"
        : guests > u.max_guests
          ? `Sleeps up to ${u.max_guests}`
          : clash
            ? "Booked on these dates"
            : "",
      total: u.base_rate_bwp * Math.max(nights, 0),
    };
  });

  const firstAvailable = results.find((r) => r.available);

  const waLink = (unitName?: string) => {
    const lines = [
      "Hello Rest Easy Apartment, I'd like to enquire about a reservation.",
      unitName ? `Apartment: ${unitName}` : null,
      validRange ? `Check-in: ${pretty(checkIn)}` : null,
      validRange ? `Check-out: ${pretty(checkOut)}` : null,
      validRange ? `Nights: ${nights}` : null,
      `Guests: ${guests}`,
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  // 30-day availability strip for the reference unit (selected apartment, or any unit free)
  const strip = useMemo(() => {
    if (!data) return [];
    const start = new Date(`${data.start}T00:00:00Z`).getTime();
    return Array.from({ length: 30 }, (_, i) => {
      const d = iso(new Date(start + i * DAY));
      const free = units.some((u) => !u.occupied.includes(d));
      return { date: d, free };
    });
  }, [data, units]);

  return (
    <section className="bg-dark border border-gold/15 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
            Live availability
          </span>
          <h2 className="font-display text-2xl md:text-4xl mt-4 leading-[1.05]">{title}</h2>
        </div>
        <p className="text-xs text-paper/50 max-w-xs">
          Rates shown in Botswana Pula, per apartment, for your selected nights.
        </p>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-paper/50">Check-in</span>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (nightsBetween(e.target.value, checkOut) < 1) {
                setCheckOut(iso(new Date(new Date(`${e.target.value}T00:00:00Z`).getTime() + DAY)));
              }
            }}
            className="mt-2 w-full bg-transparent border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-paper"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-paper/50">Check-out</span>
          <input
            type="date"
            value={checkOut}
            min={iso(new Date(new Date(`${checkIn}T00:00:00Z`).getTime() + DAY))}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-2 w-full bg-transparent border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-paper"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-paper/50">Guests</span>
          <input
            type="number"
            min={1}
            max={10}
            value={guests}
            onChange={(e) => setGuests(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            className="mt-2 w-full bg-transparent border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-paper"
          />
        </label>
      </div>

      {/* Availability strip */}
      <div className="mt-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-paper/50">
          <CalendarDays className="w-3 h-3 text-gold" />
          Next 30 nights
          <span className="ml-auto flex items-center gap-4 normal-case tracking-normal">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gold" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-paper/20" /> Booked
            </span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {isPending || isError
            ? Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="h-9 bg-paper/5 animate-pulse" />
              ))
            : strip.map((s) => (
                <button
                  key={s.date}
                  type="button"
                  disabled={!s.free}
                  onClick={() => {
                    setCheckIn(s.date);
                    setCheckOut(iso(new Date(new Date(`${s.date}T00:00:00Z`).getTime() + DAY)));
                  }}
                  title={`${pretty(s.date)} — ${s.free ? "available" : "booked"}`}
                  className={`h-9 text-[10px] transition-colors ${
                    s.free
                      ? "bg-gold/15 text-gold-light hover:bg-gold hover:text-dark"
                      : "bg-paper/10 text-paper/30 line-through cursor-not-allowed"
                  } ${s.date === checkIn ? "ring-1 ring-gold" : ""}`}
                >
                  {Number(s.date.slice(8, 10))}
                </button>
              ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 space-y-3">
        {isPending ? (
          <p className="text-sm text-paper/50">Loading live availability…</p>
        ) : isError ? (
          <p className="text-sm text-paper/60">
            Availability isn't loading right now — message us on WhatsApp and we'll confirm.
          </p>
        ) : (
          results.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-gold/10 p-4 md:p-5"
            >
              <div>
                <h3 className="font-display text-lg">{r.name}</h3>
                <p className="text-xs text-paper/50 mt-1">
                  {fmtBwp(r.base_rate_bwp)} per night · sleeps {r.max_guests}
                </p>
              </div>
              <div className="text-right">
                {r.available ? (
                  <>
                    <p className="font-display text-xl text-gold-light">{fmtBwp(r.total)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-paper/40 mt-1">
                      {nights} night{nights === 1 ? "" : "s"} total
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-paper/40">{r.reason}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={waLink(apartmentSlug ? units[0]?.name : firstAvailable?.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
        >
          {validRange
            ? `Enquire on WhatsApp — ${pretty(checkIn)} → ${pretty(checkOut)}`
            : "Enquire on WhatsApp"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
        <p className="text-[11px] text-paper/40">
          Availability updates live; a booking is confirmed once we reply.
        </p>
      </div>
    </section>
  );
}
