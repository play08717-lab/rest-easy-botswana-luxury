import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApartmentsAdmin, setCleaningStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() }),
  component: Page,
});

const STATUSES = [
  { key: "dirty", label: "Needs cleaning", tone: "text-amber-400 border-amber-400/30" },
  { key: "cleaning", label: "In progress", tone: "text-sky-300 border-sky-300/30" },
  { key: "maintenance", label: "Maintenance", tone: "text-red-400 border-red-400/30" },
  { key: "clean", label: "Ready for check-in", tone: "text-emerald-400 border-emerald-400/30" },
] as const;

function Page() {
  const qc = useQueryClient();
  const { data: apts } = useSuspenseQuery({ queryKey: ["admin-apartments"], queryFn: () => listApartmentsAdmin() });
  const setStatus = useServerFn(setCleaningStatus);

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Housekeeping</h1>
      <p className="text-paper/50 text-sm mb-8">Move cards between columns to change status.</p>

      <div className="grid md:grid-cols-4 gap-4">
        {STATUSES.map((col) => {
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
                      {STATUSES.filter((s) => s.key !== col.key).map((s) => (
                        <button
                          key={s.key}
                          onClick={async () => {
                            await setStatus({ data: { apartment_id: a.id, cleaning_status: s.key } });
                            qc.invalidateQueries({ queryKey: ["admin-apartments"] });
                          }}
                          className="text-[9px] uppercase tracking-widest border border-gold/20 px-2 py-1 hover:bg-gold/10"
                        >
                          → {s.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
