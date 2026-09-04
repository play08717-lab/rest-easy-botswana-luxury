import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  getMenuAdmin,
  upsertCategory,
  deleteCategory,
  upsertMenuItem,
  setItemAvailability,
  archiveMenuItem,
  upsertExtra,
  deleteExtra,
} from "@/lib/lounge-admin.functions";
import { bwp } from "@/lib/lounge-cart";

export const Route = createFileRoute("/_authenticated/admin/lounge/menu")({
  head: () => ({ meta: [{ title: "Menu management — Engliton Lounge" }, { name: "robots", content: "noindex" }] }),
  component: MenuAdmin,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

type ItemDraft = {
  id?: string;
  category_id: string | null;
  name: string;
  description: string;
  price_bwp: number;
  image_url: string;
  prep_notes: string;
  available: boolean;
  is_special: boolean;
  archived: boolean;
  sort_order: number;
};

const EMPTY_ITEM: ItemDraft = {
  category_id: null,
  name: "",
  description: "",
  price_bwp: 0,
  image_url: "",
  prep_notes: "",
  available: true,
  is_special: false,
  archived: false,
  sort_order: 0,
};

function MenuAdmin() {
  const qc = useQueryClient();
  const load = useServerFn(getMenuAdmin);
  const saveItem = useServerFn(upsertMenuItem);
  const saveCat = useServerFn(upsertCategory);
  const delCat = useServerFn(deleteCategory);
  const toggleAvail = useServerFn(setItemAvailability);
  const archive = useServerFn(archiveMenuItem);
  const saveExtra = useServerFn(upsertExtra);
  const delExtra = useServerFn(deleteExtra);

  const { data, isLoading, error } = useQuery({ queryKey: ["lounge-menu-admin"], queryFn: () => load() });
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [catName, setCatName] = useState("");
  const [extraFor, setExtraFor] = useState<string>("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["lounge-menu-admin"] });

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
    setBusy(false);
  }

  if (error) return <p className="text-red-400">{(error as Error).message}</p>;

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];
  const extras = data?.extras ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Menu</h1>
          <p className="mt-2 text-sm text-paper/55">
            Switch items on and off as the kitchen runs out. Prices are in Pula.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY_ITEM, category_id: categories[0]?.id ?? null })}
          className="inline-flex items-center gap-2 bg-ember px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          <Plus className="h-3.5 w-3.5" /> New item
        </button>
      </div>

      <section className="mt-10 border border-ember/15 p-5">
        <h2 className="text-[11px] uppercase tracking-[0.25em] text-paper/45">Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="flex items-center gap-2 border border-ember/25 px-3 py-2 text-xs">
              {c.name}
              <button
                type="button"
                aria-label={`Delete ${c.name}`}
                onClick={() => {
                  if (window.confirm(`Delete category “${c.name}”? Items keep existing but lose their category.`))
                    run(() => delCat({ data: { id: c.id } }), "Category removed");
                }}
                className="text-paper/40 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!catName.trim()) return;
            run(
              () => saveCat({ data: { name: catName.trim(), description: "", sort_order: categories.length, active: true } }),
              "Category added",
            ).then(() => setCatName(""));
          }}
        >
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="New category name"
            className="flex-1 min-w-48 border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30"
          />
          <button
            disabled={busy}
            className="border border-ember/40 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark disabled:opacity-50"
          >
            Add category
          </button>
        </form>
      </section>

      {isLoading && <p className="mt-8 text-sm text-paper/50">Loading menu…</p>}

      <section className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ember/15 text-left text-[10px] uppercase tracking-[0.2em] text-paper/45">
              <th className="py-3">Item</th>
              <th className="py-3">Category</th>
              <th className="py-3">Price</th>
              <th className="py-3">Extras</th>
              <th className="py-3">Status</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className={`border-b border-ember/10 ${i.archived ? "opacity-40" : ""}`}>
                <td className="py-3">
                  <span className="block">{i.name}</span>
                  {i.is_special && <span className="text-[10px] uppercase tracking-[0.2em] text-ember">Special</span>}
                </td>
                <td className="py-3 text-paper/60">
                  {categories.find((c) => c.id === i.category_id)?.name ?? "—"}
                </td>
                <td className="py-3">{bwp(Number(i.price_bwp))}</td>
                <td className="py-3 text-xs text-paper/60">
                  {extras.filter((e) => e.item_id === i.id).map((e) => (
                    <span key={e.id} className="mr-2 inline-flex items-center gap-1">
                      {e.name} ({bwp(Number(e.price_bwp))})
                      <button
                        type="button"
                        aria-label={`Delete extra ${e.name}`}
                        onClick={() => run(() => delExtra({ data: { id: e.id } }), "Extra removed")}
                        className="text-paper/30 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setExtraFor(i.id);
                      setExtraName("");
                      setExtraPrice(0);
                    }}
                    className="text-[10px] uppercase tracking-[0.15em] text-ember hover:text-ember-light"
                  >
                    + add
                  </button>
                </td>
                <td className="py-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => toggleAvail({ data: { id: i.id, available: !i.available } }),
                        i.available ? "Marked sold out" : "Back on the menu",
                      )
                    }
                    className={`border px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${
                      i.available ? "border-ember/40 text-ember-light" : "border-paper/20 text-paper/50"
                    }`}
                  >
                    {i.available ? "Available" : "Sold out"}
                  </button>
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: i.id,
                        category_id: i.category_id,
                        name: i.name,
                        description: i.description,
                        price_bwp: Number(i.price_bwp),
                        image_url: i.image_url,
                        prep_notes: i.prep_notes,
                        available: i.available,
                        is_special: i.is_special,
                        archived: i.archived,
                        sort_order: i.sort_order,
                      })
                    }
                    className="text-[10px] uppercase tracking-[0.15em] text-paper/60 hover:text-ember-light"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        () => archive({ data: { id: i.id, archived: !i.archived } }),
                        i.archived ? "Item restored" : "Item archived",
                      )
                    }
                    className="ml-4 text-[10px] uppercase tracking-[0.15em] text-paper/40 hover:text-red-400"
                  >
                    {i.archived ? "Restore" : "Archive"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {extraFor && (
        <Modal title="Add an extra" onClose={() => setExtraFor("")}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  saveExtra({
                    data: {
                      item_id: extraFor,
                      name: extraName.trim(),
                      price_bwp: extraPrice,
                      active: true,
                      sort_order: 0,
                    },
                  }),
                "Extra added",
              ).then(() => setExtraFor(""));
            }}
          >
            <TextInput label="Extra name" value={extraName} onChange={setExtraName} required />
            <NumberInput label="Price (BWP)" value={extraPrice} onChange={setExtraPrice} />
            <button
              disabled={busy}
              className="w-full bg-ember py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light disabled:opacity-50"
            >
              Save extra
            </button>
          </form>
        </Modal>
      )}

      {draft && (
        <Modal title={draft.id ? "Edit item" : "New item"} onClose={() => setDraft(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveItem({ data: draft }), "Menu saved").then(() => setDraft(null));
            }}
          >
            <TextInput label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} required />
            <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Category
              <select
                value={draft.category_id ?? ""}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            <NumberInput label="Price (BWP)" value={draft.price_bwp} onChange={(v) => setDraft({ ...draft, price_bwp: v })} />
            <TextInput label="Image URL" value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
            <TextInput
              label="Prep note (e.g. 20 min)"
              value={draft.prep_notes}
              onChange={(v) => setDraft({ ...draft, prep_notes: v })}
            />
            <NumberInput
              label="Sort order"
              value={draft.sort_order}
              onChange={(v) => setDraft({ ...draft, sort_order: Math.round(v) })}
            />
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.available}
                  onChange={(e) => setDraft({ ...draft, available: e.target.checked })}
                />
                Available
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.is_special}
                  onChange={(e) => setDraft({ ...draft, is_special: e.target.checked })}
                />
                Tonight's special
              </label>
            </div>
            <button
              disabled={busy}
              className="w-full bg-ember py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save item"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-ember/25 bg-dark p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="text-paper/50 hover:text-paper">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.2em] text-paper/50">
      {label}
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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
