import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

// ---------------- Public: search availability ----------------
const searchSchema = z.object({
  check_in: dateStr,
  check_out: dateStr,
  guests: z.number().int().min(1).max(10),
});

export const searchAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => searchSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("search_availability", {
      _check_in: data.check_in,
      _check_out: data.check_out,
      _guests: data.guests,
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------------- Auth: create booking ----------------
const consentTrue = z.literal(true, { errorMap: () => ({ message: "Required" }) });
const createSchema = z.object({
  apartment_id: z.string().uuid(),
  check_in: dateStr,
  check_out: dateStr,
  guests: z.number().int().min(1).max(10),
  guest_name: z.string().trim().min(1).max(120),
  guest_email: z.string().trim().email().max(200),
  guest_phone: z.string().trim().min(5).max(30),
  guest_id_number: z.string().trim().max(60).optional().nullable(),
  special_requests: z.string().trim().max(1000).optional().nullable(),
  consents: z.object({
    privacy: consentTrue,
    terms: consentTrue,
    cancellation: consentTrue,
    house_rules: consentTrue,
  }),
});


export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Look up unit to price server-side
    const { data: apt, error: aptErr } = await supabase
      .from("apartments")
      .select("id, name, base_rate_bwp, max_guests, active")
      .eq("id", data.apartment_id)
      .maybeSingle();
    if (aptErr) throw new Error(aptErr.message);
    if (!apt || !apt.active) throw new Error("Apartment not available");
    if (data.guests > apt.max_guests) throw new Error("Too many guests for this apartment");

    // Re-check availability atomically via RPC (privileged: RPC is not client-callable)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: avail, error: availErr } = await supabaseAdmin.rpc("search_availability", {
      _check_in: data.check_in,
      _check_out: data.check_out,
      _guests: data.guests,
    });
    if (availErr) throw new Error(availErr.message);
    if (!avail?.some((r) => r.apartment_id === data.apartment_id)) {
      throw new Error("Sorry — these dates were just taken. Please choose different dates.");
    }

    const nights = Math.round(
      (new Date(data.check_out).getTime() - new Date(data.check_in).getTime()) / 86_400_000,
    );
    if (nights < 1) throw new Error("Stay must be at least one night");
    const nightly = Number(apt.base_rate_bwp);
    const total = nightly * nights;

    // Update profile contact info
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.guest_name,
      phone: data.guest_phone,
      id_number: data.guest_id_number ?? null,
    });

    // hold_expires_at pulled from settings
    const { data: settings } = await supabase.from("settings").select("hold_hours").eq("id", 1).maybeSingle();
    const holdHours = settings?.hold_hours ?? 24;
    const holdExpires = new Date(Date.now() + holdHours * 3_600_000).toISOString();

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        apartment_id: data.apartment_id,
        guest_id: userId,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        guest_id_number: data.guest_id_number ?? null,
        check_in: data.check_in,
        check_out: data.check_out,
        guests: data.guests,
        nightly_rate_bwp: nightly,
        nights,
        total_bwp: total,
        status: "pending_payment",
        special_requests: data.special_requests ?? null,
        hold_expires_at: holdExpires,
        consents: { ...data.consents, accepted_at: new Date().toISOString() },
      })
      .select("id, reference")
      .single();
    if (bookErr) throw new Error(bookErr.message);

    return booking;
  });


// ---------------- Auth: my bookings ----------------
export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("bookings")
      .select("id, reference, check_in, check_out, guests, nights, nightly_rate_bwp, total_bwp, status, created_at, apartment_id, apartments(name, slug)")
      .eq("guest_id", userId)
      .order("check_in", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------------- Auth: booking by id (guest or admin) ----------------
export const getBookingById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, apartments(name, slug, description)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) throw new Error("Booking not found");

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", data.id)
      .order("recorded_at", { ascending: false });

    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();

    return { booking, payments: payments ?? [], settings };
  });

// ---------------- Auth: cancel booking ----------------
export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, guest_id, status, check_in")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) throw new Error("Booking not found");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin && booking.guest_id !== userId) throw new Error("Not allowed");

    if (["cancelled", "checked_out", "no_show"].includes(booking.status)) {
      throw new Error("Booking cannot be cancelled from its current state");
    }

    // Enforce cancellation window for guests
    if (!isAdmin) {
      const { data: settings } = await supabase.from("settings").select("cancellation_hours").eq("id", 1).maybeSingle();
      const hrs = settings?.cancellation_hours ?? 48;
      const cutoff = new Date(booking.check_in).getTime() - hrs * 3_600_000;
      if (Date.now() > cutoff) {
        throw new Error(`Cancellation window closed (${hrs}h before check-in)`);
      }
    }

    const { error: updErr } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: data.reason ?? null })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);
    return { ok: true };
  });

// ---------------- Admin: all bookings ----------------
export const getAdminBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabase
      .from("bookings")
      .select("id, reference, check_in, check_out, guests, total_bwp, status, guest_name, guest_email, guest_phone, created_at, apartments(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------------- Admin: dashboard stats ----------------
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";

    const [ci, co, pending, revenue] = await Promise.all([
      supabase.from("bookings").select("id, reference, guest_name, apartments(name)").eq("check_in", today).in("status", ["confirmed", "checked_in"]),
      supabase.from("bookings").select("id, reference, guest_name, apartments(name)").eq("check_out", today).in("status", ["confirmed", "checked_in"]),
      supabase.from("bookings").select("id, reference, guest_name, total_bwp, created_at").eq("status", "pending_payment").order("created_at", { ascending: false }).limit(10),
      supabase.from("bookings").select("total_bwp").in("status", ["confirmed", "checked_in", "checked_out"]).gte("check_in", monthStart),
    ]);

    const monthRevenue = (revenue.data ?? []).reduce((s, r) => s + Number(r.total_bwp), 0);
    return {
      checkInsToday: ci.data ?? [],
      checkOutsToday: co.data ?? [],
      pendingPayments: pending.data ?? [],
      monthRevenue,
    };
  });

// ---------------- Admin: mark paid ----------------
export const markBookingPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        booking_id: z.string().uuid(),
        amount_bwp: z.number().positive(),
        method: z.enum(["bank_transfer", "cash", "orange_money", "other"]).default("bank_transfer"),
        reference: z.string().trim().max(120).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { error: payErr } = await supabase.from("payments").insert({
      booking_id: data.booking_id,
      amount_bwp: data.amount_bwp,
      method: data.method,
      reference: data.reference ?? null,
      note: data.note ?? null,
      recorded_by: userId,
    });
    if (payErr) throw new Error(payErr.message);

    const { error: updErr } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", data.booking_id);
    if (updErr) throw new Error(updErr.message);

    await supabase.from("activity_log").insert({
      actor_id: userId,
      action: "booking_marked_paid",
      target_type: "booking",
      target_id: data.booking_id,
      meta: { amount: data.amount_bwp, method: data.method },
    });

    return { ok: true };
  });

// ---------------- Admin: update settings ----------------
export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bank_name: z.string().max(120),
        bank_account_name: z.string().max(120),
        bank_account_number: z.string().max(60),
        bank_branch: z.string().max(120),
        bank_swift: z.string().max(60),
        check_in_time: z.string().max(10),
        check_out_time: z.string().max(10),
        cancellation_hours: z.number().int().min(0).max(720),
        hold_hours: z.number().int().min(1).max(168),
        contact_email: z.string().max(200),
        contact_phone: z.string().max(30),
        whatsapp_number: z.string().max(30),
        address: z.string().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Public: get settings (safe read subset) ----------------
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("settings")
    .select("check_in_time, check_out_time, cancellation_hours, contact_email, contact_phone, whatsapp_number, address")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

// ---------------- Admin: full settings ----------------
export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// ---------------- Admin: block dates ----------------
export const blockDates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        apartment_id: z.string().uuid(),
        start_date: dateStr,
        end_date: dateStr,
        reason: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("blocked_dates").insert({
      apartment_id: data.apartment_id,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason ?? null,
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Public: availability calendar (next N days) ----------------
export const getAvailabilityCalendar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(7).max(180).default(90) }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + data.days * 86_400_000);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const [aptRes, bookRes, blockRes] = await Promise.all([
      supabaseAdmin
        .from("apartments")
        .select("id, slug, name, base_rate_bwp, max_guests")
        .eq("active", true)
        .order("base_rate_bwp", { ascending: true }),
      supabaseAdmin
        .from("bookings")
        .select("apartment_id, check_in, check_out, status")
        .in("status", ["pending_payment", "confirmed", "checked_in"])
        .lt("check_in", endStr)
        .gt("check_out", startStr),
      supabaseAdmin
        .from("blocked_dates")
        .select("apartment_id, start_date, end_date")
        .lt("start_date", endStr)
        .gt("end_date", startStr),
    ]);
    if (aptRes.error) throw new Error(aptRes.error.message);

    const occupied: Record<string, string[]> = {};
    const addRange = (aptId: string, from: string, to: string) => {
      const list = (occupied[aptId] ??= []);
      let cur = new Date(`${from}T00:00:00Z`).getTime();
      const stop = new Date(`${to}T00:00:00Z`).getTime();
      const floor = start.getTime();
      const ceil = end.getTime();
      while (cur < stop) {
        if (cur >= floor && cur <= ceil) list.push(new Date(cur).toISOString().slice(0, 10));
        cur += 86_400_000;
      }
    };
    for (const b of bookRes.data ?? []) addRange(b.apartment_id, b.check_in, b.check_out);
    for (const b of blockRes.data ?? []) addRange(b.apartment_id, b.start_date, b.end_date);

    return {
      start: startStr,
      days: data.days,
      apartments: (aptRes.data ?? []).map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        base_rate_bwp: Number(a.base_rate_bwp),
        max_guests: a.max_guests,
        occupied: Array.from(new Set(occupied[a.id] ?? [])).sort(),
      })),
    };
  });
