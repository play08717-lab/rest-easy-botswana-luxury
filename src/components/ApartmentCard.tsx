import { Link } from "@tanstack/react-router";

export type Apartment = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  features: string[];
  priceFrom: string;
  image: string;
};

export function ApartmentCard({ apt, index = 0 }: { apt: Apartment; index?: number }) {
  return (
    <article
      className="group relative bg-dark ring-1 ring-gold/10 hover:ring-gold/40 transition-all duration-500 animate-reveal"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={apt.image}
          alt={`${apt.name} at Rest Easy Apartment`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/10 to-transparent" />
        <div className="absolute top-5 left-5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-light bg-dark/50 backdrop-blur-sm px-3 py-1 border border-gold/30">
            {apt.eyebrow}
          </span>
        </div>
      </div>

      <div className="p-8">
        <h3 className="font-display text-2xl mb-3">{apt.name}</h3>
        <p className="text-sm text-paper/60 leading-relaxed mb-6">{apt.description}</p>

        <ul className="space-y-2 mb-8">
          {apt.features.map((f) => (
            <li
              key={f}
              className="text-xs text-paper/70 flex items-center gap-3 border-b border-gold/5 pb-2"
            >
              <span className="w-1 h-1 bg-gold rounded-full" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between pt-4 border-t border-gold/10">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-paper/40 block">
              Enquire
            </span>
            <p className="font-display text-xl text-gold-light mt-1">{apt.priceFrom}</p>
          </div>
          <Link
            to="/book"
            className="text-[10px] uppercase tracking-[0.2em] border-b border-gold pb-1 hover:text-gold transition-colors"
          >
            Reserve
          </Link>
        </div>
      </div>
    </article>
  );
}
