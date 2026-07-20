import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listDeletionRequests, updateDeletionRequest, executeDeletion } from "@/lib/deletion.functions";

export const Route = createFileRoute("/_authenticated/admin/data-requests")({
  head: () => ({ meta: [{ title: "Data Requests — Admin" }, { name: "robots", content: "noindex" }] }),
  component: DataRequestsAdmin,
});

const STATUSES = ["pending", "in_review", "completed", "rejected"] as const;

function DataRequestsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-deletion-requests"], queryFn: () => listDeletionRequests() });
  const update = useServerFn(updateDeletionRequest);
  const execute = useServerFn(executeDeletion);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const rows = (data ?? []).filter((r) => filter === "all" || r.status === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-deletion-requests"] });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="font-display text-4xl">Data deletion requests</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-dark border border-gold/20 px-3 py-2 text-sm">
          <option value="all">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="space-y-3">
        {rows.map((r) => {
          const open = openId === r.id;
          const matches = (r.matched_booking_ids ?? []).length;
          return (
            <div key={r.id} className="bg-dark border border-gold/15">
              <button onClick={() => setOpenId(open ? null : r.id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gold/5 text-sm">
                <span className="font-mono text-xs text-gold-light w-64 shrink-0 truncate">{r.id}</span>
                <span className="flex-1 truncate">
                  <span className="text-paper/50">{r.lookup_type === "booking_reference" ? "REF" : "Email"}:</span> {r.lookup_value}
                </span>
                <span className="text-paper/50 hidden md:inline">{matches} match{matches === 1 ? "" : "es"}</span>
                <span className="text-paper/50 hidden md:inline">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className="text-[10px] uppercase tracking-widest text-gold w-28 text-right">{r.status.replace("_", " ")}</span>
              </button>
              {open && (
                <div className="border-t border-gold/10 p-6 space-y-4 text-sm">
                  <div className="grid md:grid-cols-2 gap-3">
                    <p><span className="text-paper/50">Requester:</span> {r.requester_name ?? "—"}</p>
                    <p><span className="text-paper/50">Contact email:</span> {r.requester_email ?? "—"}</p>
                    <p><span className="text-paper/50">Submitted:</span> {new Date(r.created_at).toLocaleString()}</p>
                    <p><span className="text-paper/50">Processed:</span> {r.processed_at ? new Date(r.processed_at).toLocaleString() : "—"}</p>
                  </div>
                  {r.reason && <p className="text-paper/70"><span className="text-paper/50">Reason:</span> {r.reason}</p>}
                  <div className="border border-gold/10 p-3 text-xs">
                    <p className="text-paper/50 uppercase tracking-[0.2em] mb-2">Matched records</p>
                    <p>{matches} booking(s){r.matched_profile_id ? " + 1 guest profile" : ""}</p>
                    {matches > 0 && (
                      <p className="text-paper/40 font-mono text-[10px] mt-1 break-all">{(r.matched_booking_ids ?? []).join(", ")}</p>
                    )}
                  </div>

                  <StatusForm
                    initial={{ status: r.status as (typeof STATUSES)[number], notes: r.notes ?? "" }}
                    onSave={async (v) => { await update({ data: { id: r.id, status: v.status, notes: v.notes || null } }); refresh(); }}
                  />

                  {r.status !== "completed" && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Permanently redact ${matches} booking(s)${r.matched_profile_id ? " and delete the guest profile" : ""}? This cannot be undone.`)) return;
                        try {
                          const res = await execute({ data: { id: r.id } });
                          alert(`Redacted ${res.bookingsRedacted} booking(s)${res.profileDeleted ? "; profile deleted" : ""}.`);
                          refresh();
                        } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
                      }}
                      className="text-xs uppercase tracking-[0.2em] bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 hover:bg-red-500/30"
                    >
                      Execute deletion
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && !isLoading && <p className="text-paper/50 text-sm">No requests.</p>}
      </div>
    </div>
  );
}

function StatusForm({ initial, onSave }: { initial: { status: (typeof STATUSES)[number]; notes: string }; onSave: (v: { status: (typeof STATUSES)[number]; notes: string }) => Promise<void> }) {
  const [status, setStatus] = useState(initial.status);
  const [notes, setNotes] = useState(initial.notes);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSave({ status, notes }); setBusy(false); }}
      className="grid md:grid-cols-[200px_1fr_auto] gap-3 items-end bg-paper/5 p-3 border border-gold/10"
    >
      <label className="text-xs">
        <span className="text-paper/50 uppercase tracking-[0.2em] text-[10px]">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])} className="w-full bg-dark border border-gold/20 px-2 py-2 mt-1">
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </label>
      <label className="text-xs">
        <span className="text-paper/50 uppercase tracking-[0.2em] text-[10px]">Internal notes</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-dark border border-gold/20 px-2 py-2 mt-1" />
      </label>
      <button disabled={busy} className="border border-gold/40 text-gold px-4 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-gold/10 disabled:opacity-50">
        {busy ? "…" : "Save"}
      </button>
    </form>
  );
}
