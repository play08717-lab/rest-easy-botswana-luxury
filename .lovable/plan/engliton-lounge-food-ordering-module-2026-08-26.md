# Engliton Lounge — food ordering module

Add Engliton Lounge as a second business inside the Rest Easy website: its own public pages, digital menu, cart and checkout, order tracking, and a staff order board — all separate from accommodation data, reusing the existing login, roles and design system. Nothing in the accommodation booking system is replaced or removed.

Alcohol is excluded from v1: categories ship as food, snacks, desserts, milkshakes, smoothies and soft drinks. Categories are owner-managed, so licensed categories can be added later without code changes.

## What the guest / customer sees

New public routes under `/lounge`:

- `/lounge` — lounge landing page with its own visual identity (warmer, more social than the accommodation pages), cover image, opening hours, "approximately 3 km from Rest Easy Apartment", Order Now and WhatsApp buttons.
- `/lounge/menu` — mobile-first digital menu grouped by category, with photos, BWP prices, availability badges, extras and an add-to-cart flow.
- `/lounge/cart` — quantities, extras, special instructions, subtotal, delivery/service fee, total.
- `/lounge/checkout` — pick **Pickup from Engliton Lounge** (name, phone, preferred pickup time, notes) or **Rest Easy delivery**, which appears only when the signed-in customer has a current/upcoming booking; they then pick the booking and apartment and add delivery instructions. Payment method is chosen from the methods the owner enabled (cash, bank transfer, Orange Money, card/manual). No card data is ever collected or stored.
- `/lounge/orders/$reference` — order status page (Received → Confirmed → Preparing → Ready → Out for delivery → Completed / Cancelled), reachable without an account by order reference plus the phone number used on the order.
- `/lounge/gallery`, `/lounge/about`, `/lounge/contact` (map + directions), and specials surfaced on the landing and menu pages.

On the accommodation side, a "Hungry? Enjoy Engliton Lounge" section is added to the home page and the guest account page, with View Menu / Order Now, clearly stating the lounge is a separate venue about 3 km away. Sidebar gains a Lounge link.

WhatsApp ordering builds a formatted message (customer, order number, items, quantities, extras, total, pickup/delivery, apartment if applicable, phone, instructions) using the WhatsApp number from Lounge Settings.

## What the owner and staff see

New admin area under `/admin/lounge`:

- **Orders board** — columns Received / Confirmed / Preparing / Ready / Completed, drag-free one-click status advance, order detail drawer with customer contact, WhatsApp reply link, preparation notes, cancel with reason, printable order ticket, and a new-order sound/browser notification via realtime subscription.
- **Dashboard tiles** — today's orders by status, today's sales, this month's sales, popular items.
- **Menu manager** — categories and items: add, edit, image upload, price, availability toggle, extras, reorder (sort order), archive, and mark as special.
- **Promotions** — daily/weekend specials, combo items, discount codes, limited-time offers with start/end dates.
- **Lounge settings** — name, logo, cover image, phone, WhatsApp, email, address, Google Maps link/coordinates, opening hours, social links, currency (BWP), delivery on/off, delivery fee, minimum order, delivery radius, estimated prep/delivery time, delivery instructions, enabled payment methods.
- **Lounge reports** — daily/weekly/monthly/annual sales, orders by date, sales by category, best sellers, payment-method summary, cancelled orders, delivery vs pickup, average order value, with CSV export and print-to-PDF.

Access uses the existing roles: admin and manager get everything; receptionist and housekeeping are not given lounge access by default — a new `lounge_staff` role is added for order-board-only access.

## Technical approach

New tables, all prefixed `lounge_`, with no changes to accommodation tables:

- `lounge_venues` (future-proofs multiple venues; v1 seeds one row) and `lounge_settings` (single row per venue: branding, contact, hours, delivery config, enabled payment methods).
- `lounge_categories` (name, sort_order, active) and `lounge_menu_items` (category, name, description, price_bwp, image_url, available, sort_order, prep_notes, is_special, archived).
- `lounge_item_extras` (item, name, price_bwp, active).
- `lounge_promotions` (type, code, value, starts_at, ends_at, active).
- `lounge_orders` (reference `EL-#####` from a sequence, order_type pickup|delivery, status enum, customer_name/phone/email, optional `guest_id`, optional `booking_id` and `apartment_id` for guest delivery, subtotal/fee/discount/total, payment_method, payment_status, notes, staff prep notes, timestamps per status) and `lounge_order_items` (order, item snapshot name/price, qty, extras snapshot, instructions).
- `lounge_order_events` for the status audit trail.

Security: every table gets GRANTs plus RLS. Public/anon gets read-only SELECT on active categories, available items, extras, active promotions and public settings columns only. Order creation goes through a server function that validates prices server-side (never trusting client totals) and verifies any claimed booking belongs to the signed-in user. Customers read their own orders via `guest_id`; anonymous customers read a single order through a server function that requires reference + matching phone. Staff read/write is gated by `has_role`. Menu images use a new public storage bucket with staff-only writes.

Server logic in `src/lib/lounge.functions.ts` (public menu/order fns) and `src/lib/lounge-admin.functions.ts` (staff CRUD, board, reports), following the existing `requireSupabaseAuth` + `has_role` pattern. Order references come from a Postgres sequence, mirroring `generate_booking_ref`.

Each new route gets its own `head()` metadata for SEO and sharing.

## Build order

1. Migration: venues, settings, categories, items, extras, promotions, orders, order items, events, sequence, grants, RLS, storage bucket, seed of one venue + starter categories and a few placeholder menu items.
2. Server functions: public menu + settings reads, order creation with server-side pricing, order status lookup.
3. Public lounge pages: landing, menu, cart (client cart state persisted in localStorage), checkout, order status.
4. Admin: settings, menu manager, promotions, order board with realtime + notification, reports with CSV export.
5. Rest Easy cross-promotion section, sidebar link, and guest-account "Order food" entry.

Placeholder food photography is generated for the seeded menu items until real photos are supplied.
