import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitSchema = z.object({
  lookup_type: z.enum(["booking_reference", "email"]),
  lookup_value: z.string().trim().min(3).max(200),
  requester_name: z.string().trim().max(120).optional().nullable(),
  requester_email: z.string().trim().email().max(200).optional().nullable(),
  reason: z.string().trim().max(1000).optional().nullable(),
});

// ---------------- Public submission (no auth) ----------------
export const submitDeletionRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false } });

    // Search for matches (best-effort; done server-side with anon so RLS applies)
    // Anon can't read bookings; use admin client to compute matches
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let matched_booking_ids: string[] = [];
    let matched_profile_id: string | null = null;

    if (data.lookup_type === "booking_reference") {
      const { data: b } = await supabaseAdmin
        .from("bookings")
        .select("id, guest_id")
        .eq("reference", data.lookup_value.trim())
        .maybeSingle();
      if (b) {
        matched_booking_ids = [b.id];
        matched_profile_id = b.guest_id ?? null;
      }
    } else {
      const email = data.lookup_value.trim().toLowerCase();
      const { data: bs } = await supabaseAdmin
        .from("bookings")
        .select("id, guest_id")
        .ilike("guest_email", email);
      matched_booking_ids = (bs ?? []).map((r) => r.id);
      matched_profile_id = (bs ?? []).find((r) => r.guest_id)?.guest_id ?? null;
    }

    const { data: inserted, error } = await sb
      .from("deletion_requests")
      .insert({
        lookup_type: data.lookup_type,
        lookup_value: data.lookup_value.trim(),
        requester_name: data.requester_name ?? null,
        requester_email: data.requester_email ?? null,
        reason: data.reason ?? null,
        matched_booking_ids,
        matched_profile_id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, matches: matched_booking_ids.length };
  });

// ---------------- Public status lookup by request id ----------------
export const getDeletionRequestStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r, error } = await supabaseAdmin
      .from("deletion_requests")
      .select("id, status, created_at, processed_at, notes, lookup_type, lookup_value")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Request not found");
    return r;
  });

// ---------------- Admin: list ----------------
export const listDeletionRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("deletion_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------------- Admin: update status / notes ----------------
export const updateDeletionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "in_review", "completed", "rejected"]),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: {
      status: typeof data.status;
      notes: string | null;
      processed_by?: string;
      processed_at?: string;
    } = { status: data.status, notes: data.notes ?? null };
    if (data.status === "completed" || data.status === "rejected") {
      patch.processed_by = userId;
      patch.processed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("deletion_requests").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("activity_log").insert({
      actor_id: userId,
      action: "deletion_request.update",
      target_type: "deletion_requests",
      target_id: data.id,
      meta: { status: data.status },
    });
    return { ok: true };
  });

// ---------------- Admin: execute (nullify PII on matched bookings) ----------------
export const executeDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: req, error: rErr } = await supabase
      .from("deletion_requests")
      .select("id, matched_booking_ids, matched_profile_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr || !req) throw new Error("Request not found");
    if (req.status === "completed") throw new Error("Already completed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids: string[] = req.matched_booking_ids ?? [];
    let bookingsRedacted = 0;
    if (ids.length) {
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          guest_name: "[REDACTED]",
          guest_email: `redacted+${req.id}@deleted.local`,
          guest_phone: "[REDACTED]",
          nationality: null,
          vehicle_reg: null,
          notes: null,
          guest_id: null,
        })
        .in("id", ids);
      if (error) throw new Error(error.message);
      bookingsRedacted = ids.length;
    }
    let profileDeleted = false;
    if (req.matched_profile_id) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", req.matched_profile_id);
      if (!error) profileDeleted = true;
    }

    await supabase.from("deletion_requests").update({
      status: "completed",
      processed_by: userId,
      processed_at: new Date().toISOString(),
      notes: `Redacted ${bookingsRedacted} booking(s)${profileDeleted ? "; profile deleted" : ""}.`,
    }).eq("id", data.id);

    await supabase.from("activity_log").insert({
      actor_id: userId,
      action: "deletion_request.execute",
      target_type: "deletion_requests",
      target_id: data.id,
      meta: { bookingsRedacted, profileDeleted },
    });

    return { ok: true, bookingsRedacted, profileDeleted };
  });
