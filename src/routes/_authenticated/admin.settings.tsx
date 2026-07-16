import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminSettings, updateSettings } from "@/lib/booking.functions";
import { useState, useEffect } from "react";

type FormShape = {
  bank_name: string; bank_account_name: string; bank_account_number: string;
  bank_branch: string; bank_swift: string;
  check_in_time: string; check_out_time: string;
  cancellation_hours: number; hold_hours: number;
  contact_email: string; contact_phone: string; whatsapp_number: string; address: string;
};

const EMPTY: FormShape = {
  bank_name: "", bank_account_name: "", bank_account_number: "",
  bank_branch: "", bank_swift: "",
  check_in_time: "14:00", check_out_time: "10:00",
  cancellation_hours: 48, hold_hours: 24,
  contact_email: "", contact_phone: "", whatsapp_number: "", address: "",
};

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["admin-settings"], queryFn: () => getAdminSettings() }),
  component: SettingsPage,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["admin-settings"], queryFn: () => getAdminSettings() });
  const save = useServerFn(updateSettings);
  const [form, setForm] = useState<FormShape>({ ...EMPTY, ...(data ?? {}) });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (data) setForm({ ...EMPTY, ...data }); }, [data]);

  const textFields: Array<{ k: keyof FormShape; label: string }> = [
    { k: "bank_name", label: "Bank name" },
    { k: "bank_account_name", label: "Account name" },
    { k: "bank_account_number", label: "Account number" },
    { k: "bank_branch", label: "Branch code" },
    { k: "bank_swift", label: "SWIFT code" },
    { k: "contact_phone", label: "Contact phone" },
    { k: "whatsapp_number", label: "WhatsApp number (digits, e.g. 26771621866)" },
    { k: "contact_email", label: "Contact email" },
    { k: "address", label: "Address" },
    { k: "check_in_time", label: "Check-in time (HH:MM)" },
    { k: "check_out_time", label: "Check-out time (HH:MM)" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl mb-6">Settings</h1>
      <p className="text-sm text-paper/60 mb-8">Bank details are shown to guests after they submit a booking.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setMsg("");
          try {
            await save({ data: form });
            qc.invalidateQueries({ queryKey: ["admin-settings"] });
            qc.invalidateQueries({ queryKey: ["settings"] });
            setMsg("Saved.");
          } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
          setBusy(false);
        }}
        className="space-y-4"
      >
        {textFields.map((f) => (
          <label key={String(f.k)} className="block text-xs uppercase tracking-[0.2em] text-paper/60">
            {f.label}
            <input
              value={String(form[f.k] ?? "")}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              className="mt-2 w-full bg-dark border border-gold/20 px-4 py-3 text-paper text-sm"
            />
          </label>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/60">
            Cancellation window (hours)
            <input type="number" value={form.cancellation_hours}
              onChange={(e) => setForm({ ...form, cancellation_hours: Number(e.target.value) })}
              className="mt-2 w-full bg-dark border border-gold/20 px-4 py-3 text-paper text-sm" />
          </label>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/60">
            Payment hold (hours)
            <input type="number" value={form.hold_hours}
              onChange={(e) => setForm({ ...form, hold_hours: Number(e.target.value) })}
              className="mt-2 w-full bg-dark border border-gold/20 px-4 py-3 text-paper text-sm" />
          </label>
        </div>
        <button disabled={busy} className="bg-gold text-dark px-8 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <p className="text-sm text-gold-light">{msg}</p>}
      </form>
    </div>
  );
}
