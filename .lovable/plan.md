## Scope

Add legal/compliance layer to Rest Easy Apartment: 5 legal pages, booking consent checkboxes (enforced), cookie banner, and admin-side data export + activity audit surfacing. Skip items already in place (HTTPS, password hashing, RLS, activity_log table).

## 1. Legal content pages (public routes)

Create five new routes, each with own SEO head, matching the existing dark/gold Playfair+Poppins design (reuse `PageHero` + typography from `about.tsx`, `faq.tsx`):

- `src/routes/privacy.tsx` — Privacy Policy
- `src/routes/terms.tsx` — Terms & Conditions
- `src/routes/cancellation.tsx` — Cancellation & Refund Policy
- `src/routes/cookies.tsx` — Cookie Policy
- `src/routes/house-rules.tsx` — House Rules

Content: verbatim from the user's message, "Last Updated: July 2026". Shared `LegalSection` component for consistent heading/prose styling.

## 2. Footer + sidebar links

- `src/components/Footer.tsx` — add a Legal column with links to all 5 pages.
- `src/components/SidebarNav.tsx` — add compact legal links group near bottom (below main nav, above sign-out).

## 3. Booking consent enforcement

Edit `src/routes/book.tsx`:
- Add 4 required checkboxes above the Reserve button:
  - Privacy Policy
  - Terms & Conditions
  - Cancellation Policy
  - House Rules (acknowledged)
- Each label links to the corresponding page (opens in new tab).
- Disable Reserve button until all 4 checked; block submit with inline error.
- Pass `consents: { privacy, terms, cancellation, house_rules, accepted_at }` to `createBooking`.

Server side (`src/lib/booking.functions.ts`):
- Extend `createBooking` input validator to require all 4 booleans true.
- Persist to `bookings.consents` (jsonb) via new column.

Migration:
- `ALTER TABLE public.bookings ADD COLUMN consents jsonb` (nullable for existing rows).

## 4. Cookie banner

- `src/components/CookieBanner.tsx` — fixed bottom banner shown when `localStorage['rea-cookie-consent']` is unset. Buttons: Accept / Decline, plus link to Cookie Policy. Store choice + timestamp in localStorage. No analytics currently wired, so this is a consent record only.
- Mount once in `src/routes/__root.tsx` next to `FloatingWhatsApp`.

## 5. Admin: guest data export + audit trail

Extend admin without new modules:

- `src/routes/_authenticated/admin.guests.tsx` — add a "Export CSV" button (all guests) and a per-guest "Export PDF" (print view of profile + bookings) using the same CSV pattern from `admin.reports.tsx` and `window.print()`.
- `src/routes/_authenticated/admin.bookings.tsx` — add a "View history" link per booking that opens a small dialog listing `activity_log` rows for that booking (who / when / action). New server fn `getBookingAuditTrail` in `admin.functions.ts`.
- Add "Delete guest data" action on guest detail (admin only, confirms) — new server fn `deleteGuestData` that nullifies PII on completed bookings (keeps financial record) and removes the profile row. Logs to `activity_log`.

## 6. Session hygiene

- `src/hooks/use-session.ts` — add an idle-timeout hook (`useIdleLogout`, 30 min) that calls `supabase.auth.signOut()` and redirects to `/auth`. Mount inside `_authenticated/route.tsx` so it only runs for signed-in users.

## Out of scope (already in place or previously deferred)

- HTTPS, password hashing, RLS, role-based access, booking activity logs table — already implemented.
- Automated database backups — managed by Lovable Cloud; documented in Privacy Policy copy, no code change.
- Multi-tenant "customizable for future clients" templating — legal copy is plain JSX and can be swapped per project; no CMS.

## Technical notes

- All new routes are public, top-level, SSR-on, with unique `head()` metadata (title + description + og tags).
- Consent persistence uses a new nullable `jsonb` column; no breaking change to existing bookings.
- CSV export reuses the existing client-side blob pattern (no new deps).
- Idle logout uses `visibilitychange` + `mousemove`/`keydown` listeners; pure client.
