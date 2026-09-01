import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VENUE_SLUG = "engliton-lounge";

const STATUSES = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

async function requireStaff(supabase: { rpc: (fn: "is_lounge_staff", args: { _user_id: string }) => unknown }, userId: string) {
  const { data } = (await supabase.rpc("is_lounge_staff", { _user_id: userId })) as { data: boolean | null };
  if (!data) throw new Error("Forbidden");
}

async function requireManager(supabase: { rpc: (fn: "is_lounge_manager", args: { _user_id: string }) => unknown }, userId: string) {
  const { data } = (await supabase.rpc("is_lounge_manager", { _user_id: userId })) as { data: boolean | null };
  if (!data) throw new Error("Forbidden");
}

async function venueId() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("lounge_venues").select("id").eq("slug", VENUE_SLUG).maybeSingle();
  if (!data) throw new Error("Lounge venue not configured");
  return data.id;
}

// ---------------- Board + KPIs ----------------
export const getLoungeBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [openRes, todayRes, monthRes] = await Promise.all([
      supabaseAdmin
        .from("lounge_orders")
        .select(
          "id, reference, status, order_type, customer_name, customer_phone, total_bwp, payment_method, payment_status, pickup_time, delivery_instructions, customer_notes, staff_notes, apartment_id, booking_id, created_at, apartments(name, apartment_number)",
        )
        .eq("venue_id", vid)
        .not("status", "in", "(completed,cancelled)")
        .order("created_at"),
      supabaseAdmin
        .from("lounge_orders")
        .select("id, status, total_bwp, order_type")
        .eq("venue_id", vid)
        .gte("created_at", startOfDay.toISOString()),
      supabaseAdmin
        .from("lounge_orders")
        .select("id, status, total_bwp")
        .eq("venue_id", vid)
        .gte("created_at", startOfMonth.toISOString()),
    ]);

    const open = openRes.data ?? [];
    const ids = open.map((o) => o.id);
    const itemsRes = ids.length
      ? await supabaseAdmin
          .from("lounge_order_items")
          .select("order_id, item_name, quantity, extras, instructions, line_total_bwp")
          .in("order_id", ids)
      : { data: [] as Array<{ order_id: string; item_name: string; quantity: number; extras: unknown; instructions: string | null; line_total_bwp: number }> };

    const orderItems = (itemsRes.data ?? []).map((i) => ({
      order_id: i.order_id,
      item_name: i.item_name,
      quantity: i.quantity,
      instructions: i.instructions,
      line_total_bwp: Number(i.line_total_bwp),
      extras: (Array.isArray(i.extras) ? i.extras : []) as Array<{ name: string; price_bwp: number }>,
    }));

    const today = todayRes.data ?? [];
    const month = monthRes.data ?? [];
    const paidish = (s: string) => s !== "cancelled";

    const { data: popular } = await supabaseAdmin
      .from("lounge_order_items")
      .select("item_name, quantity")
      .gte("created_at", startOfMonth.toISOString())
      .limit(1000);
    const popularMap = new Map<string, number>();
    for (const row of popular ?? []) {
      popularMap.set(row.item_name, (popularMap.get(row.item_name) ?? 0) + row.quantity);
    }

    return {
      orders: open.map((o) => ({
        ...o,
        apartment_name:
          (o as unknown as { apartments: { name: string; apartment_number: string | null } | null }).apartments?.name ??
          null,
        items: orderItems.filter((i) => i.order_id === o.id),
      })),
      kpis: {
        today_orders: today.length,
        pending: today.filter((o) => o.status === "received").length,
        preparing: open.filter((o) => o.status === "preparing").length,
        ready: open.filter((o) => o.status === "ready" || o.status === "out_for_delivery").length,
        completed_today: today.filter((o) => o.status === "completed").length,
        cancelled_today: today.filter((o) => o.status === "cancelled").length,
        today_sales: today.filter((o) => paidish(o.status)).reduce((s, o) => s + Number(o.total_bwp), 0),
        month_sales: month.filter((o) => paidish(o.status)).reduce((s, o) => s + Number(o.total_bwp), 0),
        delivery_today: today.filter((o) => o.order_type === "delivery").length,
        pickup_today: today.filter((o) => o.order_type === "pickup").length,
      },
      popular: [...popularMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, qty]) => ({ name, qty })),
    };
  });

export const updateLoungeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        order_id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        staff_notes: z.string().trim().max(600).optional(),
        payment_status: z.enum(["unpaid", "paid", "refunded"]).optional(),
        cancelled_reason: z.string().trim().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "confirmed") patch.confirmed_at = now;
      if (data.status === "ready") patch.ready_at = now;
      if (data.status === "completed") patch.completed_at = now;
      if (data.status === "cancelled") {
        patch.cancelled_at = now;
        patch.cancelled_reason = data.cancelled_reason ?? "Cancelled by staff";
      }
    }
    if (data.staff_notes !== undefined) patch.staff_notes = data.staff_notes;
    if (data.payment_status) patch.payment_status = data.payment_status;

    const { error } = await supabaseAdmin
      .from("lounge_orders")
      .update(patch as never)
      .eq("id", data.order_id);
    if (error) throw new Error(error.message);

    if (data.status) {
      await supabaseAdmin.from("lounge_order_events").insert({
        order_id: data.order_id,
        status: data.status,
        note: data.cancelled_reason ?? null,
        actor_id: context.userId,
      });
    }
    return { ok: true };
  });

// ---------------- Menu management ----------------
export const getMenuAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const [cats, items, extras] = await Promise.all([
      supabaseAdmin.from("lounge_categories").select("*").eq("venue_id", vid).order("sort_order"),
      supabaseAdmin.from("lounge_menu_items").select("*").eq("venue_id", vid).order("sort_order"),
      supabaseAdmin.from("lounge_item_extras").select("*").order("sort_order"),
    ]);
    return { categories: cats.data ?? [], items: items.data ?? [], extras: extras.data ?? [] };
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300).default(""),
        sort_order: z.number().int().min(0).max(999).default(0),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const { error } = await supabaseAdmin.from("lounge_categories").upsert({ ...data, venue_id: vid } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lounge_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        category_id: z.string().uuid().nullable().default(null),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(600).default(""),
        price_bwp: z.number().min(0).max(100000),
        image_url: z.string().trim().max(500).default(""),
        prep_notes: z.string().trim().max(300).default(""),
        available: z.boolean().default(true),
        is_special: z.boolean().default(false),
        archived: z.boolean().default(false),
        sort_order: z.number().int().min(0).max(999).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const { error } = await supabaseAdmin.from("lounge_menu_items").upsert({ ...data, venue_id: vid } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setItemAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), available: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lounge_menu_items")
      .update({ available: data.available })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), archived: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lounge_menu_items")
      .update({ archived: data.archived })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        item_id: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        price_bwp: z.number().min(0).max(10000),
        active: z.boolean().default(true),
        sort_order: z.number().int().min(0).max(999).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lounge_item_extras").upsert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lounge_item_extras").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Promotions ----------------
export const getPromotionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const { data, error } = await supabaseAdmin
      .from("lounge_promotions")
      .select("*")
      .eq("venue_id", vid)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(600).default(""),
        promo_type: z.enum(["special", "weekend", "combo", "discount_code", "limited"]).default("special"),
        code: z.string().trim().max(40).nullable().default(null),
        discount_percent: z.number().min(0).max(100).nullable().default(null),
        discount_amount_bwp: z.number().min(0).max(100000).nullable().default(null),
        starts_at: z.string().nullable().default(null),
        ends_at: z.string().nullable().default(null),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const { error } = await supabaseAdmin.from("lounge_promotions").upsert({ ...data, venue_id: vid } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lounge_promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Settings ----------------
export const getLoungeSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const [settings, venue] = await Promise.all([
      supabaseAdmin.from("lounge_settings").select("*").eq("venue_id", vid).maybeSingle(),
      supabaseAdmin.from("lounge_venues").select("id, name, tagline, about").eq("id", vid).maybeSingle(),
    ]);
    return { settings: settings.data, venue: venue.data };
  });

export const updateLoungeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        tagline: z.string().trim().max(200).default(""),
        about: z.string().trim().max(3000).default(""),
        logo_url: z.string().trim().max(500).default(""),
        cover_image_url: z.string().trim().max(500).default(""),
        phone: z.string().trim().max(40).default(""),
        whatsapp_number: z.string().trim().max(40).default(""),
        email: z.string().trim().max(200).default(""),
        address: z.string().trim().max(300).default(""),
        maps_url: z.string().trim().max(700).default(""),
        maps_embed_url: z.string().trim().max(1200).default(""),
        opening_hours: z.string().trim().max(300).default(""),
        facebook_url: z.string().trim().max(300).default(""),
        instagram_url: z.string().trim().max(300).default(""),
        currency: z.string().trim().max(10).default("BWP"),
        delivery_enabled: z.boolean().default(true),
        delivery_fee_bwp: z.number().min(0).max(10000).default(0),
        minimum_order_bwp: z.number().min(0).max(100000).default(0),
        delivery_radius_km: z.number().min(0).max(500).default(5),
        distance_note: z.string().trim().max(200).default(""),
        estimated_prep_minutes: z.number().int().min(0).max(600).default(30),
        estimated_delivery_minutes: z.number().int().min(0).max(600).default(45),
        delivery_instructions: z.string().trim().max(600).default(""),
        payment_methods: z.array(z.enum(["cash", "bank_transfer", "orange_money", "card_manual"])).min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const { name, tagline, about, ...settings } = data;

    const { error: vErr } = await supabaseAdmin
      .from("lounge_venues")
      .update({ name, tagline, about })
      .eq("id", vid);
    if (vErr) throw new Error(vErr.message);

    const { error } = await supabaseAdmin
      .from("lounge_settings")
      .update(settings as never)
      .eq("venue_id", vid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Reports ----------------
export const getLoungeReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vid = await venueId();
    const fromIso = new Date(`${data.from}T00:00:00.000Z`).toISOString();
    const toIso = new Date(`${data.to}T23:59:59.999Z`).toISOString();

    const { data: orders, error } = await supabaseAdmin
      .from("lounge_orders")
      .select("id, reference, status, order_type, payment_method, total_bwp, created_at")
      .eq("venue_id", vid)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at");
    if (error) throw new Error(error.message);

    const ids = (orders ?? []).map((o) => o.id);
    const { data: items } = ids.length
      ? await supabaseAdmin
          .from("lounge_order_items")
          .select("order_id, item_name, category_name, quantity, line_total_bwp")
          .in("order_id", ids)
      : { data: [] as Array<{ order_id: string; item_name: string; category_name: string; quantity: number; line_total_bwp: number }> };

    const valid = (orders ?? []).filter((o) => o.status !== "cancelled");
    const byDay = new Map<string, { orders: number; sales: number }>();
    for (const o of valid) {
      const day = o.created_at.slice(0, 10);
      const cur = byDay.get(day) ?? { orders: 0, sales: 0 };
      byDay.set(day, { orders: cur.orders + 1, sales: cur.sales + Number(o.total_bwp) });
    }
    const cancelledIds = new Set((orders ?? []).filter((o) => o.status === "cancelled").map((o) => o.id));
    const liveItems = (items ?? []).filter((i) => !cancelledIds.has(i.order_id));

    const agg = <T extends string>(rows: Array<{ key: T; qty: number; sales: number }>) => {
      const m = new Map<string, { qty: number; sales: number }>();
      for (const r of rows) {
        const cur = m.get(r.key) ?? { qty: 0, sales: 0 };
        m.set(r.key, { qty: cur.qty + r.qty, sales: cur.sales + r.sales });
      }
      return [...m.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.sales - a.sales);
    };

    const totalSales = valid.reduce((s, o) => s + Number(o.total_bwp), 0);

    return {
      summary: {
        orders: valid.length,
        cancelled: (orders ?? []).length - valid.length,
        sales: totalSales,
        average_order: valid.length ? totalSales / valid.length : 0,
        delivery: valid.filter((o) => o.order_type === "delivery").length,
        pickup: valid.filter((o) => o.order_type === "pickup").length,
      },
      by_day: [...byDay.entries()].map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
      by_category: agg(liveItems.map((i) => ({ key: i.category_name || "Uncategorised", qty: i.quantity, sales: Number(i.line_total_bwp) }))),
      by_item: agg(liveItems.map((i) => ({ key: i.item_name, qty: i.quantity, sales: Number(i.line_total_bwp) }))).slice(0, 20),
      by_payment: agg(valid.map((o) => ({ key: o.payment_method, qty: 1, sales: Number(o.total_bwp) }))),
      orders_list: (orders ?? []).map((o) => ({
        reference: o.reference,
        date: o.created_at.slice(0, 10),
        status: o.status,
        type: o.order_type,
        payment: o.payment_method,
        total: Number(o.total_bwp),
      })),
    };
  });
