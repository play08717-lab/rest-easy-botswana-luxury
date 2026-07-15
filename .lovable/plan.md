
## Rest Easy Apartment — full site build plan

Building on the selected "Dashboard bento" direction: black canvas, warm paper surfaces, gold accents, Playfair Display headings + Poppins body, fixed left sidebar nav, bento grids, slow reveal animations, persistent WhatsApp CTA.

### Design tokens (locked, ported into `src/styles.css`)
- `--dark: #0a0a0a`, `--paper: #f7f4ee`, `--gold: #c9a24c`, `--gold-light: #e8c87a`, `--whatsapp: #25D366`
- Fonts loaded via `<link>` in `__root.tsx`: Playfair Display + Poppins
- `--font-display: Playfair Display`, `--font-body: Poppins`
- Reveal keyframe utility (`animate-reveal`) with staggered delays

### Routes (each with its own `head()` meta — title, description, og:title, og:description)
```
src/routes/
  __root.tsx           shared shell: <SidebarNav/> + <Outlet/> + <FloatingWhatsApp/>
  index.tsx            Home (hero bento + About teaser + Apartments preview + Gallery preview + Why Choose + Location)
  about.tsx            About — story, values, hosts
  apartments.tsx       Apartments — full list of units with pricing placeholders
  why-choose-us.tsx    Why Choose Us — feature grid
  gallery.tsx          Gallery — masonry bento grid
  nearby.tsx           Nearby Attractions — Boteti / Makgadikgadi / Central Kalahari
  contact.tsx          Contact — phone, WhatsApp, address, embedded map
  book.tsx             Book Now — request form + WhatsApp CTA
```

### Shared components (`src/components/`)
- `SidebarNav.tsx` — fixed left sidebar (72px mobile / 288px desktop), REST EASY wordmark, Rakops caption, nav links using `<Link>` with active state via `useRouterState`, Book via WhatsApp button anchored at bottom
- `FloatingWhatsApp.tsx` — bottom-right pill linking to `https://wa.me/26771621866`
- `BentoCard.tsx` — reusable dark/paper card with optional image + overlay
- `ApartmentCard.tsx` — image + name + short blurb + "from" price + View Details
- `SectionHeading.tsx` — gold eyebrow + Playfair heading
- `GoogleMap.tsx` — iframe embed of Rakops, Botswana (Google Maps standard embed URL, no API key needed)
- `Footer.tsx` — subtle border-top, copyright + legal links

### Page content specifics
- **Home** mirrors selected prototype's bento exactly: hero (8-col) + Essence (4-col) + 3 apartment/gallery tiles + full-width Location. Adds a Why Choose Us row before Location.
- **Apartments**: 3 units — Executive Studio, Master Apartment, Garden Suite — with generic self-catering descriptions (private entrance, en-suite, kitchenette, secure parking). Price shown as "From P—" placeholder.
- **Gallery**: 8–10 placeholder tiles in bento layout (varied col/row spans).
- **Nearby Attractions**: cards for Makgadikgadi Pans, Boteti River, Central Kalahari Game Reserve — generic distances noted as "approximate".
- **Contact**: phone `+267 71 621 866`, WhatsApp same, address `Plot 2903, Rakops, Botswana`, embedded Google map iframe.
- **Book Now**: simple request form (name, dates, guests, message) that composes a `wa.me` deep link — no backend needed.

### Guardrails
- No claims about pool, spa, restaurant, gym, Wi-Fi speed, breakfast, etc. Features stay generic: self-catering, secure gated parking, quiet location, warm hospitality.
- All imagery uses `data-lov-image-placeholder` blocks generated at build time via the imagegen tool, saved to `src/assets/`, imported as ES6 modules.
- Mobile-first: sidebar collapses to icon strip on `<lg`; bento grids collapse to single column on mobile.
- Root `head()` sets sitewide defaults; each leaf overrides title/description/og.

### Technical notes
- No backend / Lovable Cloud needed — booking flows through WhatsApp deep links.
- Google Map uses standard `https://www.google.com/maps?q=...&output=embed` iframe (no API key).
- All navigation uses `@tanstack/react-router` `<Link>`; no `<a href>` for internal routes.

### Build order
1. Update `src/styles.css` with tokens + fonts + `animate-reveal` utility
2. Update `__root.tsx` with font `<link>` tags, sidebar shell, floating WhatsApp, sitewide meta
3. Generate ~10 placeholder images in parallel to `src/assets/`
4. Create shared components
5. Create all 8 route files with per-route `head()` and content
