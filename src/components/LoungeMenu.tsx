import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Search, X, Flame } from "lucide-react";
import { bwp, useLoungeCart, type CartExtra } from "@/lib/lounge-cart";
import type { LoungeCategory, LoungeMenuItem } from "@/lib/lounge.functions";

type Props = {
  categories: LoungeCategory[];
  items: LoungeMenuItem[];
  whatsappNumber: string;
};

export function LoungeMenu({ categories, items }: Props) {
  const { add } = useLoungeCart();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openItem, setOpenItem] = useState<LoungeMenuItem | null>(null);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat !== "all" && i.category_id !== activeCat) return false;
      if (!q) return true;
      return `${i.name} ${i.description}`.toLowerCase().includes(q);
    });
  }, [items, activeCat, query]);

  const grouped = useMemo(() => {
    const groups = categories
      .map((c) => ({ category: c, items: filtered.filter((i) => i.category_id === c.id) }))
      .filter((g) => g.items.length > 0);
    const orphans = filtered.filter((i) => !categories.some((c) => c.id === i.category_id));
    if (orphans.length) {
      groups.push({
        category: { id: "other", name: "More from the kitchen", description: "", sort_order: 999 },
        items: orphans,
      });
    }
    return groups;
  }, [categories, filtered]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
            Everything
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
        <label className="relative md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="w-full border border-ember/25 bg-dark py-3 pl-10 pr-3 text-sm text-paper placeholder:text-paper/35 focus:border-ember/60 focus:outline-none"
          />
        </label>
      </div>

      {grouped.length === 0 && (
        <p className="mt-12 text-sm text-paper/60">Nothing matches that search. Try another dish.</p>
      )}

      {grouped.map((group) => (
        <section key={group.category.id} className="mt-12">
          <div className="flex items-end justify-between gap-6 border-b border-ember/15 pb-3">
            <div>
              <h2 className="font-display text-2xl md:text-3xl">{group.category.name}</h2>
              {group.category.description && (
                <p className="mt-1 text-sm text-paper/55">{group.category.description}</p>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-ember">{group.items.length} items</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item, i) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden bg-dark ring-1 ring-ember/15 transition-all duration-500 hover:ring-ember/45 animate-reveal"
                style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
              >
                {item.image_url ? (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                    {item.is_special && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 bg-ember px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-dark">
                        <Flame className="h-3 w-3" /> Special
                      </span>
                    )}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl leading-tight">{item.name}</h3>
                    <span className="whitespace-nowrap text-sm font-semibold text-ember-light">
                      {bwp(item.price_bwp)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-paper/60">{item.description}</p>
                  )}
                  {item.prep_notes && (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-paper/35">{item.prep_notes}</p>
                  )}
                  <div className="mt-auto pt-5">
                    {item.available ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.extras.length) {
                            setOpenItem(item);
                            return;
                          }
                          add({
                            item_id: item.id,
                            name: item.name,
                            unit_price_bwp: Number(item.price_bwp),
                            extras: [],
                            instructions: "",
                            image_url: item.image_url,
                            category_name: catName(item.category_id),
                          });
                          toast.success(`${item.name} added to your basket`);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 bg-ember py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark transition-colors hover:bg-ember-light"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {item.extras.length ? "Choose extras" : "Add to basket"}
                      </button>
                    ) : (
                      <span className="block border border-paper/15 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-paper/40">
                        Sold out today
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-ember/15 pt-8">
        <Link
          to="/lounge/checkout"
          className="bg-ember px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          Go to checkout
        </Link>
        <Link
          to="/lounge/order"
          className="border border-ember/40 px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark"
        >
          Track an order
        </Link>
      </div>

      {openItem && (
        <ExtrasDialog
          item={openItem}
          categoryName={catName(openItem.category_id)}
          onClose={() => setOpenItem(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
        active ? "border-ember bg-ember text-dark" : "border-ember/25 text-paper/60 hover:border-ember/60 hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

function ExtrasDialog({
  item,
  categoryName,
  onClose,
}: {
  item: LoungeMenuItem;
  categoryName: string;
  onClose: () => void;
}) {
  const { add } = useLoungeCart();
  const [chosen, setChosen] = useState<CartExtra[]>([]);
  const [instructions, setInstructions] = useState("");
  const [qty, setQty] = useState(1);

  const total = (Number(item.price_bwp) + chosen.reduce((s, e) => s + e.price_bwp, 0)) * qty;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-lg border border-ember/25 bg-dark p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ember">{categoryName}</p>
            <h3 className="mt-1 font-display text-2xl">{item.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-paper/50 hover:text-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-paper/45">Add extras</p>
        <div className="mt-3 space-y-2">
          {item.extras.map((e) => {
            const on = chosen.some((c) => c.id === e.id);
            return (
              <label
                key={e.id}
                className={`flex cursor-pointer items-center justify-between border px-4 py-3 text-sm transition-colors ${
                  on ? "border-ember bg-ember/10" : "border-ember/20 hover:border-ember/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setChosen((prev) => (on ? prev.filter((c) => c.id !== e.id) : [...prev, e]))
                    }
                    className="accent-[var(--ember)]"
                  />
                  {e.name}
                </span>
                <span className="text-ember-light">+ {bwp(e.price_bwp)}</span>
              </label>
            );
          })}
        </div>

        <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-paper/45">
          Special instructions
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="No chilli, extra napkins…"
            className="mt-2 w-full border border-ember/20 bg-dark px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-ember/60 focus:outline-none"
          />
        </label>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QtyButton onClick={() => setQty((q) => Math.max(1, q - 1))} label="Decrease quantity">
              −
            </QtyButton>
            <span className="w-6 text-center text-sm">{qty}</span>
            <QtyButton onClick={() => setQty((q) => Math.min(30, q + 1))} label="Increase quantity">
              +
            </QtyButton>
          </div>
          <span className="text-sm font-semibold text-ember-light">{bwp(total)}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            add({
              item_id: item.id,
              name: item.name,
              unit_price_bwp: Number(item.price_bwp),
              extras: chosen,
              instructions,
              image_url: item.image_url,
              category_name: categoryName,
              quantity: qty,
            });
            toast.success(`${item.name} added to your basket`);
            onClose();
          }}
          className="mt-6 w-full bg-ember py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
        >
          Add to basket
        </button>
      </div>
    </div>
  );
}

function QtyButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-9 w-9 border border-ember/30 text-paper/80 transition-colors hover:border-ember hover:text-ember-light"
    >
      {children}
    </button>
  );
}
