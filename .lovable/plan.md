# Phase 2A — Manager Dashboard & Admin System

## Scope
Manager cockpit that gives the owner full operational control from one place. Manager-only role for now (Super Admin = Manager). Reviews, maintenance module, extra staff roles, 2FA, auto-backup, WhatsApp API auto-send, and PDF/Excel exports are deferred.

## Database changes (single migration)
- `apartments`: add `apartment_number`, `weekend_rate_bwp`, `holiday_rate_bwp`, `cleaning_status` (clean / dirty / in_progress / ready), `availability` (available / unavailable / maintenance).
- `bookings`: add `source` (direct / walk_in / whatsapp / phone / other), `is_group`, `nationality`, `id_number`, `vehicle_reg`, `emergency_contact`, `notes`, `no_show` status value.
- New `guests` table (denormalised guest profile keyed by phone/email/id): full_name, id/passport, phone, email, nationality, address, vehicle_reg, emergency_contact, notes, aggregated totals (nights, spend, bookings) via view.
- `payments`: add `method` values `orange_money`, keep bank_transfer / cash / other; add `is_deposit`, `is_refund`.
- New `holidays` table (date, name, rate_multiplier optional).
- New `special_rates` table (apartment_id, date range, rate_bwp).
- Extend `blocked_dates` reason enum with `maintenance` / `holiday` / `owner_use`.
- RLS: all new tables — admin full access via `has_role(uid,'admin')`; guests table readable by owning guest.
- GRANTs to authenticated + service_role on every new table.

## Server functions (`src/lib/admin.functions.ts`, extending `booking.functions.ts`)
- `getDashboardKpis()` — all 15 KPI cards in one payload.
- `getCalendarData({from,to})` — bookings + blocks + holidays + special rates for FullCalendar-style grid.
- Apartments: `createApartment`, `updateApartment`, `deleteApartment`, `setApartmentAvailability`, `setCleaningStatus`, `blockApartment`.
- Guests: `listGuests({search})`, `getGuest(id)`, `updateGuestNotes`, guest history join.
- Bookings: extend `createBooking` for walk-in/group + admin-created; add `modifyBooking`, `extendStay`, `earlyCheckout`, `checkIn`, `checkOut`, `markNoShow`.
- Payments: `recordPayment` (cash/orange money/bank/deposit/refund/partial), `getPaymentHistory(bookingId)`, `getOutstanding()`.
- Reports: `getReport({type, from, to})` returning rows; CSV built client-side via a small helper (no lib).
- Settings: extend `updateSettings` with tax_rate, cancellation_policy, social links, logo_url.

## Admin UI (`src/routes/_authenticated/admin.*`)
Sidebar-style admin shell replacing current top-tab layout, responsive (drawer on mobile):
- `admin.index.tsx` — KPI grid (15 cards) + today's arrivals/departures + outstanding payments preview.
- `admin.calendar.tsx` — month/week calendar (custom grid, no heavy library) showing bookings, blocks, holidays, special rates; click row → booking drawer.
- `admin.apartments.tsx` — table + create/edit dialog (photos via URL list for now), pricing tiers, availability + cleaning toggles.
- `admin.bookings.tsx` — existing page extended with filters (status, date range, apartment, search), create-walk-in dialog, modify/extend/check-in/check-out actions, receipt actions (print / mailto / WhatsApp link).
- `admin.guests.tsx` — searchable guest directory with detail drawer (history, totals, notes).
- `admin.payments.tsx` — payment ledger, record-payment dialog, outstanding list, refund action.
- `admin.housekeeping.tsx` — board of apartments grouped by cleaning status, one-click transitions.
- `admin.reports.tsx` — pick report + date range → table preview + CSV download button.
- `admin.settings.tsx` — extended with tax, policies, holidays list, special-rate management, logo URL.

Guest portal (`_authenticated/account.*`) stays as-is; no changes this phase.

## Notifications
Click-to-send WhatsApp templates from booking / payment views. No new backend cost. Auto-email + WhatsApp API deferred to Phase 2B.

## Reports export
CSV only in this build (built-in). PDF/Excel scaffolded as disabled buttons with a "coming soon" tooltip so the UI is ready when we add the libraries.

## Explicitly deferred (not built this phase)
Customer reviews, maintenance/technician module, staff roles beyond Manager, 2FA, automatic backups, WhatsApp Business API auto-notifications, PDF/Excel report exports, logo upload (URL input for now), photo upload (URL list for now), Visa/Mastercard payments.

## Build order
1. DB migration (schema + RLS + GRANTs).
2. Server functions (KPIs, calendar, apartments, guests, bookings extensions, payments, reports).
3. Admin shell + KPI dashboard.
4. Calendar view.
5. Apartments + housekeeping.
6. Guests directory.
7. Bookings & payments enhancements.
8. Reports + settings extensions.
9. Mobile polish pass.
