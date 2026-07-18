import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listApartmentsAdmin, setCleaningStatus, getCheckInReadiness } from "@/lib/admin.functions";
import { MarkReadyDialog } from "@/components/ChecklistDialogs";

export const Route = createFileRoute("/_authenticated/admin/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() }),
      context.queryClient.ensureQueryData({ queryKey: ["admin-readiness"], queryFn: () => getCheckInReadiness() }),
    ]),
  component: Page,
});

const NON_READY_STATUSES = [
  { key: "dirty", label: "Needs cleaning", tone: "text-amber-400 border-amber-400/30" },
  { key: "cleaning", label: "In progress", tone: "text-sky-300 border-sky-300/30" },
  { key: "maintenance", label: "Maintenance", tone: "text-red-400 border-red-400/30" },
] as const;

const READY_COL = { key: "clean", label: "Ready for check-in", tone: "text-emerald-400 border-emerald-400/30" } as const;

const STATUS_LABEL: Record<string, string> = {
  clean: "Ready",
  dirty: "Needs cleaning",
  cleaning: "In progress",
  maintenance: "Maintenance",
};
const STATUS_TONE: Record<string, string> = {
  clean: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
  dirty: "text-amber-400 border-amber-400/40 bg-amber-400/5",
  cleaning: "text-sky-300 border-sky-300/40 bg-sky-300/5",
  maintenance: "text-red-400 border-red-400/40 bg-red-400/5",
};

function Page() {
  const qc = useQueryClient();
  const { data: apts } = useSuspenseQuery({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() });
  const { data: readiness } = useSuspenseQuery({ queryKey: ["admin-readiness"], queryFn: () => getCheckInReadiness() });
  const setStatus = useServerFn(setCleaningStatus);
  const [readyTarget, setReadyTarget] = useState<{ id: string; name: string } | null>(null);

  const readyCount = apts.filter((a) => (a.cleaning_status ?? "clean") === "clean").length;

  async function moveNonReady(apartment_id: string, status: "dirty" | "cleaning" | "maintenance") {
    await setStatus({ data: { apartment_id, cleaning_status: status } });
    qc.invalidateQueries({ queryKey: ["admin-apartments"] });
    qc.invalidateQueries({ queryKey: ["admin-readiness"] });
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Housekeeping</h1>
      <p className="text-paper/50 text-sm mb-8">
        {readyCount} of {apts.length} apartments ready for check-in. Marking an apartment ready requires completing its pre-check-in checklist.
      </p>

      {/* Today's arrivals readiness */}
      <section className="mb-10">
        <h2 className="text-[11px] uppercase tracking-[0.25em] text-gold mb-4">
          Check-in readiness — Today ({readiness.arrivalsToday.length} arriving)
        </h2>
        {readiness.arrivalsToday.length === 0 ? (
          <div className="border border-gold/15 bg-dark p-6 text-paper/50 text-sm">No arrivals scheduled for today.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readiness.arrivalsToday.map((b) => {
              const status = b.apartments?.cleaning_status ?? "clean";
              const ready = status === "clean";
              return (
                <div key={b.id} className={`border p-4 ${ready ? "border-emerald-400/40 bg-emerald-400/5" : "border-amber-400/40 bg-amber-400/5"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-paper font-medium">{b.guest_name}</p>
                      <p className="text-[10px] text-paper/50 uppercase tracking-wider">{b.reference} · {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest px-2 py-1 border ${ready ? "text-emerald-400 border-emerald-400/40" : "text-amber-400 border-amber-400/40"}`}>
                      {ready ? "✓ Ready" : "Not ready"}
                    </span>
                  </div>
                  <p className="text-sm text-paper/80">
                    {b.apartments?.name}
                    {b.apartments?.apartment_number ? ` · #${b.apartments.apartment_number}` : ""}
                  </p>
                  <p className="text-[10px] text-paper/40 mt-1">Status: {STATUS_LABEL[status]}</p>
                  {!ready && b.apartment_id && b.apartments?.name && (
                    <button
                      onClick={() => setReadyTarget({ id: b.apartment_id!, name: b.apartments!.name })}
                      className="mt-3 text-[10px] uppercase tracking-widest border border-emerald-400/40 text-emerald-400 px-3 py-1.5 hover:bg-emerald-400/10"
                    >
                      Complete checklist & mark ready
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tomorrow's arrivals preview */}
      {readiness.arrivalsTomorrow.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/60 mb-4">
            Coming tomorrow ({readiness.arrivalsTomorrow.length})
          </h2>
          <div className="border border-gold/15 bg-dark divide-y divide-gold/10">
            {readiness.arrivalsTomorrow.map((b) => {
              const status = b.apartments?.cleaning_status ?? "clean";
              return (
                <div key={b.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-paper">{b.guest_name}</span>
                    <span className="text-paper/40"> · {b.apartments?.name}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${STATUS_TONE[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Kanban */}
      <h2 className="text-[11px] uppercase tracking-[0.25em] text-gold mb-4">Cleaning board</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {[...NON_READY_STATUSES, READY_COL].map((col) => {
          const list = apts.filter((a) => (a.cleaning_status ?? "clean") === col.key);
          return (
            <div key={col.key} className={`border ${col.tone} bg-dark p-4 min-h-[400px]`}>
              <h3 className={`text-[10px] uppercase tracking-[0.25em] ${col.tone.split(" ")[0]} mb-4`}>{col.label} · {list.length}</h3>
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className="bg-paper/5 border border-gold/10 p-3">
                    <p className="text-sm text-paper font-medium">{a.name}</p>
                    {a.apartment_number && <p className="text-[10px] text-paper/50">#{a.apartment_number}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {NON_READY_STATUSES.filter((s) => s.key !== col.key).map((s) => (
                        <button
                          key={s.key}
                          onClick={() => moveNonReady(a.id, s.key)}
                          className="text-[9px] uppercase tracking-widest border border-gold/20 px-2 py-1 hover:bg-gold/10"
                        >
                          → {s.label.split(" ")[0]}
                        </button>
                      ))}
                      {col.key !== "clean" && (
                        <button
                          onClick={() => setReadyTarget({ id: a.id, name: a.name })}
                          className="text-[9px] uppercase tracking-widest border border-emerald-400/40 text-emerald-400 px-2 py-1 hover:bg-emerald-400/10"
                        >
                          → Ready ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {readyTarget && (
        <MarkReadyDialog
          apartmentId={readyTarget.id}
          apartmentName={readyTarget.name}
          onClose={() => setReadyTarget(null)}
        />
      )}
    </div>
  );
}

