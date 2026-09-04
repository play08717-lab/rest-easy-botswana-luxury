import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { getPromotionsAdmin, upsertPromotion, deletePromotion } from "@/lib/lounge-admin.functions";
import { bwp } from "@/lib/lounge-cart";

export const Route = createFileRoute("/_authenticated/admin/lounge/promotions")({
  head: () => ({ meta: [{ title: "Promotions — Engliton Lounge" }, { name: "robots", content: "noindex" }] }),
  component: PromotionsAdmin,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

type Draft = {
  id?: string;
  title: string;
  description: string;
  promo_type: "special" | "weekend" | "combo" | "discount_code" | "limited";
  code: string | null;
  discount_percent: number | null;
  discount_amount_bwp: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  promo_type: "special",
  code: null,
  discount_percent: null,
  discount_amount_bwp: null,
  starts_at: null,
  ends_at: null,
  active: true,
};

function PromotionsAdmin() {
  const qc = useQueryClient();
  const load = useServerFn(getPromotionsAdmin);
  const save = useServerFn(upsertPromotion);
  const remove = useServerFn(deletePromotion);
  const { data, error, isLoading } = useQuery({ queryKey: ["lounge-promotions"], queryFn: () => load() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["lounge-promotions"] });
      await qc.invalidateQueries({ queryKey: ["lounge-context"] });
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
    setBusy(false);
  }

  if (error) return <p className="text-red-400">{(error as Error).message}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Promotions</h1>
          <p className="mt-2 text-sm text-paper/55">
            Specials and discount codes appear on the lounge page and apply at checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="inline-flex items-center gap-2 bg-ember px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          <Plus className="h-3.5 w-3.5" /> New promotion
        </button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-paper/50">Loading…</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(data ?? []).map((p) => (
          <article key={p.id} className="border border-ember/20 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl">{p.title}</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] ${p.active ? "text-ember-light" : "text-paper/40"}`}
                >
                  {p.active ? "Live" : "Paused"}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => {
                    if (window.confirm(`Delete “${p.title}”?`)) run(() => remove({ data: { id: p.id } }), "Deleted");
                  }}
                  className="text-paper/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {p.description && <p className="mt-2 text-sm text-paper/60">{p.description}</p>}
            <p className="mt-3 text-xs text-paper/50">
              {p.code ? `Code ${p.code} · ` : ""}
              {p.discount_percent ? `${p.discount_percent}% off` : ""}
              {p.discount_amount_bwp ? `${bwp(Number(p.discount_amount_bwp))} off` : ""}
              {p.starts_at || p.ends_at ? ` · ${p.starts_at ?? "…"} → ${p.ends_at ?? "…"}` : ""}
            </p>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  promo_type: p.promo_type as Draft["promo_type"],
                  code: p.code,
                  discount_percent: p.discount_percent === null ? null : Number(p.discount_percent),
                  discount_amount_bwp: p.discount_amount_bwp === null ? null : Number(p.discount_amount_bwp),
                  starts_at: p.starts_at,
                  ends_at: p.ends_at,
                  active: p.active,
                })
              }
              className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ember hover:text-ember-light"
            >
              Edit →
            </button>
          </article>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => save({ data: draft }), "Promotion saved").then(() => setDraft(null));
            }}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto border border-ember/25 bg-dark p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{draft.id ? "Edit promotion" : "New promotion"}</h2>
              <button type="button" onClick={() => setDraft(null)} className="text-paper/50 hover:text-paper">
                Close
              </button>
            </div>

            <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Title
              <input
                value={draft.title}
                required
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              />
            </label>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Description
              <textarea
                value={draft.description}
                rows={3}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              />
            </label>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Type
              <select
                value={draft.promo_type}
                onChange={(e) => setDraft({ ...draft, promo_type: e.target.value as Draft["promo_type"] })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              >
                <option value="special">Special</option>
                <option value="weekend">Weekend</option>
                <option value="combo">Combo</option>
                <option value="discount_code">Discount code</option>
                <option value="limited">Limited time</option>
              </select>
            </label>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Discount code (optional)
              <input
                value={draft.code ?? ""}
                onChange={(e) => setDraft({ ...draft, code: e.target.value || null })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                Percent off
                <input
                  type="number"
                  value={draft.discount_percent ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, discount_percent: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                Amount off (BWP)
                <input
                  type="number"
                  step="0.01"
                  value={draft.discount_amount_bwp ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, discount_amount_bwp: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                Starts
                <input
                  type="date"
                  value={draft.starts_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, starts_at: e.target.value || null })}
                  className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
                Ends
                <input
                  type="date"
                  value={draft.ends_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, ends_at: e.target.value || null })}
                  className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Live on the lounge page
            </label>
            <button
              disabled={busy}
              className="w-full bg-ember py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save promotion"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
