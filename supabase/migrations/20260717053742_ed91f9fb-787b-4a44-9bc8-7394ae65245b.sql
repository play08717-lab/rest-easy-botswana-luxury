
-- Extend enums
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'orange_money';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';

-- apartments extensions
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS apartment_number TEXT,
  ADD COLUMN IF NOT EXISTS weekend_rate_bwp NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS holiday_rate_bwp NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cleaning_status TEXT NOT NULL DEFAULT 'clean',
  ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available';

-- bookings extensions
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_reg TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;

-- payments extensions
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_refund BOOLEAN NOT NULL DEFAULT false;

-- Allow bookings.guest_id nullable for walk-ins (admin-created without account)
ALTER TABLE public.bookings ALTER COLUMN guest_id DROP NOT NULL;

-- holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rate_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.holidays TO anon, authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin manages holidays" ON public.holidays FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- special rates
CREATE TABLE IF NOT EXISTS public.special_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate_bwp NUMERIC(10,2) NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
GRANT SELECT ON public.special_rates TO anon, authenticated;
GRANT ALL ON public.special_rates TO service_role;
ALTER TABLE public.special_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads special rates" ON public.special_rates FOR SELECT USING (true);
CREATE POLICY "Admin manages special rates" ON public.special_rates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- settings extensions
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT NOT NULL DEFAULT '';
