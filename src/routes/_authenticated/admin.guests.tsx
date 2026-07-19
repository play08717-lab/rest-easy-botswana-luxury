import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listGuests } from "@/lib/admin.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/guests")({
  head: () => ({ meta: [{ title: "Guests — Admin" }, { name: "robots", content: "noindex" }] }),
  component: GuestsPage,
});

function GuestsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-guests", search],
    queryFn: () => listGuests({ data: { search: search || undefined } }),
  });

  const exportCsv = () => {
    const rows = data ?? [];
    if (!rows.length) return;
    const headers = ["name", "email", "phone", "nationality", "stays", "total_spent", "last_stay"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `guests-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="font-display text-4xl">Guests</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="bg-dark border border-gold/20 px-4 py-2 text-sm w-72"
          />
          <button onClick={exportCsv} className="bg-gold text-dark px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold">
            Export CSV
          </button>
          <button onClick={() => window.print()} className="border border-gold/30 text-paper/70 px-4 py-2 text-[10px] uppercase tracking-[0.2em]">
            Print / PDF
          </button>
        </div>
      </div>


      {isLoading && <p className="text-paper/50 text-sm">Loading…</p>}

      <div className="border border-gold/15 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-dark text-[10px] uppercase tracking-[0.2em] text-paper/50">
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Nationality</Th><Th>Stays</Th><Th>Spent</Th><Th>Last stay</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((g) => (
              <tr key={g.email + g.phone} className="border-t border-gold/10 hover:bg-gold/5">
                <Td>{g.name}</Td>
                <Td className="text-paper/60">{g.email}</Td>
                <Td className="text-paper/60">{g.phone}</Td>
                <Td>{g.nationality ?? "—"}</Td>
                <Td>{g.stays}</Td>
                <Td className="text-gold">P{g.total_spent.toFixed(2)}</Td>
                <Td>{g.last_stay}</Td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-paper/50">No guests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left font-medium">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
