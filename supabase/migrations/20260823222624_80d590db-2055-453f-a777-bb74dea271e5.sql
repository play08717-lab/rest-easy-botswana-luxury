CREATE TABLE public.assistant_config (
  id integer PRIMARY KEY DEFAULT 1,
  tone_notes text NOT NULL DEFAULT '',
  rates_text text NOT NULL DEFAULT '',
  location_text text NOT NULL DEFAULT '',
  advisories_text text NOT NULL DEFAULT '',
  checkin_text text NOT NULL DEFAULT '',
  contact_text text NOT NULL DEFAULT '',
  extra_notes text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assistant_config_single_row CHECK (id = 1)
);

GRANT SELECT, UPDATE ON public.assistant_config TO authenticated;
GRANT ALL ON public.assistant_config TO service_role;

ALTER TABLE public.assistant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view assistant config" ON public.assistant_config
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can update assistant config" ON public.assistant_config
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER trg_assistant_config_updated BEFORE UPDATE ON public.assistant_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.assistant_config (id, tone_notes, rates_text, location_text, advisories_text, checkin_text, contact_text, extra_notes) VALUES (
  1,
  'Tone: warm, refined, concise. Greet Botswana guests naturally ("Dumela"). Never invent facilities or services that are not listed below — if unsure, direct the guest to WhatsApp/call +267 71 621 866.',
  '- The Executive Studio — BWP 400 per night. Queen bed, private en-suite, kitchenette, private entrance. Best for solo travellers or couples.
- The Garden Suite — BWP 500 per night. Queen bed, en-suite, kitchenette, garden-facing.
- The Master Apartment — BWP 650 per night. King bed, full kitchen, living & dining area, private patio. Best for longer stays or families.
Bookings are confirmed by bank transfer / EFT or on arrangement; there is no card checkout. Rates may vary on weekends and public holidays.',
  'Plot 2903, Rakops, Botswana. Quiet residential plot with secure on-site parking, including space for 4x4 rigs and trailers.',
  '- Central Kalahari Game Reserve (Matswere Gate) is roughly an hour''s drive from Rakops on sand and gravel — a high-clearance 4x4 is essential, and the reserve interior requires full self-sufficiency (fuel, water, recovery gear, spare tyres).
- Makgadikgadi Pans: sedan-friendly on the tar approach, but pan surfaces and tracks require 4x4; never drive onto wet pans.
- Boteti River is close to the village and seasonal — water levels and wildlife activity change through the year.
- Fuel and basic groceries are available in Rakops, but stock can be limited: refuel and stock up before entering the reserves. Nearest large-town resupply is Letlhakane/Maun.',
  'CHECK-IN: from 14:00; CHECK-OUT: by 10:00. Flexible by arrangement.',
  'WhatsApp or call +267 71 621 866. Encourage guests to send their dates and preferred apartment for a fast confirmation.',
  ''
);