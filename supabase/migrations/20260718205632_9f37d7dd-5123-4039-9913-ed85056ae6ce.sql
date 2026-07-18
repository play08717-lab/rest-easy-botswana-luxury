
-- Checklist template items per apartment
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_items_apartment ON public.checklist_items(apartment_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklist_items TO service_role;

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can view checklist items"
  ON public.checklist_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins manage checklist items"
  ON public.checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER trg_checklist_items_updated
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Completed checklist runs (one row per time apartment is marked ready)
CREATE TABLE public.checklist_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_item_ids UUID[] NOT NULL DEFAULT '{}',
  item_labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_runs_apartment ON public.checklist_runs(apartment_id, created_at DESC);

GRANT SELECT, INSERT ON public.checklist_runs TO authenticated;
GRANT ALL ON public.checklist_runs TO service_role;

ALTER TABLE public.checklist_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can view checklist runs"
  ON public.checklist_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff can insert checklist runs"
  ON public.checklist_runs FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'receptionist')
    OR public.has_role(auth.uid(), 'housekeeping')
  );
