import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import nearbyPans from "@/assets/nearby-pans.jpg";
import nearbyBoteti from "@/assets/nearby-boteti.jpg";
import nearbyKalahari from "@/assets/nearby-kalahari.jpg";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby Attractions — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "Rakops sits at the doorstep of Makgadikgadi Pans, the Boteti River and Central Kalahari Game Reserve.",
      },
      { property: "og:title", content: "Nearby — Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "Makgadikgadi Pans, Boteti River, Central Kalahari — Rakops is the gateway.",
      },
      { property: "og:url", content: "/nearby" },
    ],
    links: [{ rel: "canonical", href: "/nearby" }],
  }),
  component: Nearby,
});

const places = [
  {
    name: "Makgadikgadi Pans",
    image: nearbyPans,
    distance: "Approx. 90 km",
    text: "Vast salt pans stretching to the horizon — an otherworldly landscape best seen at sunset.",
  },
  {
    name: "Boteti River",
    image: nearbyBoteti,
    distance: "On the edge of Rakops",
    text: "The seasonal river that draws game to its banks — a short drive from your door.",
  },
  {
    name: "Central Kalahari Game Reserve",
    image: nearbyKalahari,
    distance: "Approx. 3–4 hours by 4×4",
    text: "One of Africa's largest protected wildernesses. Ideal for the self-drive traveller.",
  },
];

function Nearby() {
  return (
    <>
      <PageHero
        eyebrow="Nearby"
        title={<>The Boteti, <span className="italic text-gold-light">on your doorstep.</span></>}
        intro="Rakops is a natural base for exploring some of Botswana's most striking landscapes. Distances noted are approximate; ask us for the latest road conditions before you set out."
      />

      <section className="grid md:grid-cols-3 gap-4 md:gap-6 mt-10">
        {places.map((p, i) => (
          <article
            key={p.name}
            className="group relative bg-dark ring-1 ring-gold/15 hover:ring-gold/40 transition-all duration-500 animate-reveal"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </div>
            <div className="p-6 md:p-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {p.distance}
              </span>
              <h3 className="font-display text-2xl mt-3">{p.name}</h3>
              <p className="text-sm text-paper/60 mt-3 leading-relaxed">{p.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-16 md:mt-20 border-t border-gold/10 pt-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold mb-4">
          Local tips
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
          <p className="text-paper/70 text-sm leading-relaxed">
            The best light on the pans falls in the hour after sunrise and before sunset.
            Bring water, a warm layer for evenings, and a full tank of fuel.
          </p>
          <p className="text-paper/70 text-sm leading-relaxed">
            Game viewing along the Boteti is often best in the dry season. We're happy
            to point you toward reliable local guides.
          </p>
        </div>
      </section>
    </>
  );
}
