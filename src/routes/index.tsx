import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import heroExterior from "@/assets/hero-exterior.jpg";
import detailHardware from "@/assets/detail-hardware.jpg";
import detailFloor from "@/assets/detail-floor.jpg";
import interiorLounge from "@/assets/interior-lounge.jpg";
import roomExecutive from "@/assets/room-executive.jpg";
import roomMaster from "@/assets/room-master.jpg";

import { RakopsMap } from "@/components/RakopsMap";
import { SectionHeading } from "@/components/SectionHeading";
import { AvailabilityChecker } from "@/components/AvailabilityChecker";
import { ExploreRakops } from "@/components/ExploreRakops";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rest Easy Apartment — Self-Catering in Rakops, Botswana" },
      {
        name: "description",
        content:
          "A quiet, refined self-catering retreat on Plot 2903 in Rakops. Book your stay on WhatsApp +267 71 621 866.",
      },
      { property: "og:title", content: "Rest Easy Apartment — Rakops, Botswana" },
      {
        property: "og:description",
        content:
          "Refined self-catering apartments in the heart of the Boteti region.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-6">
      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        {/* Hero */}
        <section className="md:col-span-12 lg:col-span-8 h-[520px] md:h-[560px] relative group overflow-hidden animate-reveal">
          <img
            src={heroExterior}
            alt="Rest Easy Apartment exterior at sunset in Rakops, Botswana"
            width={1600}
            height={1000}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/30 to-dark/10" />
          <div className="absolute top-6 left-6 md:top-8 md:left-10 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold-light">
              Now welcoming guests
            </span>
          </div>
          <div className="absolute bottom-8 left-6 right-6 md:bottom-12 md:left-10 md:right-10 max-w-2xl">
            <h1 className="font-display text-4xl md:text-6xl leading-[1.02] text-balance">
              A sanctuary in the heart of the Kalahari.
            </h1>
            <p className="text-paper/70 max-w-md text-sm md:text-base mt-4">
              Refined self-catering hospitality on Plot 2903, Rakops. Your home away from home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://wa.me/26771621866"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
              >
                Book on WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <Link
                to="/apartments"
                className="inline-flex items-center gap-2 border border-paper/25 hover:border-gold hover:text-gold text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
              >
                View apartments
              </Link>
            </div>
          </div>
        </section>

        {/* Essence */}
        <section
          className="md:col-span-6 lg:col-span-4 bg-paper text-dark p-8 md:p-10 flex flex-col justify-between min-h-[400px] animate-reveal"
          style={{ animationDelay: "120ms" }}
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              Our essence
            </span>
            <h2 className="font-display text-3xl md:text-4xl mt-5 leading-[1.05]">
              Self-catering, reimagined.
            </h2>
          </div>
          <ul className="space-y-3 mt-8">
            {[
              "Secure gated parking",
              "Quiet, private location",
              "Warm Botswana welcome",
              "Fully equipped for self-catering",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 border-b border-dark/10 pb-3 text-sm"
              >
                <span className="w-1 h-1 bg-gold rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Apartment Card 1 */}
        <Link
          to="/apartments"
          className="md:col-span-6 lg:col-span-4 h-[400px] relative group overflow-hidden animate-reveal"
          style={{ animationDelay: "220ms" }}
        >
          <img
            src={roomExecutive}
            alt="Executive Studio interior"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-dark/30 group-hover:bg-dark/50 transition-colors duration-500" />
          <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold-light self-start border border-gold/40 px-3 py-1 backdrop-blur-sm">
              Apartments
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light mb-2">
                Signature
              </p>
              <h3 className="font-display text-2xl md:text-3xl">Executive Studio</h3>
              <p className="text-xs text-paper/70 mt-2 max-w-xs">
                Crisp linen, brass accents, and quiet comfort.
              </p>
            </div>
          </div>
        </Link>

        {/* Gallery preview */}
        <Link
          to="/gallery"
          className="md:col-span-6 lg:col-span-4 h-[400px] relative grid grid-cols-2 gap-1 animate-reveal group"
          style={{ animationDelay: "320ms" }}
        >
          <div className="relative overflow-hidden">
            <img
              src={detailHardware}
              alt="Brass hardware detail"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden">
            <img
              src={detailFloor}
              alt="Polished stone floor detail"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
            />
          </div>
          <div className="col-span-2 relative flex items-center justify-center bg-gold/10 overflow-hidden">
            <img
              src={interiorLounge}
              alt="Warm interior lounge"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
            />
            <span className="relative text-[11px] uppercase tracking-[0.25em] border border-gold/50 bg-dark/40 backdrop-blur-sm px-6 py-3 group-hover:bg-gold group-hover:text-dark transition-all duration-500">
              View gallery
            </span>
          </div>
        </Link>

        {/* Apartment Card 2 (paper) */}
        <section
          className="md:col-span-6 lg:col-span-4 h-[400px] bg-paper text-dark p-8 flex flex-col justify-between animate-reveal"
          style={{ animationDelay: "420ms" }}
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              Most spacious
            </span>
            <h3 className="font-display text-3xl mt-4">The Master Apartment</h3>
            <p className="text-sm text-dark/60 mt-3 leading-relaxed">
              Full kitchen, generous living area and a private patio — designed for longer,
              slower stays.
            </p>
          </div>
          <div className="flex justify-between items-end border-t border-dark/10 pt-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-dark/40">
                Enquire
              </span>
              <p className="font-display text-lg mt-1">On request</p>
            </div>
            <Link
              to="/apartments"
              className="text-[10px] uppercase tracking-[0.2em] border-b border-gold pb-1 hover:text-gold transition-colors"
            >
              View details
            </Link>
          </div>
        </section>

        {/* Master Apartment image */}
        <div
          className="md:col-span-12 lg:col-span-4 h-[400px] relative overflow-hidden animate-reveal group"
          style={{ animationDelay: "500ms" }}
        >
          <img
            src={roomMaster}
            alt="Master apartment interior"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
              Interiors
            </p>
            <p className="font-display text-2xl mt-2">Warm. Considered.</p>
          </div>
        </div>

        {/* Why choose us row */}
        <section
          className="md:col-span-12 bg-dark border border-gold/15 p-8 md:p-12 animate-reveal"
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
            <SectionHeading
              eyebrow="Why guests choose us"
              title="Small details, quietly done well."
            />
            <Link
              to="/why-choose-us"
              className="text-[11px] uppercase tracking-[0.25em] text-gold hover:text-gold-light border-b border-gold pb-1 self-start md:self-end"
            >
              Read more
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n: "01", t: "Warm hospitality", d: "Attentive hosts who know Rakops well." },
              { n: "02", t: "Quiet by design", d: "A calm, private plot tucked from the road." },
              { n: "03", t: "Secure parking", d: "Gated on-site parking for every guest." },
              { n: "04", t: "Self-catering", d: "Your own kitchen, your own rhythm." },
            ].map((f) => (
              <div key={f.n} className="border-t border-gold/20 pt-5">
                <span className="text-gold font-display text-lg">{f.n}</span>
                <h4 className="font-display text-xl mt-3">{f.t}</h4>
                <p className="text-sm text-paper/60 mt-2 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section
          className="md:col-span-12 bg-dark border border-gold/15 p-8 md:p-12 grid md:grid-cols-2 gap-10 md:gap-16 items-center animate-reveal"
          style={{ animationDelay: "700ms" }}
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              Find us
            </span>
            <h3 className="font-display text-4xl md:text-5xl mt-5 mb-6 leading-[1.05]">
              Rakops, in the Boteti region.
            </h3>
            <p className="text-paper/60 mb-8 text-sm md:text-base leading-relaxed max-w-md">
              A restful stop for travellers exploring Makgadikgadi, the Boteti River, and
              Central Kalahari — impeccably maintained, and always ready for you.
            </p>
            <dl className="space-y-4">
              <div className="flex items-center gap-6">
                <dt className="text-gold uppercase tracking-widest text-[10px] w-16">Call</dt>
                <dd className="text-sm">+267 71 621 866</dd>
              </div>
              <div className="flex items-center gap-6">
                <dt className="text-gold uppercase tracking-widest text-[10px] w-16">Loc</dt>
                <dd className="text-sm">Plot 2903, Rakops, Botswana</dd>
              </div>
            </dl>
            <div className="mt-8">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 border border-gold text-gold hover:bg-gold hover:text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
              >
                Reserve your stay
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="h-64 md:h-80 lg:h-96">
            <RakopsMap className="h-full" />
          </div>
        </section>

        {/* Availability & rates */}
        <div className="md:col-span-12 animate-reveal" style={{ animationDelay: "760ms" }}>
          <AvailabilityChecker title="Check availability & rates" />
        </div>
      </div>

      <ExploreRakops />
    </div>
  );
}
