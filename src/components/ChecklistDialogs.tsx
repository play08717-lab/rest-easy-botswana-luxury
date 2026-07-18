import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listChecklistItems,
  upsertChecklistItem,
  deleteChecklistItem,
  markApartmentReady,
} from "@/lib/admin.functions";

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-dark/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-dark border border-gold/30 max-w-lg w-full p-8 my-8">
        {children}
      </div>
    </div>
  );
}

export function MarkReadyDialog({
  apartmentId,
  apartmentName,
  onClose,
  onDone,
}: {
  apartmentId: string;
  apartmentName: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["checklist-items", apartmentId],
    queryFn: () => listChecklistItems({ data: { apartment_id: apartmentId } }),
  });
  const mark = useServerFn(markApartmentReady);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const active = (items ?? []).filter((i) => i.active);
  const doneCount = active.filter((i) => checked[i.id]).length;
  const allDone = active.length > 0 && doneCount === active.length;

  return (
    <Backdrop onClose={onClose}>
      <h2 className="font-display text-2xl mb-1">Pre-check-in checklist</h2>
      <p className="text-xs text-paper/50 mb-5">{apartmentName}</p>

      {active.length === 0 ? (
        <p className="text-sm text-amber-300 border border-amber-400/30 bg-amber-400/5 p-3 mb-4">
          No checklist items defined for this apartment. Add items first (Apartments → Manage checklist) before marking ready.
        </p>
      ) : (
        <ul className="space-y-2 mb-5">
          {active.map((i) => (
            <li key={i.id}>
              <label className="flex items-start gap-3 p-3 border border-gold/15 bg-paper/5 cursor-pointer hover:bg-paper/10">
                <input
                  type="checkbox"
                  checked={!!checked[i.id]}
                  onChange={(e) => setChecked({ ...checked, [i.id]: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm text-paper">{i.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <label className="block mb-4">
        <span className="text-[10px] uppercase tracking-[0.25em] text-paper/60">Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="mt-1 w-full bg-paper/5 border border-gold/20 px-3 py-2 text-sm text-paper" />
      </label>

      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

      <p className="text-xs text-paper/50 mb-4">{doneCount} of {active.length} complete</p>

      <div className="flex gap-3">
        <button
          disabled={busy || !allDone}
          onClick={async () => {
            setBusy(true); setErr("");
            try {
              await mark({
                data: {
                  apartment_id: apartmentId,
                  completed_item_ids: active.filter((i) => checked[i.id]).map((i) => i.id),
                  notes: notes || undefined,
                },
              });
              qc.invalidateQueries({ queryKey: ["admin-apartments"] });
              qc.invalidateQueries({ queryKey: ["admin-readiness"] });
              onDone?.();
              onClose();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Failed");
            }
            setBusy(false);
          }}
          className="bg-emerald-400 text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
        >
          {busy ? "…" : "Confirm ready"}
        </button>
        <button onClick={onClose} className="border border-gold/30 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Cancel</button>
      </div>
    </Backdrop>
  );
}

export function ChecklistManagerDialog({
  apartmentId,
  apartmentName,
  onClose,
}: {
  apartmentId: string;
  apartmentName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: items, refetch } = useQuery({
    queryKey: ["checklist-items", apartmentId],
    queryFn: () => listChecklistItems({ data: { apartment_id: apartmentId } }),
  });
  const upsert = useServerFn(upsertChecklistItem);
  const del = useServerFn(deleteChecklistItem);
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["checklist-items", apartmentId] });
  };

  return (
    <Backdrop onClose={onClose}>
      <h2 className="font-display text-2xl mb-1">Checklist template</h2>
      <p className="text-xs text-paper/50 mb-5">{apartmentName}</p>

      <ul className="space-y-2 mb-5">
        {(items ?? []).map((i) => (
          <li key={i.id} className="flex items-center gap-2 p-2 border border-gold/15 bg-paper/5">
            <input
              defaultValue={i.label}
              onBlur={async (e) => {
                if (e.target.value !== i.label && e.target.value.trim()) {
                  await upsert({ data: { id: i.id, apartment_id: apartmentId, label: e.target.value.trim(), sort_order: i.sort_order, active: i.active } });
                  invalidate();
                }
              }}
              className="flex-1 bg-transparent text-sm text-paper px-2 py-1 border border-transparent hover:border-gold/20 focus:border-gold/40 outline-none"
            />
            <label className="text-[10px] uppercase tracking-widest text-paper/60 flex items-center gap-1">
              <input
                type="checkbox"
                checked={i.active}
                onChange={async (e) => {
                  await upsert({ data: { id: i.id, apartment_id: apartmentId, label: i.label, sort_order: i.sort_order, active: e.target.checked } });
                  invalidate();
                }}
              /> Active
            </label>
            <button
              onClick={async () => { if (confirm("Delete this item?")) { await del({ data: { id: i.id } }); invalidate(); } }}
              className="text-red-400 text-[10px] uppercase tracking-widest px-2 py-1 hover:text-red-300"
            >Delete</button>
          </li>
        ))}
        {(items ?? []).length === 0 && <p className="text-sm text-paper/50">No items yet.</p>}
      </ul>

      <div className="flex gap-2 mb-6">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. Fresh linens on bed"
          className="flex-1 bg-paper/5 border border-gold/20 px-3 py-2 text-sm text-paper"
        />
        <button
          disabled={busy || !newLabel.trim()}
          onClick={async () => {
            setBusy(true);
            await upsert({
              data: {
                apartment_id: apartmentId,
                label: newLabel.trim(),
                sort_order: (items?.length ?? 0) + 1,
                active: true,
              },
            });
            setNewLabel("");
            invalidate();
            setBusy(false);
          }}
          className="bg-gold text-dark px-4 py-2 text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
        >Add</button>
      </div>

      <button onClick={onClose} className="border border-gold/30 px-6 py-3 text-[11px] uppercase tracking-[0.2em]">Done</button>
    </Backdrop>
  );
}
