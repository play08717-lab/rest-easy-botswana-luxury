import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBookings, cancelBooking } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/PageHero";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My bookings — Rest Easy Apartment" },
      { name: "description", content: "Manage your Rest Easy Apartment bookings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["my-bookings"],
      queryFn: () => getMyBookings(),
    }),
  component: AccountPage,
  errorComponent: ({ error }) => <p className="text-red-400 mt-10">{error.message}</p>,
});

function AccountPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: bookings } = useSuspenseQuery({ queryKey: ["my-bookings"], queryFn: () => getMyBookings() });
  const cancel = useServerFn(cancelBooking);
  const [busy, setBusy] = useState<string | null>(null);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  async function doCancel(id: string) {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    setBusy(id);
    try {
      await cancel({ data: { id } });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Your stay"
        title={<>My <span className="italic text-gold-light">bookings</span></>}
        intro="Everything you need for your visit — vouchers, payment details, and status."
      />

      <div className="flex justify-end mt-6">
        <button onClick={signOut} className="text-xs uppercase tracking-[0.2em] text-paper/60 hover:text-gold">Sign out</button>
      </div>

      <section className="mt-8 space-y-4">
        {bookings.length === 0 && (
          <div className="bg-paper text-dark p-10 text-center">
            <p className="mb-6">You have no bookings yet.</p>
            <Link to="/book" className="inline-block bg-dark text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Reserve a stay</Link>
          </div>
        )}
        {bookings.map((b) => {
          const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
          return (
          <article key={b.id} className="bg-dark ring-1 ring-gold/15 p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{b.reference}</p>
              <h3 className="font-display text-2xl mt-1">{apt?.name ?? "Apartment"}</h3>
              <p className="text-sm text-paper/60 mt-2">
                {b.check_in} → {b.check_out} · {b.guests} guest{b.guests > 1 ? "s" : ""} · {b.nights} night{b.nights > 1 ? "s" : ""}
              </p>
              <p className="text-sm mt-2">
                <span className="text-paper/40">Total</span> <span className="text-gold-light">P{Number(b.total_bwp).toFixed(2)}</span> · <StatusBadge status={b.status} />
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Link to="/account/$bookingId" params={{ bookingId: b.id }} className="text-[10px] uppercase tracking-[0.2em] border border-gold/40 px-4 py-3 hover:bg-gold/10">
                Details
              </Link>
              {!["cancelled", "checked_out", "no_show"].includes(b.status) && (
                <button
                  onClick={() => doCancel(b.id)}
                  disabled={busy === b.id}
                  className="text-[10px] uppercase tracking-[0.2em] text-paper/50 hover:text-red-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </article>
        )})}
      </section>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_payment: "text-amber-400",
    confirmed: "text-emerald-400",
    checked_in: "text-emerald-300",
    checked_out: "text-paper/50",
    cancelled: "text-red-400",
    no_show: "text-red-400",
  };
  return <span className={`uppercase tracking-widest text-[10px] ${map[status] ?? "text-paper/60"}`}>{status.replace("_", " ")}</span>;
}
