
-- Pin search_path on remaining function
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'RE-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_ref_seq')::text, 6, '0');
$$;

-- Trigger helpers: never called from API, revoke everything
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_booking_ref() FROM PUBLIC, anon;

-- has_role: only authenticated code should ask about roles
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- search_availability stays callable by anon/authenticated (public search)
REVOKE ALL ON FUNCTION public.search_availability(DATE, DATE, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_availability(DATE, DATE, INT) TO anon, authenticated, service_role;
