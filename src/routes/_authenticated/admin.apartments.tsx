import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApartmentsAdmin, upsertApartment, setCleaningStatus, deleteApartment } from "@/lib/admin.functions";
import { useState } from "react";
import { MarkReadyDialog, ChecklistManagerDialog } from "@/components/ChecklistDialogs";

export const Route = createFileRoute("/_authenticated/admin/apartments")({
  head: () => ({ meta: [{ title: "Apartments — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() }),
  component: AptsPage,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

type Apt = Awaited<ReturnType<typeof listApartmentsAdmin>>[number];

function AptsPage() {
  const qc = useQueryClient();
  const { data: apts } = useSuspenseQuery({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() });
  const setStatus = useServerFn(setCleaningStatus);
  const del = useServerFn(deleteApartment);
  const [editing, setEditing] = useState<Apt | "new" | null>(null);
  const [readying, setReadying] = useState<Apt | null>(null);
  const [managingChecklist, setManagingChecklist] = useState<Apt | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-apartments"] });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="font-display text-4xl">Apartments</h1>
        <button onClick={() => setEditing("new")} className="bg-gold text-dark px-5 py-2 text-[11px] uppercase tracking-[0.2em]">+ Add apartment</button>
      </div>

      <div className="grid gap-3">
        {apts.map((a) => {
          const status = a.cleaning_status ?? "clean";
          return (
            <div key={a.id} className="bg-dark border border-gold/15 p-5 grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center">
              <div>
                <p className="font-display text-lg text-paper">{a.name} {a.apartment_number && <span className="text-paper/40 text-sm">· #{a.apartment_number}</span>}</p>
                <p className="text-xs text-paper/50 mt-1">
                  Base P{Number(a.base_rate_bwp).toFixed(2)}
                  {a.weekend_rate_bwp && ` · Weekend P${Number(a.weekend_rate_bwp).toFixed(2)}`}
                  {a.holiday_rate_bwp && ` · Holiday P${Number(a.holiday_rate_bwp).toFixed(2)}`}
                  {" · Max "}{a.max_guests} guests {!a.active && <span className="text-red-400">· Inactive</span>}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-1 text-paper/50">Status: <span className={status === "clean" ? "text-emerald-400" : "text-amber-400"}>{status}</span></p>
              </div>
              <select
                value={status === "clean" ? "" : status}
                onChange={async (e) => {
                  const v = e.target.value as "dirty" | "cleaning" | "maintenance";
                  if (!v) return;
                  await setStatus({ data: { apartment_id: a.id, cleaning_status: v } });
                  refresh();
                }}
                className="bg-paper/5 border border-gold/20 px-3 py-2 text-xs"
              >
                <option value="" disabled>{status === "clean" ? "Ready" : "Change…"}</option>
                <option value="dirty">Dirty</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button
                onClick={() => setReadying(a)}
                className="text-[10px] uppercase tracking-widest border border-emerald-400/40 text-emerald-400 px-3 py-2 hover:bg-emerald-400/10"
              >Mark ready</button>
              <button onClick={() => setManagingChecklist(a)} className="text-xs uppercase tracking-[0.2em] text-paper/70 hover:text-gold">Checklist</button>
              <button onClick={() => setEditing(a)} className="text-xs uppercase tracking-[0.2em] text-gold hover:text-gold-light">Edit</button>
              <button
                onClick={async () => { if (confirm("Deactivate?")) { await del({ data: { id: a.id } }); refresh(); } }}
                className="text-xs uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
              >Remove</button>
            </div>
          );
        })}
      </div>

      {editing && <EditModal initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { refresh(); setEditing(null); }} />}
      {readying && <MarkReadyDialog apartmentId={readying.id} apartmentName={readying.name} onClose={() => setReadying(null)} />}
      {managingChecklist && <ChecklistManagerDialog apartmentId={managingChecklist.id} apartmentName={managingChecklist.name} onClose={() => setManagingChecklist(null)} />}
    </div>
  );
}


function EditModal({ initial, onClose, onSaved }: { initial: Apt | null; onClose: () => void; onSaved: () => void }) {
  const save = useServerFn(upsertApartment);
  const [f, setF] = useState({
    id: initial?.id,
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    eyebrow: initial?.eyebrow ?? "",
    description: initial?.description ?? "",
    apartment_number: initial?.apartment_number ?? "",
    max_guests: initial?.max_guests ?? 2,
    base_rate_bwp: Number(initial?.base_rate_bwp ?? 400),
    weekend_rate_bwp: initial?.weekend_rate_bwp ? Number(initial.weekend_rate_bwp) : null,
    holiday_rate_bwp: initial?.holiday_rate_bwp ? Number(initial.holiday_rate_bwp) : null,
    features: (initial?.features ?? []) as string[],
    images: (initial?.images ?? []) as string[],
    active: initial?.active ?? true,
    sort_order: initial?.sort_order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="fixed inset-0 bg-dark/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr("");
          try { await save({ data: f }); onSaved(); } catch (er) { setErr(er instanceof Error ? er.message : "Failed"); }
          setBusy(false);
        }}
        className="bg-dark border border-gold/30 max-w-2xl w-full p-8 space-y-4 my-8"
      >
        <h2 className="font-display text-2xl mb-4">{initial ? "Edit apartment" : "New apartment"}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" required /></Field>
          <Field label="Slug"><input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="input" required /></Field>
          <Field label="Apartment #"><input value={f.apartment_number} onChange={(e) => setF({ ...f, apartment_number: e.target.value })} className="input" /></Field>
          <Field label="Max guests"><input type="number" min={1} value={f.max_guests} onChange={(e) => setF({ ...f, max_guests: Number(e.target.value) })} className="input" required /></Field>
          <Field label="Base rate (P)"><input type="number" step="0.01" value={f.base_rate_bwp} onChange={(e) => setF({ ...f, base_rate_bwp: Number(e.target.value) })} className="input" required /></Field>
          <Field label="Weekend rate (P)"><input type="number" step="0.01" value={f.weekend_rate_bwp ?? ""} onChange={(e) => setF({ ...f, weekend_rate_bwp: e.target.value ? Number(e.target.value) : null })} className="input" /></Field>
          <Field label="Holiday rate (P)"><input type="number" step="0.01" value={f.holiday_rate_bwp ?? ""} onChange={(e) => setF({ ...f, holiday_rate_bwp: e.target.value ? Number(e.target.value) : null })} className="input" /></Field>
          <Field label="Sort order"><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} className="input" /></Field>
        </div>
        <Field label="Eyebrow"><input value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })} className="input" /></Field>
        <Field label="Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="input" rows={3} /></Field>
        <Field label="Features (comma separated)">
          <input value={f.features.join(", ")} onChange={(e) => setF({ ...f, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="input" />
        </Field>
        <Field label="Image URLs (one per line)">
          <textarea value={f.images.join("\n")} onChange={(e) => setF({ ...f, images: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} className="input" rows={3} />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-3 pt-4">
          <button disabled={busy} className="bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50">{busy ? "…" : "Save"}</button>
          <button type="button" onClick={onClose} className="border border-gold/30 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Cancel</button>
        </div>
        <style>{`.input{width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(201,162,76,0.2);padding:0.5rem 0.75rem;color:#f7f4ee;font-size:0.875rem}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-paper/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
