import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLoungeSettingsAdmin, updateLoungeSettings } from "@/lib/lounge-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/lounge/settings")({
  head: () => ({ meta: [{ title: "Lounge settings — Engliton Lounge" }, { name: "robots", content: "noindex" }] }),
  component: LoungeSettings,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

type PaymentMethod = "cash" | "bank_transfer" | "orange_money" | "card_manual";

type Form = {
  name: string;
  tagline: string;
  about: string;
  logo_url: string;
  cover_image_url: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  maps_url: string;
  maps_embed_url: string;
  opening_hours: string;
  facebook_url: string;
  instagram_url: string;
  currency: string;
  delivery_enabled: boolean;
  delivery_fee_bwp: number;
  minimum_order_bwp: number;
  delivery_radius_km: number;
  distance_note: string;
  estimated_prep_minutes: number;
  estimated_delivery_minutes: number;
  delivery_instructions: string;
  payment_methods: PaymentMethod[];
};

const EMPTY: Form = {
  name: "",
  tagline: "",
  about: "",
  logo_url: "",
  cover_image_url: "",
  phone: "",
  whatsapp_number: "",
  email: "",
  address: "",
  maps_url: "",
  maps_embed_url: "",
  opening_hours: "",
  facebook_url: "",
  instagram_url: "",
  currency: "BWP",
  delivery_enabled: true,
  delivery_fee_bwp: 0,
  minimum_order_bwp: 0,
  delivery_radius_km: 5,
  distance_note: "",
  estimated_prep_minutes: 30,
  estimated_delivery_minutes: 45,
  delivery_instructions: "",
  payment_methods: ["cash"],
};

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash on collection / delivery" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "orange_money", label: "Orange Money" },
  { value: "card_manual", label: "Card (in person)" },
];

const TEXT_FIELDS: Array<{ k: keyof Form; label: string; textarea?: boolean }> = [
  { k: "name", label: "Lounge name" },
  { k: "tagline", label: "Tagline" },
  { k: "about", label: "About the lounge", textarea: true },
  { k: "phone", label: "Phone number" },
  { k: "whatsapp_number", label: "WhatsApp number (digits, e.g. 26771621866)" },
  { k: "email", label: "Email" },
  { k: "address", label: "Address" },
  { k: "opening_hours", label: "Opening hours" },
  { k: "maps_url", label: "Google Maps link" },
  { k: "maps_embed_url", label: "Google Maps embed link" },
  { k: "logo_url", label: "Logo image URL" },
  { k: "cover_image_url", label: "Cover image URL" },
  { k: "facebook_url", label: "Facebook link" },
  { k: "instagram_url", label: "Instagram link" },
  { k: "distance_note", label: "Distance note (e.g. 3 km from Rest Easy)" },
  { k: "delivery_instructions", label: "Delivery instructions for guests", textarea: true },
];

function LoungeSettings() {
  const qc = useQueryClient();
  const load = useServerFn(getLoungeSettingsAdmin);
  const save = useServerFn(updateLoungeSettings);
  const { data, error } = useQuery({ queryKey: ["lounge-settings-admin"], queryFn: () => load() });
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const s = data.settings;
    const v = data.venue;
    setForm({
      ...EMPTY,
      ...(s
        ? {
            logo_url: s.logo_url,
            cover_image_url: s.cover_image_url,
            phone: s.phone,
            whatsapp_number: s.whatsapp_number,
            email: s.email,
            address: s.address,
            maps_url: s.maps_url,
            maps_embed_url: s.maps_embed_url,
            opening_hours: s.opening_hours,
            facebook_url: s.facebook_url,
            instagram_url: s.instagram_url,
            currency: s.currency,
            delivery_enabled: s.delivery_enabled,
            delivery_fee_bwp: Number(s.delivery_fee_bwp),
            minimum_order_bwp: Number(s.minimum_order_bwp),
            delivery_radius_km: Number(s.delivery_radius_km),
            distance_note: s.distance_note,
            estimated_prep_minutes: s.estimated_prep_minutes,
            estimated_delivery_minutes: s.estimated_delivery_minutes,
            delivery_instructions: s.delivery_instructions,
            payment_methods: (s.payment_methods as PaymentMethod[]) ?? ["cash"],
          }
        : {}),
      ...(v ? { name: v.name, tagline: v.tagline, about: v.about } : {}),
    });
  }, [data]);

  if (error) return <p className="text-red-400">{(error as Error).message}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">Lounge settings</h1>
      <p className="mt-2 text-sm text-paper/55">
        These details appear on the lounge pages and control delivery charges at checkout.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await save({ data: form });
            await qc.invalidateQueries({ queryKey: ["lounge-settings-admin"] });
            await qc.invalidateQueries({ queryKey: ["lounge-context"] });
            toast.success("Lounge settings saved");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
          }
          setBusy(false);
        }}
      >
        {TEXT_FIELDS.map((f) => (
          <label key={String(f.k)} className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
            {f.label}
            {f.textarea ? (
              <textarea
                rows={4}
                value={String(form[f.k] ?? "")}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              />
            ) : (
              <input
                value={String(form[f.k] ?? "")}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              />
            )}
          </label>
        ))}

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.delivery_enabled}
            onChange={(e) => setForm({ ...form, delivery_enabled: e.target.checked })}
          />
          Offer delivery to Rest Easy guests
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Delivery fee (BWP)" value={form.delivery_fee_bwp} onChange={(v) => setForm({ ...form, delivery_fee_bwp: v })} />
          <Num label="Minimum order (BWP)" value={form.minimum_order_bwp} onChange={(v) => setForm({ ...form, minimum_order_bwp: v })} />
          <Num label="Delivery radius (km)" value={form.delivery_radius_km} onChange={(v) => setForm({ ...form, delivery_radius_km: v })} />
          <Num
            label="Kitchen prep time (minutes)"
            value={form.estimated_prep_minutes}
            onChange={(v) => setForm({ ...form, estimated_prep_minutes: Math.round(v) })}
          />
          <Num
            label="Delivery time (minutes)"
            value={form.estimated_delivery_minutes}
            onChange={(v) => setForm({ ...form, estimated_delivery_minutes: Math.round(v) })}
          />
        </div>

        <fieldset>
          <legend className="text-[11px] uppercase tracking-[0.2em] text-paper/50">Accepted payment methods</legend>
          <div className="mt-3 space-y-2">
            {PAYMENT_OPTIONS.map((p) => (
              <label key={p.value} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.payment_methods.includes(p.value)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_methods: e.target.checked
                        ? [...form.payment_methods, p.value]
                        : form.payment_methods.filter((m) => m !== p.value),
                    })
                  }
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          disabled={busy || form.payment_methods.length === 0}
          className="bg-ember px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
      {label}
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
      />
    </label>
  );
}
