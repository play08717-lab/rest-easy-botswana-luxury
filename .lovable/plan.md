## Rest Easy Apartment — Phase 1 build plan

Extending the existing "Dashboard bento" site into a working booking platform for a single property. Public site stays as-is visually; we add real availability, bookings, guest accounts, admin, and manual-payment reconciliation.

### Locked decisions (from your answers)
- **Scope**: Public site + online booking + guest portal + admin dashboard
- **Payments**: Manual bank transfer / EFT — guest gets bank details + reference; admin marks paid
- **Currency**: BWP (P), rates from P400–P650 (per unit, editable in admin)
- **Notifications**: Email (Lovable Cloud) + WhatsApp auto-messages (WhatsApp Business API)
- **Housekeeping, staff roles, promo codes, reports, restaurant/car/tours, loyalty** → phase 2 (schema designed to support them)

### Prerequisites we'll set up
1. **Lovable Cloud** — needed for auth, database, email, storage of PDFs.
2. **Email domain** — you'll need a domain you own so guests receive branded email from e.g. `bookings@yourdomain`. Without one, we fall back to a Lovable-owned sender for auth emails only and booking emails won't send.
3. **WhatsApp Business API** — requires Meta Business verification + a BSP (e.g. Twilio/360dialog) and pre-approved message templates. This can take days-to-weeks. Until approved, WhatsApp confirmations degrade to a one-click "Send via WhatsApp" link opened on the admin's phone.

### Public website changes
- Add **FAQ** route (currently missing).
- Home & Apartments: real "Check availability" widget (dates + guests) → routes to `/book`.
- **Book Now** flow becomes a real multi-step booking (see below), replacing the current WhatsApp-only form.
- Keep sidebar nav, WhatsApp float, Rakops map, existing gallery.

### Booking flow (guest)
1. **Search** — pick check-in / check-out / guests → shows only apartments free for the whole range with total price.
2. **Select unit** → booking summary (nights × rate, taxes if any, total in BWP).
3. **Guest details** — name, email, phone, ID/passport, special requests. Guest signs in or signs up (email + password; magic-link fallback).
4. **Confirm & reserve** — creates booking in `pending_payment` status, holds the dates for 24h.
5. **Payment instructions page** — shows bank details, booking reference (e.g. `RE-2026-000123`), amount, and a "I've paid" button that lets the guest upload proof of payment (optional).
6. **Confirmation page** with downloadable PDF voucher + invoice.

### Automated messages (fires on state change)
| Trigger | Email | WhatsApp |
|---|---|---|
| Booking created (pending payment) | Payment instructions + reference + voucher | Same, short |
| Admin marks paid | Confirmation + invoice PDF | Confirmation |
| 24h before check-in | Reminder + directions | Reminder |
| Check-in day | Welcome + WiFi/keys note (owner-editable) | Welcome |
| Check-out day | Check-out reminder | Reminder |
| Day after check-out | Thank-you + review request | Thank-you |

### Guest portal (`/account`)
- My bookings (upcoming / past)
- Download voucher + invoice PDFs
- Cancel booking (if >48h before check-in, configurable)
- Message reception (creates admin inbox thread)

### Admin dashboard (`/admin`, role-gated)
- **Overview**: today's check-ins/check-outs, occupancy %, revenue this month, pending-payment bookings needing action.
- **Calendar** (month view, per unit): drag to block dates for maintenance; color-coded by status.
- **Bookings list**: filter by status/date/unit; open a booking → mark paid, cancel, refund note, resend email, regenerate PDFs.
- **Apartments**: edit name, description, images, base rate, max guests, active flag.
- **Guests**: searchable list, booking history per guest.
- **Payments**: bookings awaiting payment, mark paid (with amount + method note), see uploaded proof.
- **Blocked dates**: maintenance holds per unit with reason.
- **Settings**: bank details, cancellation window, check-in/out times, contact info, message templates.

### Roles (phase 1)
- **Guest** — default on signup, sees own portal only.
- **Admin** — full access.
- Roles table + `has_role()` security-definer function so we can add Receptionist / Housekeeping / Manager in phase 2 without refactor.

### Data model (Lovable Cloud tables, all with RLS)
- `profiles` (id → auth.users, full_name, phone, id_number, avatar)
- `user_roles` (user_id, role enum: guest/admin) — never on profiles
- `apartments` (id, slug, name, description, base_rate_bwp, max_guests, images[], active)
- `bookings` (id, reference, apartment_id, guest_id, check_in, check_out, guests, total_bwp, status enum: pending_payment/confirmed/cancelled/checked_in/checked_out/no_show, special_requests, created_at)
- `payments` (id, booking_id, amount_bwp, method, reference, proof_url, recorded_by, recorded_at)
- `blocked_dates` (id, apartment_id, start_date, end_date, reason)
- `messages` (id, booking_id, sender enum: guest/admin, body, created_at) — for the reception thread
- `notification_log` (id, booking_id, channel, template, status, sent_at) — audit trail
- `settings` (singleton key-value: bank details, cancellation hours, check-in/out times, message templates)

### Server-side logic (TanStack server functions + `/api/public/*` webhooks)
- `searchAvailability({ check_in, check_out, guests })` — public, returns free units + total.
- `createBooking(...)` — auth required (guest); computes total server-side, checks conflict + blocked dates transactionally, generates reference, enqueues emails.
- `cancelBooking(id)` — guest (own, within window) or admin.
- `markPaid(bookingId, amount, method)` — admin only, transitions to `confirmed`, triggers confirmation email + voucher.
- `generateVoucherPdf(bookingId)` / `generateInvoicePdf(bookingId)` — server-rendered PDFs stored in Cloud Storage, signed URL returned.
- `sendNotification(bookingId, template)` — dispatches email via Lovable Cloud email + WhatsApp via BSP if configured, logs to `notification_log`.
- **Reminder scheduler** — a `/api/public/cron/reminders` endpoint hit by pg_cron every hour to send check-in/out reminders and thank-you messages.

### Security
- RLS everywhere; guests read/write only their own bookings/payments/messages.
- Admin routes gated by `_authenticated` layout + `has_role('admin')` check in `beforeLoad` of `/admin` subtree.
- Bank details + settings readable only by admin (RLS).
- Activity log table for admin actions (`booking_confirmed`, `booking_cancelled`, `settings_changed`) — foundation for phase-2 audit view.
- Automatic backups: rely on Lovable Cloud managed Postgres backups (no app-side work needed).

### Phase 2 hooks (designed in, not built)
- Roles enum already supports `receptionist`, `housekeeping`, `manager`.
- Apartments table has a nullable `property_id` (future multi-property).
- `bookings.type` field ready for `stay | tour | transfer | rental`.
- `promo_codes` and `loyalty_points` tables not created yet but the pricing function is centralized so it can call them.

### Build order (roughly one large step per bullet)
1. Enable Lovable Cloud → create schema, roles, RLS policies, seed 3 apartments with your P400–P650 rates + settings row.
2. Auth pages (`/auth` sign-in/up), guest profile bootstrap, root session listener.
3. Public availability search + booking flow (steps 1–4) writing real bookings.
4. Payment instructions page + guest voucher/invoice PDFs + email sends.
5. Guest portal (`/account`).
6. Admin dashboard shell + overview + bookings + calendar + mark-paid + apartments + settings.
7. Reminder cron + WhatsApp integration (or WhatsApp deep-link fallback if BSP not ready).
8. FAQ page + polish.

### What we'll need from you along the way
- **Email domain** (or approval to buy one) — for sending confirmations.
- **Bank details** to display on the payment instructions page (account name, bank, account #, branch, reference format). Can be placeholders now, edited in admin later.
- **Confirmed rates** per unit (Executive / Master / Garden) within the P400–P650 range.
- **First admin email** — we'll grant admin to that account on first sign-up.
- **WhatsApp Business API access** (Meta Business + BSP account) when you're ready; not blocking phase-1 launch.

Approve this and I'll start with step 1 (Cloud + schema + auth).
