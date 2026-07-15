import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { ApartmentCard } from "@/components/ApartmentCard";
import { apartments } from "@/data/apartments";

export const Route = createFileRoute("/apartments")({
  head: () => ({
    meta: [
      { title: "Apartments — Rest Easy, Rakops" },
      {
        name: "description",
        content:
          "Three self-catering apartments in Rakops: the Executive Studio, Master Apartment, and Garden Suite. Enquire on WhatsApp +267 71 621 866.",
      },
      { property: "og:title", content: "Apartments — Rest Easy, Rakops" },
      {
        property: "og:description",
        content:
          "Three self-catering apartments in the heart of Rakops, Botswana.",
      },
      { property: "og:url", content: "/apartments" },
    ],
    links: [{ rel: "canonical", href: "/apartments" }],
  }),
  component: Apartments,
});

function Apartments() {
  return (
    <>
      <PageHero
        eyebrow="Residences"
        title={<>Three quiet apartments. <span className="italic text-gold-light">One warm welcome.</span></>}
        intro="Each apartment is set up for self-catering, with its own entrance, en-suite and thoughtfully chosen essentials. Pricing on request — message us on WhatsApp for availability."
      />

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {apartments.map((apt, i) => (
          <ApartmentCard key={apt.slug} apt={apt} index={i} />
        ))}
      </section>

      <section className="mt-16 md:mt-24 bg-paper text-dark p-8 md:p-12 grid md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
            Longer stays
          </span>
          <h3 className="font-display text-2xl md:text-3xl mt-4">
            Staying with us for a week or more?
          </h3>
          <p className="text-sm text-dark/60 mt-3 max-w-xl">
            We're happy to discuss extended-stay arrangements. Reach out on WhatsApp and
            we'll tailor a rate for your dates.
          </p>
        </div>
        <a
          href="https://wa.me/26771621866"
          target="_blank"
          rel="noopener noreferrer"
          className="justify-self-start md:justify-self-end bg-dark text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold hover:text-dark transition-colors"
        >
          Message us
        </a>
      </section>
    </>
  );
}
