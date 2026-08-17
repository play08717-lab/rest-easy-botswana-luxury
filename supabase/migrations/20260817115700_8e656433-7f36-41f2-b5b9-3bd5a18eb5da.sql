-- 1. settings: column-level grants so anon cannot read banking fields
REVOKE SELECT ON public.settings FROM anon;
GRANT SELECT (id, check_in_time, check_out_time, cancellation_hours, cancellation_policy,
  contact_email, contact_phone, whatsapp_number, address, welcome_message, tax_rate,
  logo_url, facebook_url, instagram_url, updated_at) ON public.settings TO anon;
GRANT SELECT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;

-- 2. blocked_dates: hide internal reason notes from anon
REVOKE SELECT ON public.blocked_dates FROM anon;
GRANT SELECT (id, apartment_id, start_date, end_date, created_at) ON public.blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;
GRANT ALL ON public.blocked_dates TO service_role;

-- 3. checklist tables: staff only
DROP POLICY IF EXISTS "authenticated can view checklist items" ON public.checklist_items;
CREATE POLICY "staff can view checklist items" ON public.checklist_items
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'housekeeping'::app_role)
  );

DROP POLICY IF EXISTS "authenticated can view checklist runs" ON public.checklist_runs;
CREATE POLICY "staff can view checklist runs" ON public.checklist_runs
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'housekeeping'::app_role)
  );

-- 4. SECURITY DEFINER functions: not directly callable via the API
REVOKE ALL ON FUNCTION public.search_availability(date, date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_availability(date, date, integer) TO service_role;

REVOKE ALL ON FUNCTION public.generate_booking_ref() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_booking_ref() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role must stay callable by signed-in users: RLS policies evaluate it as the caller
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;