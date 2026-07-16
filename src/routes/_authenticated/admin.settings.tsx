import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSettings, updateSettings } from "@/lib/booking.functions";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["settings"], queryFn: () => getPublicSettings() }),
  component: SettingsPage,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["settings"], queryFn: () => getPublicSettings() });
  const save = useServerFn(updateSettings);
  const [form, setForm] = useState(data);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setForm(data), [data]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const fields: Array<{ k: keyof typeof form; label: string }> = [
    { k: "bank_name", label: "Bank name" },
    { k: "bank_account_name", label: "Account name" },
    { k: "bank_account_number", label: "Account number" },
    { k: "bank_branch", label: "Branch code" },
    { k: "bank_swift", label: "SWIFT code" },
    { k: "contact_phone", label: "Contact phone" },
    { k: "whatsapp_number", label: "WhatsApp number (digits only)" },
    { k: "contact_email", label: "Contact email" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl mb-6">Settings</h1>
      <p className="text-sm text-paper/60 mb-8">These bank details are shown to guests after they submit a booking.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setMsg("");
          try {
            await save({ data: form });
            qc.invalidateQueries({ queryKey: ["settings"] });
            setMsg("Saved.");
          } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
          setBusy(false);
        }}
        className="space-y-4"
      >
        {fields.map((f) => (
          <label key={f.k} className="block text-xs uppercase tracking-[0.2em] text-paper/60">
            {f.label}
            <input value={form[f.k] ?? ""} onChange={set(f.k)} className="mt-2 w-full bg-dark border border-gold/20 px-4 py-3 text-paper text-sm" />
          </label>
        ))}
        <button disabled={busy} className="bg-gold text-dark px-8 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <p className="text-sm text-gold-light">{msg}</p>}
      </form>
    </div>
  );
}
