
CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_type text NOT NULL CHECK (lookup_type IN ('booking_reference','email')),
  lookup_value text NOT NULL,
  requester_name text,
  requester_email text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','completed','rejected')),
  matched_booking_ids uuid[] DEFAULT '{}',
  matched_profile_id uuid,
  notes text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.deletion_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deletion_requests TO authenticated;
GRANT ALL ON public.deletion_requests TO service_role;

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a deletion request"
  ON public.deletion_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can view deletion requests"
  ON public.deletion_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update deletion requests"
  ON public.deletion_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER trg_deletion_requests_updated_at
  BEFORE UPDATE ON public.deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
