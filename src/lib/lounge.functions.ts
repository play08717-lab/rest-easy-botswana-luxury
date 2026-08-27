import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const VENUE_SLUG = "engliton-lounge";

export type LoungeSettings = {
  venue_id: string;
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
  payment_methods: string[];
};

export type LoungeExtra = { id: string; name: string; price_bwp: number };
export type LoungeMenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price_bwp: number;
  image_url: string;
  prep_notes: string;
  available: boolean;
  is_special: boolean;
  sort_order: number;
  extras: LoungeExtra[];
};
export type LoungeCategory = { id: string; name: string; description: string; sort_order: number };
export type LoungePromotion = {
  id: string;
  title: string;
  description: string;
  promo_type: string;
  code: string | null;
  discount_percent: number | null;
  discount_amount_bwp: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

function normalizePhone(v: string) {
  return v.replace(/\D+/g, "");
}

function phoneMatches(a: string, b: string) {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (x.length < 6 || y.length < 6) return false;
  const n = Math.min(7, x.length, y.length);
  return x.slice(-n) === y.slice(-n);
}

// ---------------- Public: venue, settings, menu ----------------
export const getLoungeContext = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: venue, error: vErr } = await supabaseAdmin
    .from("lounge_venues")
    .select("id, slug, name, tagline, about")
    .eq("slug", VENUE_SLUG)
    .maybeSingle();
  if (vErr) throw new Error(vErr.message);
  if (!venue) throw new Error("Lounge venue not configured");

  const [settingsRes, catRes, itemRes, promoRes] = await Promise.all([
    supabaseAdmin.from("lounge_settings").select("*").eq("venue_id", venue.id).maybeSingle(),
    supabaseAdmin
      .from("lounge_categories")
      .select("id, name, description, sort_order")
      .eq("venue_id", venue.id)
      .eq("active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("lounge_menu_items")
      .select("id, category_id, name, description, price_bwp, image_url, prep_notes, available, is_special, sort_order")
      .eq("venue_id", venue.id)
      .eq("archived", false)
      .order("sort_order"),
    supabaseAdmin
      .from("lounge_promotions")
      .select("id, title, description, promo_type, code, discount_percent, discount_amount_bwp, starts_at, ends_at")
      .eq("venue_id", venue.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  const items = itemRes.data ?? [];
  const ids = items.map((i) => i.id);
  const extrasRes = ids.length
    ? await supabaseAdmin
        .from("lounge_item_extras")
        .select("id, item_id, name, price_bwp")
        .in("item_id", ids)
        .eq("active", true)
        .order("sort_order")
    : { data: [] as Array<{ id: string; item_id: string; name: string; price_bwp: number }> };

  const today = new Date().toISOString().slice(0, 10);
  const promotions = (promoRes.data ?? []).filter(
    (p) => (!p.starts_at || p.starts_at <= today) && (!p.ends_at || p.ends_at >= today),
  );

  return {
    venue,
    settings: (settingsRes.data ?? null) as LoungeSettings | null,
    categories: (catRes.data ?? []) as LoungeCategory[],
    items: items.map((i) => ({
      ...i,
      extras: (extrasRes.data ?? [])
        .filter((e) => e.item_id === i.id)
        .map((e) => ({ id: e.id, name: e.name, price_bwp: Number(e.price_bwp) })),
    })) as LoungeMenuItem[],
    promotions: promotions as LoungePromotion[],
  };
});

// ---------------- Pricing (server-authoritative) ----------------
const lineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(30),
  extra_ids: z.array(z.string().uuid()).max(10).default([]),
  instructions: z.string().trim().max(300).optional().nullable(),
});

const baseOrderSchema = z.object({
  lines: z.array(lineSchema).min(1).max(40),
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().min(6).max(30),
  customer_email: z.string().trim().email().max(200).optional().nullable(),
  customer_notes: z.string().trim().max(600).optional().nullable(),
  payment_method: z.string().trim().min(2).max(40),
  promo_code: z.string().trim().max(40).optional().nullable(),
});

const pickupSchema = baseOrderSchema.extend({
  pickup_time: z.string().trim().max(60).optional().nullable(),
});

const guestOrderSchema = baseOrderSchema.extend({
  order_type: z.enum(["pickup", "delivery"]),
  pickup_time: z.string().trim().max(60).optional().nullable(),
  booking_id: z.string().uuid().optional().nullable(),
  apartment_id: z.string().uuid().optional().nullable(),
  delivery_instructions: z.string().trim().max(400).optional().nullable(),
});

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function priceOrder(
  admin: Admin,
  venueId: string,
  input: z.infer<typeof baseOrderSchema>,
  isDelivery: boolean,
  settings: { delivery_fee_bwp: number; minimum_order_bwp: number; payment_methods: string[]; delivery_enabled: boolean },
) {
  if (!settings.payment_methods.includes(input.payment_method)) {
    throw new Error("That payment method isn't available right now.");
  }

  const itemIds = [...new Set(input.lines.map((l) => l.item_id))];
  const { data: items, error } = await admin
    .from("lounge_menu_items")
    .select("id, name, price_bwp, available, archived, category_id, lounge_categories(name)")
    .eq("venue_id", venueId)
    .in("id", itemIds);
  if (error) throw new Error(error.message);

  const extraIds = [...new Set(input.lines.flatMap((l) => l.extra_ids))];
  const { data: extras } = extraIds.length
    ? await admin.from("lounge_item_extras").select("id, item_id, name, price_bwp, active").in("id", extraIds)
    : { data: [] as Array<{ id: string; item_id: string; name: string; price_bwp: number; active: boolean }> };

  const rows: Array<{
    item_id: string;
    item_name: string;
    category_name: string;
    unit_price_bwp: number;
    quantity: number;
    extras: Array<{ id: string; name: string; price_bwp: number }>;
    extras_total_bwp: number;
    line_total_bwp: number;
    instructions: string | null;
  }> = [];

  for (const line of input.lines) {
    const item = (items ?? []).find((i) => i.id === line.item_id);
    if (!item || item.archived) throw new Error("One of the items is no longer on the menu.");
    if (!item.available) throw new Error(`${item.name} is currently unavailable.`);
    const chosen = (extras ?? []).filter((e) => line.extra_ids.includes(e.id) && e.item_id === item.id && e.active);
    const extrasTotal = chosen.reduce((s, e) => s + Number(e.price_bwp), 0);
    const unit = Number(item.price_bwp);
    rows.push({
      item_id: item.id,
      item_name: item.name,
      category_name:
        (item as unknown as { lounge_categories: { name: string } | null }).lounge_categories?.name ?? "",
      unit_price_bwp: unit,
      quantity: line.quantity,
      extras: chosen.map((e) => ({ id: e.id, name: e.name, price_bwp: Number(e.price_bwp) })),
      extras_total_bwp: extrasTotal * line.quantity,
      line_total_bwp: (unit + extrasTotal) * line.quantity,
      instructions: line.instructions ?? null,
    });
  }

  const subtotal = rows.reduce((s, r) => s + r.line_total_bwp, 0);
  if (isDelivery && !settings.delivery_enabled) throw new Error("Delivery is currently switched off.");
  if (isDelivery && subtotal < Number(settings.minimum_order_bwp)) {
    throw new Error(`Delivery orders have a minimum of BWP ${settings.minimum_order_bwp}.`);
  }
  const deliveryFee = isDelivery ? Number(settings.delivery_fee_bwp) : 0;

  let discount = 0;
  let appliedCode: string | null = null;
  if (input.promo_code) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: promo } = await admin
      .from("lounge_promotions")
      .select("code, discount_percent, discount_amount_bwp, starts_at, ends_at, active")
      .eq("venue_id", venueId)
      .eq("active", true)
      .ilike("code", input.promo_code)
      .maybeSingle();
    if (
      promo &&
      (!promo.starts_at || promo.starts_at <= today) &&
      (!promo.ends_at || promo.ends_at >= today)
    ) {
      discount = promo.discount_percent
        ? Math.round(subtotal * (Number(promo.discount_percent) / 100) * 100) / 100
        : Number(promo.discount_amount_bwp ?? 0);
      discount = Math.min(discount, subtotal);
      appliedCode = promo.code ?? null;
    } else {
      throw new Error("That discount code isn't valid.");
    }
  }

  return {
    rows,
    subtotal,
    deliveryFee,
    discount,
    appliedCode,
    total: Math.max(0, subtotal + deliveryFee - discount),
  };
}

async function loadVenue(admin: Admin) {
  const { data: venue } = await admin
    .from("lounge_venues")
    .select("id")
    .eq("slug", VENUE_SLUG)
    .maybeSingle();
  if (!venue) throw new Error("Lounge venue not configured");
  const { data: settings } = await admin
    .from("lounge_settings")
    .select("*")
    .eq("venue_id", venue.id)
    .maybeSingle();
  if (!settings) throw new Error("Lounge settings not configured");
  return { venueId: venue.id, settings };
}

type OrderInsert = import("@/integrations/supabase/types").Database["public"]["Tables"]["lounge_orders"]["Insert"];

async function insertOrder(
  admin: Admin,
  venueId: string,
  payload: Partial<OrderInsert>,
  priced: Awaited<ReturnType<typeof priceOrder>>,
) {
  const insertRow = {
    venue_id: venueId,
    subtotal_bwp: priced.subtotal,
    delivery_fee_bwp: priced.deliveryFee,
    discount_bwp: priced.discount,
    total_bwp: priced.total,
    promo_code: priced.appliedCode,
    ...payload,
  } as OrderInsert;

  const { data: order, error } = await admin
    .from("lounge_orders")
    .insert(insertRow)
    .select("id, reference, status, total_bwp, order_type, created_at")

    .single();
  if (error) throw new Error(error.message);

  const { error: itemsErr } = await admin.from("lounge_order_items").insert(
    priced.rows.map((r) => ({
      order_id: order.id,
      item_id: r.item_id,
      item_name: r.item_name,
      category_name: r.category_name,
      unit_price_bwp: r.unit_price_bwp,
      quantity: r.quantity,
      extras: r.extras,
      extras_total_bwp: r.extras_total_bwp,
      line_total_bwp: r.line_total_bwp,
      instructions: r.instructions,
    })),
  );
  if (itemsErr) throw new Error(itemsErr.message);

  await admin.from("lounge_order_events").insert({ order_id: order.id, status: "received", note: "Order placed" });
  return order;
}

// ---------------- Public: pickup order ----------------
export const placePickupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pickupSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { venueId, settings } = await loadVenue(supabaseAdmin);
    const priced = await priceOrder(supabaseAdmin, venueId, data, false, settings);
    return insertOrder(
      supabaseAdmin,
      venueId,
      {
        order_type: "pickup",
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email ?? null,
        customer_notes: data.customer_notes ?? null,
        pickup_time: data.pickup_time ?? null,
        payment_method: data.payment_method,
      },
      priced,
    );
  });

// ---------------- Auth: guest order (pickup or apartment delivery) ----------------
export const placeGuestOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => guestOrderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { venueId, settings } = await loadVenue(supabaseAdmin);
    const isDelivery = data.order_type === "delivery";

    let bookingId: string | null = null;
    let apartmentId: string | null = null;
    if (isDelivery) {
      if (!data.booking_id) throw new Error("Select the booking you're staying on.");
      const { data: booking } = await context.supabase
        .from("bookings")
        .select("id, apartment_id, status")
        .eq("id", data.booking_id)
        .maybeSingle();
      if (!booking) throw new Error("We couldn't match that booking to your account.");
      if (!["confirmed", "checked_in", "pending_payment"].includes(booking.status)) {
        throw new Error("That booking isn't active, so we can't deliver to it.");
      }
      bookingId = booking.id;
      apartmentId = data.apartment_id ?? booking.apartment_id;
    }

    const priced = await priceOrder(supabaseAdmin, venueId, data, isDelivery, settings);
    return insertOrder(
      supabaseAdmin,
      venueId,
      {
        order_type: data.order_type,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email ?? null,
        customer_notes: data.customer_notes ?? null,
        pickup_time: isDelivery ? null : data.pickup_time ?? null,
        delivery_instructions: isDelivery ? data.delivery_instructions ?? null : null,
        payment_method: data.payment_method,
        guest_id: context.userId,
        booking_id: bookingId,
        apartment_id: apartmentId,
      },
      priced,
    );
  });

// ---------------- Public: order status lookup ----------------
export const getLoungeOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ reference: z.string().trim().min(4).max(40), phone: z.string().trim().min(6).max(30) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("lounge_orders")
      .select(
        "id, reference, status, order_type, customer_name, customer_phone, subtotal_bwp, delivery_fee_bwp, discount_bwp, total_bwp, payment_method, payment_status, pickup_time, delivery_instructions, customer_notes, apartment_id, created_at, cancelled_reason",
      )
      .ilike("reference", data.reference.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || !phoneMatches(order.customer_phone, data.phone)) {
      throw new Error("We couldn't find that order. Check the order number and phone number.");
    }

    const [itemsRes, eventsRes, aptRes] = await Promise.all([
      supabaseAdmin
        .from("lounge_order_items")
        .select("item_name, quantity, unit_price_bwp, extras, extras_total_bwp, line_total_bwp, instructions")
        .eq("order_id", order.id),
      supabaseAdmin
        .from("lounge_order_events")
        .select("status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at"),
      order.apartment_id
        ? supabaseAdmin.from("apartments").select("name").eq("id", order.apartment_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const { customer_phone: _hidden, ...safe } = order;
    return {
      order: safe,
      apartment_name: (aptRes.data as { name: string } | null)?.name ?? null,
      items: itemsRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  });

// ---------------- Auth: my orders + eligible bookings ----------------
export const getMyLoungeOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("lounge_orders")
      .select("id, reference, status, order_type, total_bwp, created_at")
      .eq("guest_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyDeliverableBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("bookings")
      .select("id, reference, check_in, check_out, status, apartment_id, apartments(name, apartment_number)")
      .in("status", ["pending_payment", "confirmed", "checked_in"])
      .gte("check_out", today)
      .order("check_in");
    if (error) throw new Error(error.message);
    return (data ?? []).map((b) => ({
      id: b.id,
      reference: b.reference,
      check_in: b.check_in,
      check_out: b.check_out,
      apartment_id: b.apartment_id,
      apartment_name:
        (b as unknown as { apartments: { name: string; apartment_number: string | null } | null }).apartments?.name ??
        "Apartment",
      apartment_number:
        (b as unknown as { apartments: { apartment_number: string | null } | null }).apartments?.apartment_number ??
        null,
    }));
  });
