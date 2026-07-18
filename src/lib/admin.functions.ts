import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ---------------- KPI dashboard ----------------
export const getManagerKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const [bookingsAll, monthPayments, todayPayments, aptCount, occupiedToday, pendingUnpaid, guests] = await Promise.all([
      supabase.from("bookings").select("id, status, guest_id, guest_email, created_at, check_in, check_out, total_bwp"),
      supabase.from("payments").select("amount_bwp, is_refund").gte("recorded_at", monthStart),
      supabase.from("payments").select("amount_bwp, is_refund").gte("recorded_at", today),
      supabase.from("apartments").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("bookings").select("apartment_id").in("status", ["confirmed", "checked_in"]).lte("check_in", today).gt("check_out", today),
      supabase.from("bookings").select("total_bwp").eq("status", "pending_payment"),
      supabase.from("bookings").select("guest_id, guest_email, created_at"),
    ]);

    const all = bookingsAll.data ?? [];
    const totalApts = aptCount.count ?? 0;
    const roomsOccupied = new Set((occupiedToday.data ?? []).map((r) => r.apartment_id)).size;
    const roomsAvailable = Math.max(totalApts - roomsOccupied, 0);
    const todayRevenue = (todayPayments.data ?? []).reduce((s, p) => s + (p.is_refund ? -Number(p.amount_bwp) : Number(p.amount_bwp)), 0);
    const monthRevenue = (monthPayments.data ?? []).reduce((s, p) => s + (p.is_refund ? -Number(p.amount_bwp) : Number(p.amount_bwp)), 0);
    const outstanding = (pendingUnpaid.data ?? []).reduce((s, r) => s + Number(r.total_bwp), 0);

    const byStatus = (s: string) => all.filter((b) => b.status === s).length;
    const expectedIn = all.filter((b) => b.check_in === today && ["confirmed", "checked_in", "pending_payment"].includes(b.status)).length;
    const expectedOut = all.filter((b) => b.check_out === today && ["confirmed", "checked_in"].includes(b.status)).length;

    const emailCounts = new Map<string, number>();
    (guests.data ?? []).forEach((g) => {
      const k = g.guest_email ?? g.guest_id ?? "";
      if (k) emailCounts.set(k, (emailCounts.get(k) ?? 0) + 1);
    });
    const repeatGuests = Array.from(emailCounts.values()).filter((c) => c > 1).length;
    const newGuestsThisMonth = new Set(
      (guests.data ?? [])
        .filter((g) => g.created_at >= monthStart && g.created_at < monthEnd)
        .map((g) => g.guest_email ?? g.guest_id),
    ).size;

    return {
      todayRevenue,
      monthRevenue,
      totalBookings: all.length,
      confirmed: byStatus("confirmed") + byStatus("checked_in"),
      pending: byStatus("pending_payment"),
      cancelled: byStatus("cancelled"),
      roomsOccupied,
      roomsAvailable,
      totalApts,
      occupancyRate: totalApts ? Math.round((roomsOccupied / totalApts) * 100) : 0,
      expectedIn,
      expectedOut,
      outstanding,
      monthProfit: monthRevenue,
      repeatGuests,
      newGuestsThisMonth,
    };
  });

// ---------------- Calendar ----------------
export const getCalendarData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ start: dateStr, end: dateStr }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const [bookings, blocks, apartments, holidays] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, reference, guest_name, apartment_id, check_in, check_out, status, apartments(name)")
        .lt("check_in", data.end)
        .gt("check_out", data.start)
        .not("status", "in", "(cancelled,no_show)"),
      supabase.from("blocked_dates").select("id, apartment_id, start_date, end_date, reason").lt("start_date", data.end).gt("end_date", data.start),
      supabase.from("apartments").select("id, name, apartment_number").eq("active", true).order("sort_order"),
      supabase.from("holidays").select("date, name").gte("date", data.start).lt("date", data.end),
    ]);
    return {
      bookings: bookings.data ?? [],
      blocks: blocks.data ?? [],
      apartments: apartments.data ?? [],
      holidays: holidays.data ?? [],
    };
  });

// ---------------- Apartments CRUD ----------------
export const listApartmentsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase.from("apartments").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const apartmentSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  eyebrow: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2000).default(""),
  apartment_number: z.string().trim().max(20).default(""),
  max_guests: z.number().int().min(1).max(20),
  base_rate_bwp: z.number().positive(),
  weekend_rate_bwp: z.number().positive().nullable().optional(),
  holiday_rate_bwp: z.number().positive().nullable().optional(),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const upsertApartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => apartmentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("apartments").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("apartments").update({ active: false }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCleaningStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      apartment_id: z.string().uuid(),
      cleaning_status: z.enum(["clean", "dirty", "cleaning", "maintenance"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("apartments").update({ cleaning_status: data.cleaning_status }).eq("id", data.apartment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Housekeeping check-in readiness ----------------
export const getCheckInReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    const [arrivalsToday, arrivalsTomorrow, apartments] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, reference, guest_name, guests, check_in, check_out, apartment_id, apartments(name, apartment_number, cleaning_status)")
        .eq("check_in", today)
        .in("status", ["confirmed", "pending_payment"]),
      supabase
        .from("bookings")
        .select("id, reference, guest_name, guests, check_in, check_out, apartment_id, apartments(name, apartment_number, cleaning_status)")
        .eq("check_in", tomorrow)
        .in("status", ["confirmed", "pending_payment"]),
      supabase.from("apartments").select("id, name, apartment_number, cleaning_status").eq("active", true).order("sort_order"),
    ]);

    return {
      today,
      tomorrow,
      arrivalsToday: arrivalsToday.data ?? [],
      arrivalsTomorrow: arrivalsTomorrow.data ?? [],
      apartments: apartments.data ?? [],
    };
  });

// ---------------- Guests directory ----------------
export const listGuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ search: z.string().trim().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    let query = supabase
      .from("bookings")
      .select("guest_id, guest_name, guest_email, guest_phone, guest_id_number, nationality, vehicle_reg, total_bwp, check_in, status")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.search) {
      const s = `%${data.search}%`;
      query = query.or(`guest_name.ilike.${s},guest_email.ilike.${s},guest_phone.ilike.${s}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const map = new Map<string, {
      email: string;
      name: string;
      phone: string;
      id_number: string | null;
      nationality: string | null;
      vehicle_reg: string | null;
      stays: number;
      total_spent: number;
      last_stay: string;
    }>();
    (rows ?? []).forEach((r) => {
      const k = r.guest_email ?? r.guest_phone ?? "";
      if (!k) return;
      const prev = map.get(k);
      const spent = ["confirmed", "checked_in", "checked_out"].includes(r.status) ? Number(r.total_bwp) : 0;
      if (prev) {
        prev.stays += 1;
        prev.total_spent += spent;
        if (r.check_in > prev.last_stay) prev.last_stay = r.check_in;
      } else {
        map.set(k, {
          email: r.guest_email,
          name: r.guest_name,
          phone: r.guest_phone,
          id_number: r.guest_id_number,
          nationality: r.nationality,
          vehicle_reg: r.vehicle_reg,
          stays: 1,
          total_spent: spent,
          last_stay: r.check_in,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.last_stay.localeCompare(a.last_stay));
  });

// ---------------- Walk-in / admin-created booking ----------------
export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      apartment_id: z.string().uuid(),
      check_in: dateStr,
      check_out: dateStr,
      guests: z.number().int().min(1).max(20),
      guest_name: z.string().trim().min(1).max(120),
      guest_email: z.string().trim().email().max(200),
      guest_phone: z.string().trim().min(5).max(30),
      nationality: z.string().trim().max(60).optional().nullable(),
      vehicle_reg: z.string().trim().max(30).optional().nullable(),
      source: z.enum(["direct", "walk_in", "phone", "whatsapp", "group"]).default("walk_in"),
      is_group: z.boolean().default(false),
      status: z.enum(["pending_payment", "confirmed", "checked_in"]).default("confirmed"),
      notes: z.string().trim().max(1000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: apt, error: aptErr } = await supabase.from("apartments").select("base_rate_bwp, max_guests").eq("id", data.apartment_id).maybeSingle();
    if (aptErr || !apt) throw new Error("Apartment not found");
    const nights = Math.round((new Date(data.check_out).getTime() - new Date(data.check_in).getTime()) / 86_400_000);
    if (nights < 1) throw new Error("Invalid dates");
    const nightly = Number(apt.base_rate_bwp);
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        apartment_id: data.apartment_id,
        guest_id: null,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        nationality: data.nationality ?? null,
        vehicle_reg: data.vehicle_reg ?? null,
        check_in: data.check_in,
        check_out: data.check_out,
        guests: data.guests,
        nightly_rate_bwp: nightly,
        nights,
        total_bwp: nightly * nights,
        status: data.status,
        source: data.source,
        is_group: data.is_group,
        notes: data.notes ?? null,
      })

      .select("id, reference")
      .single();
    if (error) throw new Error(error.message);
    return booking;
  });

// ---------------- Check-in / Check-out / No-show ----------------
export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["check_in", "check_out", "no_show"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const now = new Date().toISOString();
    if (data.action === "check_in") {
      const { error } = await supabase.from("bookings").update({ status: "checked_in", checked_in_at: now }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else if (data.action === "check_out") {
      const { error } = await supabase.from("bookings").update({ status: "checked_out", checked_out_at: now }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("bookings").update({ status: "no_show" }).eq("id", data.id);
      if (error) throw new Error(error.message);
    }


    if (data.action === "check_out") {
      const { data: b } = await supabase.from("bookings").select("apartment_id").eq("id", data.id).maybeSingle();
      if (b) await supabase.from("apartments").update({ cleaning_status: "dirty" }).eq("id", b.apartment_id);
    }
    return { ok: true };
  });

// ---------------- Extend booking dates ----------------
export const extendBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), new_check_out: dateStr }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: b, error } = await supabase.from("bookings").select("check_in, nightly_rate_bwp").eq("id", data.id).maybeSingle();
    if (error || !b) throw new Error("Booking not found");
    const nights = Math.round((new Date(data.new_check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000);
    if (nights < 1) throw new Error("Invalid new date");
    const total = Number(b.nightly_rate_bwp) * nights;
    const { error: uErr } = await supabase.from("bookings").update({ check_out: data.new_check_out, nights, total_bwp: total }).eq("id", data.id);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

// ---------------- Reports (revenue by period) ----------------
export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ start: dateStr, end: dateStr }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const [payments, bookings] = await Promise.all([
      supabase.from("payments").select("amount_bwp, method, is_refund, recorded_at, booking_id").gte("recorded_at", data.start).lt("recorded_at", data.end + "T23:59:59"),
      supabase.from("bookings").select("id, reference, guest_name, check_in, check_out, nights, total_bwp, status, apartments(name)").gte("check_in", data.start).lt("check_in", data.end),
    ]);
    const revenue = (payments.data ?? []).reduce((s, p) => s + (p.is_refund ? -Number(p.amount_bwp) : Number(p.amount_bwp)), 0);
    const byMethod: Record<string, number> = {};
    (payments.data ?? []).forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + (p.is_refund ? -Number(p.amount_bwp) : Number(p.amount_bwp));
    });
    return { revenue, byMethod, payments: payments.data ?? [], bookings: bookings.data ?? [] };
  });
