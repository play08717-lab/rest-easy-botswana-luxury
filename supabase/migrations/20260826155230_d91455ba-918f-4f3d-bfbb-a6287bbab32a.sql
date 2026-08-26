-- New staff role for order-board-only access
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lounge_staff';

CREATE TYPE public.lounge_order_status AS ENUM (
  'received','confirmed','preparing','ready','out_for_delivery','completed','cancelled'
);
CREATE TYPE public.lounge_order_type AS ENUM ('pickup','delivery');

-- Helper: any staff member allowed to work the lounge order board
CREATE OR REPLACE FUNCTION public.is_lounge_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','manager','lounge_staff')
  );
$$;
REVOKE ALL ON FUNCTION public.is_lounge_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lounge_staff(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_lounge_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin','manager')
  );
$$;
REVOKE ALL ON FUNCTION public.is_lounge_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lounge_manager(uuid) TO authenticated, service_role;

-- ============ VENUES ============
CREATE TABLE public.lounge_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_venues TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lounge_venues TO authenticated;
GRANT ALL ON public.lounge_venues TO service_role;
ALTER TABLE public.lounge_venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active venues" ON public.lounge_venues FOR SELECT USING (active = true OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Managers manage venues" ON public.lounge_venues FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));
CREATE TRIGGER trg_lounge_venues_updated BEFORE UPDATE ON public.lounge_venues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SETTINGS ============
CREATE TABLE public.lounge_settings (
  venue_id uuid PRIMARY KEY REFERENCES public.lounge_venues(id) ON DELETE CASCADE,
  logo_url text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  maps_url text NOT NULL DEFAULT '',
  maps_embed_url text NOT NULL DEFAULT '',
  opening_hours text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'BWP',
  delivery_enabled boolean NOT NULL DEFAULT true,
  delivery_fee_bwp numeric NOT NULL DEFAULT 0,
  minimum_order_bwp numeric NOT NULL DEFAULT 0,
  delivery_radius_km numeric NOT NULL DEFAULT 5,
  distance_note text NOT NULL DEFAULT 'Approximately 3 km from Rest Easy Apartment',
  estimated_prep_minutes int NOT NULL DEFAULT 30,
  estimated_delivery_minutes int NOT NULL DEFAULT 45,
  delivery_instructions text NOT NULL DEFAULT '',
  payment_methods text[] NOT NULL DEFAULT ARRAY['cash','bank_transfer','orange_money']::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.lounge_settings TO authenticated;
GRANT ALL ON public.lounge_settings TO service_role;
ALTER TABLE public.lounge_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lounge settings" ON public.lounge_settings FOR SELECT USING (true);
CREATE POLICY "Managers manage lounge settings" ON public.lounge_settings FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));
CREATE TRIGGER trg_lounge_settings_updated BEFORE UPDATE ON public.lounge_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CATEGORIES ============
CREATE TABLE public.lounge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.lounge_venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lounge_categories TO authenticated;
GRANT ALL ON public.lounge_categories TO service_role;
ALTER TABLE public.lounge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.lounge_categories FOR SELECT USING (active = true OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Managers manage categories" ON public.lounge_categories FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));
CREATE TRIGGER trg_lounge_categories_updated BEFORE UPDATE ON public.lounge_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MENU ITEMS ============
CREATE TABLE public.lounge_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.lounge_venues(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.lounge_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_bwp numeric NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  prep_notes text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  is_special boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lounge_menu_items TO authenticated;
GRANT ALL ON public.lounge_menu_items TO service_role;
ALTER TABLE public.lounge_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view live menu items" ON public.lounge_menu_items FOR SELECT USING (archived = false OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Managers manage menu items" ON public.lounge_menu_items FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));
CREATE TRIGGER trg_lounge_menu_items_updated BEFORE UPDATE ON public.lounge_menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EXTRAS ============
CREATE TABLE public.lounge_item_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.lounge_menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_bwp numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_item_extras TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lounge_item_extras TO authenticated;
GRANT ALL ON public.lounge_item_extras TO service_role;
ALTER TABLE public.lounge_item_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active extras" ON public.lounge_item_extras FOR SELECT USING (active = true OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Managers manage extras" ON public.lounge_item_extras FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));

-- ============ PROMOTIONS ============
CREATE TABLE public.lounge_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.lounge_venues(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  promo_type text NOT NULL DEFAULT 'special',
  code text,
  discount_percent numeric,
  discount_amount_bwp numeric,
  starts_at date,
  ends_at date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lounge_promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lounge_promotions TO authenticated;
GRANT ALL ON public.lounge_promotions TO service_role;
ALTER TABLE public.lounge_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promotions" ON public.lounge_promotions FOR SELECT USING (active = true OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Managers manage promotions" ON public.lounge_promotions FOR ALL TO authenticated
  USING (public.is_lounge_manager(auth.uid())) WITH CHECK (public.is_lounge_manager(auth.uid()));
CREATE TRIGGER trg_lounge_promotions_updated BEFORE UPDATE ON public.lounge_promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ORDERS ============
CREATE SEQUENCE IF NOT EXISTS public.lounge_order_ref_seq START 45;
CREATE OR REPLACE FUNCTION public.generate_lounge_order_ref()
RETURNS text LANGUAGE sql SET search_path = public AS $$
  SELECT 'EL-' || lpad(nextval('public.lounge_order_ref_seq')::text, 5, '0');
$$;
REVOKE ALL ON FUNCTION public.generate_lounge_order_ref() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_lounge_order_ref() TO service_role;

CREATE TABLE public.lounge_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.lounge_venues(id) ON DELETE RESTRICT,
  reference text NOT NULL UNIQUE DEFAULT public.generate_lounge_order_ref(),
  order_type public.lounge_order_type NOT NULL,
  status public.lounge_order_status NOT NULL DEFAULT 'received',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  apartment_id uuid REFERENCES public.apartments(id) ON DELETE SET NULL,
  delivery_instructions text,
  pickup_time text,
  customer_notes text,
  staff_notes text,
  subtotal_bwp numeric NOT NULL DEFAULT 0,
  delivery_fee_bwp numeric NOT NULL DEFAULT 0,
  discount_bwp numeric NOT NULL DEFAULT 0,
  total_bwp numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'unpaid',
  promo_code text,
  cancelled_reason text,
  confirmed_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lounge_orders_created ON public.lounge_orders (created_at DESC);
CREATE INDEX idx_lounge_orders_status ON public.lounge_orders (status);
CREATE INDEX idx_lounge_orders_guest ON public.lounge_orders (guest_id);
GRANT SELECT ON public.lounge_orders TO authenticated;
GRANT UPDATE ON public.lounge_orders TO authenticated;
GRANT ALL ON public.lounge_orders TO service_role;
ALTER TABLE public.lounge_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests view own lounge orders" ON public.lounge_orders FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR public.is_lounge_staff(auth.uid()));
CREATE POLICY "Lounge staff update orders" ON public.lounge_orders FOR UPDATE TO authenticated
  USING (public.is_lounge_staff(auth.uid())) WITH CHECK (public.is_lounge_staff(auth.uid()));

CREATE TRIGGER trg_lounge_orders_updated BEFORE UPDATE ON public.lounge_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lounge_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.lounge_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.lounge_menu_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  category_name text NOT NULL DEFAULT '',
  unit_price_bwp numeric NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  extras_total_bwp numeric NOT NULL DEFAULT 0,
  line_total_bwp numeric NOT NULL DEFAULT 0,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lounge_order_items_order ON public.lounge_order_items (order_id);
GRANT SELECT ON public.lounge_order_items TO authenticated;
GRANT ALL ON public.lounge_order_items TO service_role;
ALTER TABLE public.lounge_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff order items" ON public.lounge_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lounge_orders o WHERE o.id = order_id AND (o.guest_id = auth.uid() OR public.is_lounge_staff(auth.uid()))));

CREATE TABLE public.lounge_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.lounge_orders(id) ON DELETE CASCADE,
  status public.lounge_order_status NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lounge_order_events_order ON public.lounge_order_events (order_id);
GRANT SELECT ON public.lounge_order_events TO authenticated;
GRANT ALL ON public.lounge_order_events TO service_role;
ALTER TABLE public.lounge_order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff order events" ON public.lounge_order_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lounge_orders o WHERE o.id = order_id AND (o.guest_id = auth.uid() OR public.is_lounge_staff(auth.uid()))));

-- ============ SEED ============
INSERT INTO public.lounge_venues (id, slug, name, tagline, about, sort_order)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'engliton-lounge',
  'Engliton Lounge',
  'Wood-fired plates, cold shakes and easy evenings in Rakops',
  'Engliton Lounge is a relaxed, modern lounge and kitchen in Rakops, about 3 km from Rest Easy Apartment. We cook fresh pizza, hearty main meals and generous snacks, and we blend milkshakes and smoothies to order. Guests staying at Rest Easy can have food delivered to their apartment, while locals and travellers passing through are just as welcome to collect from us.',
  0
);

INSERT INTO public.lounge_settings (venue_id, phone, whatsapp_number, email, address, maps_url, opening_hours, delivery_fee_bwp, minimum_order_bwp, delivery_radius_km, estimated_prep_minutes, estimated_delivery_minutes, delivery_instructions)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  '+267 71 621 866',
  '26771621866',
  'hello@resteasyrakops.co.bw',
  'Rakops, Botswana',
  'https://www.google.com/maps/search/?api=1&query=Rakops%2C+Botswana',
  'Monday to Sunday, 10:00 – 22:00',
  25, 60, 5, 30, 45,
  'Our driver will call you on arrival. Please have your apartment number ready.'
);

INSERT INTO public.lounge_categories (id, venue_id, name, description, sort_order) VALUES
  ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-111111111111','Pizza','Hand-stretched bases, baked to order',1),
  ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-111111111111','Main Meals','Hearty plates for a proper sit-down',2),
  ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-111111111111','Snacks','Quick bites and sharing plates',3),
  ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-111111111111','Desserts','Something sweet to finish',4),
  ('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-111111111111','Milkshakes','Thick, cold and blended to order',5),
  ('22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-111111111111','Smoothies','Fruit-forward and refreshing',6),
  ('22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-111111111111','Soft Drinks','Chilled cans and bottles',7);

INSERT INTO public.lounge_menu_items (id, venue_id, category_id, name, description, price_bwp, sort_order, is_special) VALUES
  ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000001','Margherita Pizza','Tomato, mozzarella and fresh basil on a hand-stretched base.',75,1,false),
  ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000001','Kalahari Meat Feast','Beef mince, chicken, peppers and onion with double cheese.',110,2,true),
  ('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000002','Grilled Chicken & Chips','Half chicken flame-grilled, served with chips and salad.',95,1,false),
  ('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000002','Beef Stew & Pap','Slow-cooked beef stew with pap and seasonal greens.',85,2,false),
  ('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000003','Loaded Chips','Chips topped with cheese sauce and spring onion.',45,1,false),
  ('33333333-3333-4333-8333-000000000006','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000003','Chicken Wings (6)','Grilled wings with a peri or barbecue glaze.',55,2,false),
  ('33333333-3333-4333-8333-000000000007','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000004','Malva Pudding','Warm malva pudding with custard.',40,1,false),
  ('33333333-3333-4333-8333-000000000008','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000005','Chocolate Milkshake','Thick chocolate shake blended to order.',35,1,false),
  ('33333333-3333-4333-8333-000000000009','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000006','Mango & Granadilla Smoothie','Fresh mango and granadilla with yoghurt.',38,1,false),
  ('33333333-3333-4333-8333-000000000010','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-000000000007','Soft Drink (330ml)','Chilled can — ask for today''s selection.',15,1,false);

INSERT INTO public.lounge_item_extras (item_id, name, price_bwp, sort_order) VALUES
  ('33333333-3333-4333-8333-000000000001','Extra cheese',15,1),
  ('33333333-3333-4333-8333-000000000001','Mushrooms',12,2),
  ('33333333-3333-4333-8333-000000000002','Extra cheese',15,1),
  ('33333333-3333-4333-8333-000000000002','Jalapeños',10,2),
  ('33333333-3333-4333-8333-000000000003','Extra chips',20,1),
  ('33333333-3333-4333-8333-000000000006','Extra peri sauce',8,1);
