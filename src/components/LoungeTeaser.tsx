import { Link } from "@tanstack/react-router";
import { ArrowUpRight, UtensilsCrossed, Bike } from "lucide-react";

export function LoungeTeaser() {
  return (
    <section className="mt-16 md:mt-24 border border-ember/20 bg-ember/[0.04] p-8 md:p-12">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-ember font-semibold">
            Engliton Lounge · 3 km away
          </p>
          <h2 className="font-display text-3xl md:text-4xl mt-4">
            Wood-fired pizza and hearty plates,{" "}
            <span className="italic text-ember-light">delivered to your door.</span>
          </h2>
          <p className="text-sm text-paper/65 mt-4 max-w-xl leading-relaxed">
            Order from Engliton Lounge for collection, or have it brought straight to your apartment
            while you are staying with us. Pay in cash, by transfer or Orange Money.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-[11px] uppercase tracking-[0.2em] text-paper/50">
            <span className="inline-flex items-center gap-2">
              <UtensilsCrossed className="h-3.5 w-3.5 text-ember" /> Full menu
            </span>
            <span className="inline-flex items-center gap-2">
              <Bike className="h-3.5 w-3.5 text-ember" /> Delivery for guests
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/lounge"
            className="inline-flex items-center gap-2 bg-ember px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark hover:bg-ember-light transition-colors"
          >
            Visit the lounge <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/lounge/menu"
            className="inline-flex items-center gap-2 border border-ember/40 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark transition-colors"
          >
            See the menu
          </Link>
        </div>
      </div>
    </section>
  );
}
