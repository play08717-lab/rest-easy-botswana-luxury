
-- Enums
CREATE TYPE public.app_role AS ENUM ('guest', 'admin', 'receptionist', 'housekeeping', 'manager');
CREATE TYPE public.booking_status AS ENUM ('pending_payment','confirmed','cancelled','checked_in','checked_out','no_show');
CREATE TYPE public.payment_method AS ENUM ('bank_transfer','cash','other');
CREATE TYPE public.message_sender AS ENUM ('guest','admin');

-- Utility: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  id_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES (separate table, never on profile)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Trigger: create profile + guest role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'guest') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- APARTMENTS (publicly readable)
CREATE TABLE public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID, -- reserved for phase 2 multi-property
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  base_rate_bwp NUMERIC(10,2) NOT NULL,
  max_guests INT NOT NULL DEFAULT 2,
  images TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.apartments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.apartments TO authenticated;
GRANT ALL ON public.apartments TO service_role;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active apartments" ON public.apartments FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages apartments" ON public.apartments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_apartments_updated BEFORE UPDATE ON public.apartments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BOOKINGS
CREATE SEQUENCE public.booking_ref_seq START 1000;
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  SELECT 'RE-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_ref_seq')::text, 6, '0');
$$;

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL DEFAULT public.generate_booking_ref(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_id_number TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  nightly_rate_bwp NUMERIC(10,2) NOT NULL,
  nights INT NOT NULL,
  total_bwp NUMERIC(10,2) NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending_payment',
  booking_type TEXT NOT NULL DEFAULT 'stay', -- reserved for phase 2 (tour/transfer/rental)
  special_requests TEXT,
  hold_expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_dates_valid CHECK (check_out > check_in),
  CONSTRAINT bookings_guests_positive CHECK (guests > 0)
);
CREATE INDEX bookings_apartment_dates_idx ON public.bookings(apartment_id, check_in, check_out) WHERE status IN ('pending_payment','confirmed','checked_in');
CREATE INDEX bookings_guest_idx ON public.bookings(guest_id);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests read own bookings" ON public.bookings FOR SELECT TO authenticated USING (guest_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Guests create own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (guest_id = auth.uid());
CREATE POLICY "Guests cancel own bookings" ON public.bookings FOR UPDATE TO authenticated USING (guest_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (guest_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount_bwp NUMERIC(10,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  proof_url TEXT,
  note TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests read own payments" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.guest_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Admin records payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BLOCKED DATES
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blocked_dates_valid CHECK (end_date > start_date)
);
GRANT SELECT ON public.blocked_dates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;
GRANT ALL ON public.blocked_dates TO service_role;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads blocked dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Admin manages blocked dates" ON public.blocked_dates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender public.message_sender NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.guest_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Booking parties send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.guest_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);

-- NOTIFICATION LOG
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'email' | 'whatsapp'
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads notification log" ON public.notification_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SETTINGS (singleton)
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  bank_name TEXT NOT NULL DEFAULT '',
  bank_account_name TEXT NOT NULL DEFAULT '',
  bank_account_number TEXT NOT NULL DEFAULT '',
  bank_branch TEXT NOT NULL DEFAULT '',
  bank_swift TEXT NOT NULL DEFAULT '',
  check_in_time TEXT NOT NULL DEFAULT '14:00',
  check_out_time TEXT NOT NULL DEFAULT '10:00',
  cancellation_hours INT NOT NULL DEFAULT 48,
  hold_hours INT NOT NULL DEFAULT 24,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '+267 71 621 866',
  whatsapp_number TEXT NOT NULL DEFAULT '26771621866',
  address TEXT NOT NULL DEFAULT 'Plot 2903, Rakops, Botswana',
  welcome_message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin updates settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ACTIVITY LOG (admin audit trail)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads activity log" ON public.activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes activity log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed apartments
INSERT INTO public.apartments (slug, name, eyebrow, description, features, base_rate_bwp, max_guests, sort_order) VALUES
('executive-studio','The Executive Studio','Signature','A refined studio for the solo traveller or couple, dressed in crisp linen and warm lamplight.',
 ARRAY['Queen bed','Private en-suite','Kitchenette','Private entrance'], 400.00, 2, 1),
('garden-suite','The Garden Suite','Garden-facing','A quiet suite opening onto the garden courtyard — the calmest corner of the property.',
 ARRAY['Queen bed','En-suite bathroom','Kitchenette','Garden view'], 500.00, 2, 2),
('master-apartment','The Master Apartment','Most spacious','Our most generous residence, with a full kitchen and dining nook — designed for longer stays.',
 ARRAY['King bed','Full kitchen','Living & dining area','Private patio'], 650.00, 4, 3);

-- Availability search RPC (public)
CREATE OR REPLACE FUNCTION public.search_availability(_check_in DATE, _check_out DATE, _guests INT DEFAULT 1)
RETURNS TABLE (
  apartment_id UUID, slug TEXT, name TEXT, eyebrow TEXT, description TEXT,
  features TEXT[], images TEXT[], max_guests INT, base_rate_bwp NUMERIC,
  nights INT, total_bwp NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    a.id, a.slug, a.name, a.eyebrow, a.description, a.features, a.images,
    a.max_guests, a.base_rate_bwp,
    (_check_out - _check_in)::INT AS nights,
    (a.base_rate_bwp * (_check_out - _check_in)::INT) AS total_bwp
  FROM public.apartments a
  WHERE a.active = true
    AND a.max_guests >= _guests
    AND _check_out > _check_in
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.apartment_id = a.id
        AND b.status IN ('pending_payment','confirmed','checked_in')
        AND b.check_in < _check_out
        AND b.check_out > _check_in
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_dates bd
      WHERE bd.apartment_id = a.id
        AND bd.start_date < _check_out
        AND bd.end_date > _check_in
    )
  ORDER BY a.sort_order, a.base_rate_bwp;
$$;
GRANT EXECUTE ON FUNCTION public.search_availability(DATE, DATE, INT) TO anon, authenticated;
