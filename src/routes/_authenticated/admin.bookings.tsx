import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminBookings, markBookingPaid, cancelBooking } from "@/lib/booking.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["admin-bookings"], queryFn: () => getAdminBookings() }),
  component: BookingsAdmin,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function BookingsAdmin() {
  const qc = useQueryClient();
  const { data: bookings } = useSuspenseQuery({ queryKey: ["admin-bookings"], queryFn: () => getAdminBookings() });
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const markPaid = useServerFn(markBookingPaid);
  const cancel = useServerFn(cancelBooking);

  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-bookings"] });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-4xl">Bookings</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-dark border border-gold/20 px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="pending_payment">Pending payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked in</option>
          <option value="checked_out">Checked out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
          const open = openId === b.id;
          return (
            <div key={b.id} className="bg-dark border border-gold/15">
              <button
                onClick={() => setOpenId(open ? null : b.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gold/5 text-sm"
              >
                <span className="text-gold-light font-mono text-xs w-32 shrink-0">{b.reference}</span>
                <span className="flex-1">{b.guest_name} · {apt?.name}</span>
                <span className="text-paper/60 hidden md:inline">{b.check_in} → {b.check_out}</span>
                <span className="text-paper/60">P{Number(b.total_bwp).toFixed(2)}</span>
                <span className="text-[10px] uppercase tracking-widest text-gold w-32 text-right">{b.status.replace("_", " ")}</span>
              </button>
              {open && (
                <div className="border-t border-gold/10 p-6 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <p><span className="text-paper/50">Email:</span> {b.guest_email}</p>
                    <p><span className="text-paper/50">Phone:</span> {b.guest_phone}</p>
                    <p><span className="text-paper/50">Created:</span> {new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  {b.status === "pending_payment" && (
                    <MarkPaidForm
                      total={Number(b.total_bwp)}
                      onSubmit={async (p) => {
                        try {
                          await markPaid({ data: { booking_id: b.id, ...p } });
                          refresh();
                        } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
                      }}
                    />
                  )}
                  {!["cancelled", "checked_out"].includes(b.status) && (
                    <button
                      onClick={async () => {
                        if (!confirm("Cancel booking?")) return;
                        try { await cancel({ data: { id: b.id } }); refresh(); }
                        catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
                      }}
                      className="text-xs uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-paper/50 text-sm">No bookings.</p>}
      </div>
    </div>
  );
}

function MarkPaidForm({ total, onSubmit }: { total: number; onSubmit: (p: { amount_bwp: number; method: "bank_transfer" | "cash" | "other"; reference?: string; note?: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(total.toString());
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "other">("bank_transfer");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSubmit({ amount_bwp: Number(amount), method, reference: ref || undefined });
        setBusy(false);
      }}
      className="bg-paper text-dark p-4 grid md:grid-cols-4 gap-3 items-end"
    >
      <label className="text-xs">
        Amount (P)
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border-b border-dark/20 py-2 bg-transparent" required />
      </label>
      <label className="text-xs">
        Method
        <select value={method} onChange={(e) => setMethod(e.target.value as "bank_transfer" | "cash" | "other")} className="w-full border-b border-dark/20 py-2 bg-transparent">
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-xs">
        Bank reference
        <input value={ref} onChange={(e) => setRef(e.target.value)} className="w-full border-b border-dark/20 py-2 bg-transparent" />
      </label>
      <button disabled={busy} className="bg-dark text-paper py-3 px-4 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50">
        {busy ? "…" : "Mark paid"}
      </button>
    </form>
  );
}
