import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { RakopsMap } from "@/components/RakopsMap";
import { Phone, MessageCircle, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "Call or WhatsApp +267 71 621 866. Rest Easy Apartment, Plot 2903, Rakops, Botswana.",
      },
      { property: "og:title", content: "Contact — Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "Reach us on WhatsApp or by phone. We reply within the day.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={<>We reply <span className="italic text-gold-light">within the day.</span></>}
        intro="The fastest way to reach us is on WhatsApp. Call anytime during Botswana hours, or send a message and we'll be in touch as soon as we can."
      />

      <section className="grid lg:grid-cols-2 gap-6 md:gap-8 mt-10">
        <div className="bg-paper text-dark p-8 md:p-10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              Direct
            </span>
            <h2 className="font-display text-3xl md:text-4xl mt-5 leading-[1.05]">
              Speak with us.
            </h2>
            <p className="text-sm text-dark/60 mt-4 max-w-md">
              For availability, longer stays, or anything you'd like to ask before you
              arrive.
            </p>

            <dl className="mt-10 space-y-6">
              <div className="flex items-start gap-5">
                <Phone className="w-4 h-4 text-gold mt-1 shrink-0" />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-1">
                    Phone
                  </dt>
                  <dd className="text-lg font-medium">+267 71 621 866</dd>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <MessageCircle className="w-4 h-4 text-gold mt-1 shrink-0" />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-1">
                    WhatsApp
                  </dt>
                  <dd className="text-lg font-medium">+267 71 621 866</dd>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <MapPin className="w-4 h-4 text-gold mt-1 shrink-0" />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-1">
                    Address
                  </dt>
                  <dd className="text-lg font-medium">Plot 2903, Rakops, Botswana</dd>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <Clock className="w-4 h-4 text-gold mt-1 shrink-0" />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-1">
                    Check-in
                  </dt>
                  <dd className="text-lg font-medium">From 14:00 · By arrangement</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="https://wa.me/26771621866"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold hover:text-dark transition-colors"
            >
              Message on WhatsApp
            </a>
            <a
              href="tel:+26771621866"
              className="border border-dark/30 text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-dark hover:text-paper transition-colors"
            >
              Call now
            </a>
          </div>
        </div>

        <div className="min-h-[420px] lg:min-h-full">
          <RakopsMap className="h-full min-h-[420px]" />
        </div>
      </section>
    </>
  );
}
