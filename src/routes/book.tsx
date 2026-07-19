import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchAvailability, createBooking } from "@/lib/booking.functions";
import { useSession } from "@/hooks/use-session";
import { PageHero } from "@/components/PageHero";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Now — Rest Easy Apartment, Rakops" },
      { name: "description", content: "Check availability and reserve your stay at Rest Easy Apartment in Rakops, Botswana." },
      { property: "og:title", content: "Book Rest Easy Apartment" },
      { property: "og:description", content: "Check availability and reserve online." },
    ],
  }),
  component: BookPage,
});

type AvailRow = { apartment_id: string; slug: string; name: string; description: string; base_rate_bwp: number; max_guests: number; nights: number; total_bwp: number };

function BookPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const search = useServerFn(searchAvailability);
  const create = useServerFn(createBooking);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [results, setResults] = useState<AvailRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AvailRow | null>(null);
  const [err, setErr] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [booking, setBooking] = useState(false);
  const [consents, setConsents] = useState({
    privacy: false, terms: false, cancellation: false, house_rules: false,
  });
  const allConsented = consents.privacy && consents.terms && consents.cancellation && consents.house_rules;

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setResults(null); setSelected(null); setSearching(true);
    try {
      const rows = await search({ data: { check_in: checkIn, check_out: checkOut, guests } });
      setResults(rows as AvailRow[]);
    } catch (e) { setErr(e instanceof Error ? e.message : "Search failed"); }
    setSearching(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!allConsented) { setErr("Please accept the policies to continue."); return; }
    setErr(""); setBooking(true);
    try {
      const b = await create({
        data: {
          apartment_id: selected.apartment_id,
          check_in: checkIn, check_out: checkOut, guests,
          guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone,
          special_requests: requests || null,
          consents: {
            privacy: true as const,
            terms: true as const,
            cancellation: true as const,
            house_rules: true as const,
          },
        },
      });
      navigate({ to: "/account/$bookingId", params: { bookingId: b.id } });
    } catch (e) { setErr(e instanceof Error ? e.message : "Booking failed"); }
    setBooking(false);
  };


  return (
    <>
      <PageHero
        eyebrow="Book Now"
        title={<>Reserve <em className="text-gold-light">your stay</em></>}
        intro="Check availability, choose your unit, and secure the room. You'll receive bank details for a manual EFT after submitting."
      />

      <form onSubmit={runSearch} className="mt-10 grid md:grid-cols-4 gap-4 bg-paper/5 backdrop-blur-md border border-gold/20 p-6">
        <Field label="Check-in">
          <input type="date" required min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
        </Field>
        <Field label="Check-out">
          <input type="date" required min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
        </Field>
        <Field label="Guests">
          <input type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
        </Field>
        <button disabled={searching} className="bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold self-end disabled:opacity-50">
          {searching ? "Searching…" : "Check availability"}
        </button>
      </form>

      {err && <p className="mt-6 text-red-400 text-sm">{err}</p>}

      {results && (
        <section className="mt-10">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">
            {results.length} apartment{results.length === 1 ? "" : "s"} available
          </h2>
          {results.length === 0 && <p className="text-paper/60 text-sm">Sorry, nothing available for those dates. Try different dates.</p>}
          <div className="grid md:grid-cols-3 gap-4">
            {results.map((r) => {
              const active = selected?.apartment_id === r.apartment_id;
              return (
                <button
                  key={r.apartment_id}
                  onClick={() => setSelected(r)}
                  type="button"
                  className={`text-left p-6 border transition-all ${active ? "border-gold bg-gold/10" : "border-gold/15 hover:border-gold/40"}`}
                >
                  <h3 className="font-display text-xl">{r.name}</h3>
                  <p className="text-xs text-paper/60 mt-2">Up to {r.max_guests} guests · P{Number(r.base_rate_bwp).toFixed(0)}/night</p>
                  <p className="mt-4 font-display text-2xl text-gold-light">P{Number(r.total_bwp).toFixed(2)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-paper/40 mt-1">{r.nights} night{r.nights === 1 ? "" : "s"} total</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selected && (
        <section className="mt-12 border-t border-gold/15 pt-10">
          <h2 className="font-display text-2xl mb-6">Your details</h2>
          {!user ? (
            <div className="bg-paper text-dark p-8">
              <p className="text-sm">Please sign in to complete your reservation.</p>
              <Link to="/auth" search={{ next: "/book" }} className="mt-4 inline-block bg-dark text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em]">
                Sign in or create account
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 max-w-3xl">
              <Field label="Full name">
                <input required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
              </Field>
              <Field label="Email">
                <input required type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
              </Field>
              <Field label="Phone">
                <input required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
              </Field>
              <Field label="Special requests (optional)">
                <input value={requests} onChange={(e) => setRequests(e.target.value)} className="w-full bg-transparent border-b border-gold/30 py-2 text-paper" />
              </Field>
              <fieldset className="md:col-span-2 mt-4 border-t border-gold/10 pt-6 space-y-3">
                <legend className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Please confirm</legend>
                <ConsentRow checked={consents.privacy} onChange={(v) => setConsents((c) => ({ ...c, privacy: v }))}
                  label={<>I have read and agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">Privacy Policy</a>.</>} />
                <ConsentRow checked={consents.terms} onChange={(v) => setConsents((c) => ({ ...c, terms: v }))}
                  label={<>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">Terms & Conditions</a>.</>} />
                <ConsentRow checked={consents.cancellation} onChange={(v) => setConsents((c) => ({ ...c, cancellation: v }))}
                  label={<>I agree to the <a href="/cancellation" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">Cancellation Policy</a>.</>} />
                <ConsentRow checked={consents.house_rules} onChange={(v) => setConsents((c) => ({ ...c, house_rules: v }))}
                  label={<>I understand the <a href="/house-rules" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">House Rules</a>.</>} />
              </fieldset>
              <div className="md:col-span-2 flex items-center justify-between border-t border-gold/10 pt-6 mt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-paper/50">Total to pay</p>
                  <p className="font-display text-3xl text-gold-light">P{Number(selected.total_bwp).toFixed(2)}</p>
                </div>
                <button disabled={booking || !allConsented} title={!allConsented ? "Please accept the policies above" : undefined} className="bg-gold text-dark px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {booking ? "Reserving…" : "Reserve"}
                </button>
              </div>

            </form>
          )}
        </section>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-paper/60">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ConsentRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm text-paper/75 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required
        className="mt-1 h-4 w-4 accent-gold" />
      <span>{label}</span>
    </label>
  );
}
