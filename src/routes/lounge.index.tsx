import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, MapPin, Phone, Truck, ShoppingBag, Flame } from "lucide-react";
import { loungeContextQuery } from "./lounge";
import { bwp, whatsappOrderLink } from "@/lib/lounge-cart";

export const Route = createFileRoute("/lounge/")({
  head: () => ({
    meta: [
      { title: "Engliton Lounge — Food & Drinks in Rakops" },
      {
        name: "description",
        content:
          "Wood-fired pizza, hearty main meals and cold drinks at Engliton Lounge, 3 km from Rest Easy Apartment in Rakops. Order for collection or delivery.",
      },
      { property: "og:title", content: "Engliton Lounge — Rakops" },
      {
        property: "og:description",
        content: "Order pizza, main meals and drinks for collection or delivery to Rest Easy Apartment.",
      },
      { property: "og:type", content: "restaurant.restaurant" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoungeHome,
});

function LoungeHome() {
  const { data } = useSuspenseQuery(loungeContextQuery);
  const { venue, settings, categories, items, promotions } = data;
  const specials = items.filter((i) => i.is_special && i.available).slice(0, 3);
  const featured = (specials.length ? specials : items.filter((i) => i.available).slice(0, 3)).slice(0, 3);
  const wa = whatsappOrderLink(settings?.whatsapp_number ?? "", []);

  return (
    <>
      <section className="relative overflow-hidden ring-1 ring-ember/20">
        {settings?.cover_image_url ? (
          <img
            src={settings.cover_image_url}
            alt={`${venue.name} in Rakops`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/40" />
        <div className="relative px-6 py-16 md:px-14 md:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">
            Eat & drink · {settings?.distance_note || "3 km from Rest Easy"}
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] md:text-6xl">
            {venue.name}
            {venue.tagline ? (
              <>
                <br />
                <span className="italic text-ember-light">{venue.tagline}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-paper/70 md:text-base">
            {venue.about ||
              "A warm, social lounge minutes from your apartment — wood-fired pizza, generous main meals and cold drinks."}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/lounge/menu"
              className="inline-flex items-center gap-2 bg-ember px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark transition-colors hover:bg-ember-light"
            >
              <ShoppingBag className="h-4 w-4" /> Order online
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-whatsapp/60 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-whatsapp transition-colors hover:bg-whatsapp hover:text-dark"
            >
              Order on WhatsApp
            </a>
            {settings?.phone ? (
              <a
                href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 border border-ember/40 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-light transition-colors hover:bg-ember hover:text-dark"
              >
                <Phone className="h-4 w-4" /> Call the lounge
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Opening hours" value={settings?.opening_hours || "Daily"} />
        <InfoCard
          icon={<Truck className="h-4 w-4" />}
          label="Delivery"
          value={
            settings?.delivery_enabled
              ? `${bwp(settings.delivery_fee_bwp)} · min ${bwp(settings.minimum_order_bwp)} · ${settings.delivery_radius_km} km radius`
              : "Collection only right now"
          }
        />
        <InfoCard icon={<MapPin className="h-4 w-4" />} label="Find us" value={settings?.address || "Rakops, Botswana"} />
      </section>

      {promotions.length > 0 && (
        <section className="mt-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">On now</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {promotions.slice(0, 4).map((p) => (
              <article key={p.id} className="border border-ember/20 bg-ember/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  {p.code ? (
                    <span className="border border-ember/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ember-light">
                      {p.code}
                    </span>
                  ) : null}
                </div>
                {p.description && <p className="mt-3 text-sm leading-relaxed text-paper/65">{p.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between border-b border-ember/15 pb-3">
            <h2 className="font-display text-3xl">
              {specials.length ? "Tonight's specials" : "From the kitchen"}
            </h2>
            <Link to="/lounge/menu" className="text-[10px] uppercase tracking-[0.25em] text-ember hover:text-ember-light">
              Full menu →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {featured.map((i) => (
              <article key={i.id} className="group overflow-hidden bg-dark ring-1 ring-ember/15 hover:ring-ember/40">
                {i.image_url ? (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={i.image_url}
                      alt={i.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  {i.is_special && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.25em] text-ember">
                      <Flame className="h-3 w-3" /> Special
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-xl">{i.name}</h3>
                  <p className="mt-2 text-sm text-paper/60">{i.description}</p>
                  <p className="mt-3 text-sm font-semibold text-ember-light">{bwp(i.price_bwp)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 grid gap-4 md:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/lounge/menu"
            className="border border-ember/20 p-6 transition-colors hover:border-ember/60"
          >
            <h3 className="font-display text-xl">{c.name}</h3>
            {c.description && <p className="mt-2 text-xs leading-relaxed text-paper/55">{c.description}</p>}
            <span className="mt-4 block text-[10px] uppercase tracking-[0.25em] text-ember">
              {items.filter((i) => i.category_id === c.id).length} dishes →
            </span>
          </Link>
        ))}
      </section>

      {settings?.maps_embed_url ? (
        <section className="mt-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">Getting here</p>
          <h2 className="mt-3 font-display text-3xl">{settings.distance_note || "Minutes from Rest Easy Apartment"}</h2>
          <div className="mt-6 overflow-hidden border border-ember/20">
            <iframe
              src={settings.maps_embed_url}
              title={`Map to ${venue.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[320px] w-full md:h-[420px]"
            />
          </div>
          {settings.maps_url ? (
            <a
              href={settings.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[10px] uppercase tracking-[0.25em] text-ember hover:text-ember-light"
            >
              Open in Google Maps →
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="mt-16 border-t border-ember/15 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl">Staying at Rest Easy Apartment?</h2>
            <p className="mt-2 max-w-xl text-sm text-paper/60">
              {settings?.delivery_enabled
                ? "Sign in, pick your booking at checkout and we'll deliver straight to your apartment door."
                : "Collection only for now — we'll have it hot and ready when you arrive."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/lounge/menu"
              className="bg-ember px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light"
            >
              Browse the menu
            </Link>
            <Link
              to="/book"
              className="border border-gold/40 px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-dark"
            >
              Book a room
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-ember/20 p-6">
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ember">
        {icon}
        {label}
      </span>
      <p className="mt-3 text-sm leading-relaxed text-paper/70">{value}</p>
    </div>
  );
}
