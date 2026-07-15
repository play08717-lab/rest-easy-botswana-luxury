import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";

import heroExterior from "@/assets/hero-exterior.jpg";
import roomExecutive from "@/assets/room-executive.jpg";
import roomMaster from "@/assets/room-master.jpg";
import roomGarden from "@/assets/room-garden.jpg";
import detailHardware from "@/assets/detail-hardware.jpg";
import detailFloor from "@/assets/detail-floor.jpg";
import interiorLounge from "@/assets/interior-lounge.jpg";
import interiorDining from "@/assets/interior-dining.jpg";
import interiorBath from "@/assets/interior-bath.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "A visual tour of Rest Easy Apartment: interiors, details, and the quiet character of our Rakops property.",
      },
      { property: "og:title", content: "Gallery — Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "Interiors and details of our self-catering apartments in Rakops, Botswana.",
      },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

type Tile = { src: string; alt: string; span: string };

const tiles: Tile[] = [
  { src: heroExterior, alt: "Rest Easy exterior at sunset", span: "md:col-span-8 md:row-span-2 h-[400px] md:h-[560px]" },
  { src: interiorLounge, alt: "Warm interior lounge", span: "md:col-span-4 h-[270px]" },
  { src: detailHardware, alt: "Brass hardware detail", span: "md:col-span-4 h-[280px]" },
  { src: roomExecutive, alt: "Executive studio bedroom", span: "md:col-span-4 h-[360px]" },
  { src: interiorDining, alt: "Dining nook with morning light", span: "md:col-span-4 h-[360px]" },
  { src: detailFloor, alt: "Sunlit hallway floor", span: "md:col-span-4 h-[360px]" },
  { src: roomMaster, alt: "Master apartment interior", span: "md:col-span-6 h-[420px]" },
  { src: interiorBath, alt: "Bathroom detail", span: "md:col-span-3 h-[420px]" },
  { src: roomGarden, alt: "Garden suite view", span: "md:col-span-3 h-[420px]" },
];

function Gallery() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title={<>Interiors, <span className="italic text-gold-light">at a glance.</span></>}
        intro="A working preview of the property. Real photography will replace these images as our new gallery is completed."
      />

      <section className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 mt-10">
        {tiles.map((t, i) => (
          <figure
            key={t.src + i}
            className={`relative overflow-hidden group animate-reveal ${t.span}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img
              src={t.src}
              alt={t.alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <figcaption className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.25em] text-paper/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {t.alt}
            </figcaption>
          </figure>
        ))}
      </section>
    </>
  );
}
