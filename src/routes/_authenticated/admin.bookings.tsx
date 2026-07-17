import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminBookings, markBookingPaid, cancelBooking } from "@/lib/booking.functions";
import { adminCreateBooking, updateBookingStatus, extendBooking, listApartmentsAdmin } from "@/lib/admin.functions";
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
  const [showNew, setShowNew] = useState(false);
  const markPaid = useServerFn(markBookingPaid);
  const cancel = useServerFn(cancelBooking);
  const setStatus = useServerFn(updateBookingStatus);
  const extend = useServerFn(extendBooking);

  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-bookings"] });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="font-display text-4xl">Bookings</h1>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-dark border border-gold/20 px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="pending_payment">Pending payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="checked_out">Checked out</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
          <button onClick={() => setShowNew(true)} className="bg-gold text-dark px-4 py-2 text-[11px] uppercase tracking-[0.2em]">+ Walk-in / new</button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
          const open = openId === b.id;
          return (
            <div key={b.id} className="bg-dark border border-gold/15">
              <button onClick={() => setOpenId(open ? null : b.id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gold/5 text-sm">
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

                  <div className="flex flex-wrap gap-2">
                    {b.status === "confirmed" && (
                      <ActionBtn onClick={async () => { await setStatus({ data: { id: b.id, action: "check_in" } }); refresh(); }}>Check in</ActionBtn>
                    )}
                    {b.status === "checked_in" && (
                      <ActionBtn onClick={async () => { await setStatus({ data: { id: b.id, action: "check_out" } }); refresh(); }}>Check out</ActionBtn>
                    )}
                    {b.status === "confirmed" && (
                      <ActionBtn onClick={async () => { await setStatus({ data: { id: b.id, action: "no_show" } }); refresh(); }}>Mark no-show</ActionBtn>
                    )}
                    {["confirmed", "checked_in"].includes(b.status) && (
                      <ActionBtn onClick={async () => {
                        const d = prompt("New check-out date (YYYY-MM-DD)"); if (!d) return;
                        try { await extend({ data: { id: b.id, new_check_out: d } }); refresh(); } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
                      }}>Extend stay</ActionBtn>
                    )}
                    {!["cancelled", "checked_out"].includes(b.status) && (
                      <button
                        onClick={async () => { if (!confirm("Cancel booking?")) return; try { await cancel({ data: { id: b.id } }); refresh(); } catch (e) { alert(e instanceof Error ? e.message : "Failed"); } }}
                        className="text-xs uppercase tracking-[0.2em] text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-2"
                      >Cancel</button>
                    )}
                  </div>

                  {b.status === "pending_payment" && (
                    <MarkPaidForm
                      total={Number(b.total_bwp)}
                      onSubmit={async (p) => {
                        try { await markPaid({ data: { booking_id: b.id, ...p } }); refresh(); }
                        catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-paper/50 text-sm">No bookings.</p>}
      </div>

      {showNew && <NewBookingModal onClose={() => setShowNew(false)} onSaved={() => { refresh(); setShowNew(false); }} />}
    </div>
  );
}

function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="text-xs uppercase tracking-[0.2em] border border-gold/40 text-gold px-3 py-2 hover:bg-gold/10">{children}</button>;
}

function MarkPaidForm({ total, onSubmit }: { total: number; onSubmit: (p: { amount_bwp: number; method: "bank_transfer" | "cash" | "orange_money" | "other"; reference?: string; note?: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(total.toString());
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "orange_money" | "other">("bank_transfer");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSubmit({ amount_bwp: Number(amount), method, reference: ref || undefined }); setBusy(false); }}
      className="bg-paper text-dark p-4 grid md:grid-cols-4 gap-3 items-end"
    >
      <label className="text-xs">Amount (P)
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border-b border-dark/20 py-2 bg-transparent" required />
      </label>
      <label className="text-xs">Method
        <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="w-full border-b border-dark/20 py-2 bg-transparent">
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="orange_money">Orange Money</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-xs">Reference
        <input value={ref} onChange={(e) => setRef(e.target.value)} className="w-full border-b border-dark/20 py-2 bg-transparent" />
      </label>
      <button disabled={busy} className="bg-dark text-paper py-3 px-4 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50">{busy ? "…" : "Record payment"}</button>
    </form>
  );
}

function NewBookingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const create = useServerFn(adminCreateBooking);
  const { data: apts } = useQuery({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() });
  const [f, setF] = useState({
    apartment_id: "", check_in: "", check_out: "", guests: 1,
    guest_name: "", guest_email: "", guest_phone: "",
    nationality: "", vehicle_reg: "",
    source: "walk_in" as "walk_in" | "direct" | "phone" | "whatsapp" | "group",
    is_group: false, status: "confirmed" as "pending_payment" | "confirmed" | "checked_in",
    notes: "",
  });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 bg-dark/90 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <form
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr("");
          try {
            await create({ data: { ...f, nationality: f.nationality || null, vehicle_reg: f.vehicle_reg || null, notes: f.notes || null } });
            onSaved();
          } catch (er) { setErr(er instanceof Error ? er.message : "Failed"); }
          setBusy(false);
        }}
        className="bg-dark border border-gold/30 max-w-2xl w-full p-8 my-8 space-y-4"
      >
        <h2 className="font-display text-2xl mb-2">New booking</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <F label="Apartment">
            <select required value={f.apartment_id} onChange={(e) => setF({ ...f, apartment_id: e.target.value })} className="i">
              <option value="">—</option>
              {(apts ?? []).filter((a) => a.active).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </F>
          <F label="Guests"><input type="number" min={1} value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })} className="i" required /></F>
          <F label="Check-in"><input type="date" value={f.check_in} onChange={(e) => setF({ ...f, check_in: e.target.value })} className="i" required /></F>
          <F label="Check-out"><input type="date" value={f.check_out} onChange={(e) => setF({ ...f, check_out: e.target.value })} className="i" required /></F>
          <F label="Guest name"><input value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} className="i" required /></F>
          <F label="Email"><input type="email" value={f.guest_email} onChange={(e) => setF({ ...f, guest_email: e.target.value })} className="i" required /></F>
          <F label="Phone"><input value={f.guest_phone} onChange={(e) => setF({ ...f, guest_phone: e.target.value })} className="i" required /></F>
          <F label="Nationality"><input value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })} className="i" /></F>
          <F label="Vehicle reg"><input value={f.vehicle_reg} onChange={(e) => setF({ ...f, vehicle_reg: e.target.value })} className="i" /></F>
          <F label="Source">
            <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as typeof f.source })} className="i">
              <option value="walk_in">Walk-in</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="group">Group</option><option value="direct">Direct</option>
            </select>
          </F>
          <F label="Initial status">
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof f.status })} className="i">
              <option value="confirmed">Confirmed</option><option value="pending_payment">Pending payment</option><option value="checked_in">Checked in</option>
            </select>
          </F>
        </div>
        <label className="flex items-center gap-2 text-xs text-paper/70"><input type="checkbox" checked={f.is_group} onChange={(e) => setF({ ...f, is_group: e.target.checked })} /> Group booking</label>
        <F label="Notes"><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="i" rows={3} /></F>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-3 pt-2">
          <button disabled={busy} className="bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50">{busy ? "…" : "Create booking"}</button>
          <button type="button" onClick={onClose} className="border border-gold/30 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Cancel</button>
        </div>
        <style>{`.i{width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(201,162,76,0.2);padding:0.5rem 0.75rem;color:#f7f4ee;font-size:0.875rem}`}</style>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-paper/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
