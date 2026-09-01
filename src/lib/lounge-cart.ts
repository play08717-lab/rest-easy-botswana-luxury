import { useCallback, useEffect, useState } from "react";

export type CartExtra = { id: string; name: string; price_bwp: number };

export type CartLine = {
  key: string;
  item_id: string;
  name: string;
  unit_price_bwp: number;
  quantity: number;
  extras: CartExtra[];
  instructions: string;
  image_url: string;
  category_name: string;
};

const STORAGE_KEY = "engliton-cart-v1";
const EVENT = "engliton-cart-change";

export function bwp(amount: number) {
  return `BWP ${Number(amount || 0).toLocaleString("en-BW", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function lineTotal(line: CartLine) {
  const extras = line.extras.reduce((s, e) => s + Number(e.price_bwp), 0);
  return (Number(line.unit_price_bwp) + extras) * line.quantity;
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(EVENT));
}

function lineKey(itemId: string, extras: CartExtra[], instructions: string) {
  return [itemId, extras.map((e) => e.id).sort().join("+"), instructions.trim().toLowerCase()].join("|");
}

export function useLoungeCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setLines(read());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback(
    (input: Omit<CartLine, "key" | "quantity"> & { quantity?: number }) => {
      const key = lineKey(input.item_id, input.extras, input.instructions);
      const current = read();
      const existing = current.find((l) => l.key === key);
      const next = existing
        ? current.map((l) => (l.key === key ? { ...l, quantity: Math.min(30, l.quantity + (input.quantity ?? 1)) } : l))
        : [...current, { ...input, quantity: input.quantity ?? 1, key }];
      write(next);
    },
    [],
  );

  const setQuantity = useCallback((key: string, quantity: number) => {
    const next = read()
      .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Math.min(30, quantity)) } : l))
      .filter((l) => l.quantity > 0);
    write(next);
  }, []);

  const remove = useCallback((key: string) => write(read().filter((l) => l.key !== key)), []);
  const clear = useCallback(() => write([]), []);

  return {
    lines,
    hydrated,
    add,
    setQuantity,
    remove,
    clear,
    subtotal: cartSubtotal(lines),
    count: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

export function whatsappOrderLink(
  whatsappNumber: string,
  lines: CartLine[],
  opts: { orderType?: "pickup" | "delivery"; name?: string; note?: string } = {},
) {
  const digits = (whatsappNumber || "").replace(/\D+/g, "");
  const body = lines.length
    ? lines
        .map(
          (l) =>
            `• ${l.quantity} × ${l.name}${l.extras.length ? ` (+ ${l.extras.map((e) => e.name).join(", ")})` : ""} — ${bwp(lineTotal(l))}`,
        )
        .join("\n")
    : "I'd like to see today's menu, please.";
  const parts = [
    "Hello Engliton Lounge!",
    opts.name ? `Name: ${opts.name}` : "",
    opts.orderType ? `Order type: ${opts.orderType === "delivery" ? "Delivery to Rest Easy Apartment" : "Collection"}` : "",
    "",
    body,
    lines.length ? `\nSubtotal: ${bwp(cartSubtotal(lines))}` : "",
    opts.note ? `\nNotes: ${opts.note}` : "",
  ].filter(Boolean);
  return `https://wa.me/${digits}?text=${encodeURIComponent(parts.join("\n"))}`;
}

export const STATUS_LABELS: Record<string, string> = {
  received: "Order received",
  confirmed: "Confirmed",
  preparing: "In the kitchen",
  ready: "Ready",
  out_for_delivery: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_FLOW = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"] as const;

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash on collection / delivery",
  bank_transfer: "Bank transfer (EFT)",
  orange_money: "Orange Money",
  card_manual: "Card on arrival",
};
