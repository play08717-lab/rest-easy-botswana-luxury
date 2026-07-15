import { createFileRoute } from "@tanstack/react-router";
import interiorLounge from "@/assets/interior-lounge.jpg";
import detailFloor from "@/assets/detail-floor.jpg";
import { PageHero } from "@/components/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "The story of Rest Easy Apartment: a quiet self-catering guest house on Plot 2903, Rakops, welcoming travellers to Botswana's Boteti region.",
      },
      { property: "og:title", content: "About Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "A quiet self-catering retreat in Rakops, Botswana — designed for the discerning traveller.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={<>A quiet retreat, <span className="italic text-gold-light">crafted with care.</span></>}
        intro="Rest Easy Apartment is a small, family-run self-catering guest house in the heart of Rakops. Our home was built to welcome travellers of the Boteti — with the calm of a private stay and the warmth of a Botswana greeting."
      />

      <section className="grid md:grid-cols-12 gap-10 md:gap-14 items-center py-16 md:py-20">
        <div className="md:col-span-6 order-2 md:order-1">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
            Philosophy
          </span>
          <h2 className="font-display text-3xl md:text-4xl mt-5 mb-6 leading-[1.05]">
            Home, first. Hospitality, always.
          </h2>
          <p className="text-paper/70 leading-relaxed mb-4">
            We keep our promises small and our standards high. Clean linen. Warm light.
            A quiet plot. A host on the other end of the phone when you need us.
          </p>
          <p className="text-paper/70 leading-relaxed">
            Whether you're passing through on a longer journey or settling in for a
            season of work, Rest Easy is built for the rhythm of your own days —
            your kitchen, your key, your time.
          </p>
        </div>
        <div className="md:col-span-6 order-1 md:order-2 relative">
          <img
            src={interiorLounge}
            alt="Warm interior of a Rest Easy communal space"
            loading="lazy"
            className="w-full h-[420px] md:h-[520px] object-cover"
          />
          <div className="absolute -bottom-6 -left-4 md:-left-8 hidden md:block bg-paper text-dark p-6 max-w-xs">
            <p className="font-display italic text-lg leading-snug">
              "A calm and considered stay."
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            <img
              src={detailFloor}
              alt="Sunlit hallway detail"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              What to expect
            </span>
            <h3 className="font-display text-3xl md:text-4xl mt-5 mb-6 leading-[1.05]">
              A stay tailored to independent travellers.
            </h3>
            <ul className="space-y-5">
              {[
                { t: "Private apartments", d: "Each unit has its own entrance and en-suite." },
                { t: "Self-catering setup", d: "Kitchen or kitchenette with the essentials." },
                { t: "Secure parking", d: "Gated, on-site parking for every guest." },
                { t: "Quiet location", d: "Tucked away from the main road for restful nights." },
              ].map((f, i) => (
                <li key={f.t} className="flex gap-5 border-b border-gold/10 pb-4">
                  <span className="text-gold font-display text-lg">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium">{f.t}</p>
                    <p className="text-sm text-paper/60 mt-1">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
