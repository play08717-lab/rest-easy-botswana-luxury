import { useState } from "react";
import { MapPin, Navigation, Clock, TriangleAlert } from "lucide-react";

type Destination = {
  key: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  distance: string;
  driving: string;
  advisory: string;
  text: string;
};

const BASE = {
  key: "base",
  name: "Rest Easy Apartment — Plot 2903",
  lat: -21.0244,
  lng: 24.3722,
  zoom: 14,
  distance: "Your base",
  driving: "Plot 2903, Rakops",
  advisory: "Sedan-friendly access, gated parking on site",
  text: "Quiet self-catering apartments in the centre of Rakops — the natural staging post for the Boteti and Kalahari.",
} satisfies Destination;

const destinations: Destination[] = [
  {
    key: "ckgr",
    name: "Central Kalahari Game Reserve — Matswere Gate",
    lat: -20.9256,
    lng: 24.1361,
    zoom: 10,
    distance: "Approx. 45 km",
    driving: "1 – 1.5 hours",
    advisory: "4×4 essential beyond the gate — deep sand, no fuel inside",
    text: "The nearest entry into one of Africa's largest protected wildernesses. Deception Valley lies a further few hours south.",
  },
  {
    key: "pans",
    name: "Makgadikgadi Pans",
    lat: -20.5,
    lng: 25.2,
    zoom: 8,
    distance: "Approx. 90 km",
    driving: "1.5 – 2 hours",
    advisory: "4×4 advised; pans impassable after rain",
    text: "Vast salt flats stretching past the horizon. Best at first light or sunset, when the crust turns to mirror.",
  },
  {
    key: "boteti",
    name: "Boteti River",
    lat: -21.03,
    lng: 24.4,
    zoom: 12,
    distance: "On the edge of Rakops",
    driving: "5 – 15 minutes",
    advisory: "High clearance helpful on riverbank tracks",
    text: "The seasonal river that draws elephant and zebra to its banks — a short drive from your door.",
  },
];

const all = [BASE, ...destinations];

export function ExploreRakops() {
  const [activeKey, setActiveKey] = useState(BASE.key);
  const active = all.find((d) => d.key === activeKey) ?? BASE;
  const embed = `https://www.google.com/maps?q=${active.lat},${active.lng}&z=${active.zoom}&output=embed`;

  return (
    <section className="mt-16 md:mt-24 bg-dark border border-gold/15 p-6 md:p-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-2xl">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
            Beyond the gate
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-5 leading-[1.05] text-balance">
            Exploring Rakops &amp; the Kalahari
          </h2>
          <p className="mt-5 text-sm md:text-base text-paper/60 leading-relaxed">
            Select a destination to recentre the map. Distances and times are approximate — ask
            us for current road and water conditions before you set out.
          </p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {all.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveKey(d.key)}
                aria-pressed={activeKey === d.key}
                className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                  activeKey === d.key
                    ? "bg-gold text-dark border-gold"
                    : "border-gold/30 text-paper/70 hover:border-gold hover:text-gold"
                }`}
              >
                <MapPin className="w-3 h-3" />
                {d.key === "base" ? "Plot 2903" : d.name.split("—")[0].trim()}
              </button>
            ))}
          </div>
          <div className="relative h-72 md:h-[420px] overflow-hidden ring-1 ring-gold/20">
            <iframe
              key={active.key}
              title={`Map of ${active.name}`}
              src={embed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0 grayscale contrast-125 brightness-90"
            />
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-dark/80 backdrop-blur-sm border border-gold/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold-light">
                {active.name}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-paper/70 hover:text-gold transition-colors"
              >
                Directions
                <Navigation className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {destinations.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveKey(d.key)}
              className={`text-left p-5 border transition-all duration-500 ${
                activeKey === d.key
                  ? "border-gold/60 bg-gold/5"
                  : "border-gold/15 hover:border-gold/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg leading-tight">{d.name}</h3>
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-1" />
              </div>
              <p className="text-xs text-paper/60 mt-3 leading-relaxed">{d.text}</p>
              <dl className="mt-4 space-y-2 border-t border-gold/10 pt-3">
                <div className="flex items-center gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-gold w-16">Dist</dt>
                  <dd className="text-xs text-paper/80">{d.distance}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-gold w-16">
                    <Clock className="w-3 h-3 inline" />
                  </dt>
                  <dd className="text-xs text-paper/80">{d.driving}</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="text-[10px] uppercase tracking-widest text-gold w-16">
                    <TriangleAlert className="w-3 h-3 inline" />
                  </dt>
                  <dd className="text-xs text-paper/60">{d.advisory}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
