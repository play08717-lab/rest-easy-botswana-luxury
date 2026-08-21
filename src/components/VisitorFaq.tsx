import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";

type Faq = {
  q: string;
  a: string;
  list?: string[];
};

const faqs: Faq[] = [
  {
    q: "What vehicle do I need to reach Rakops and the surrounding game reserves?",
    a: "Rakops itself is reached via tar and good gravel roads — a standard sedan is perfectly fine to reach Rest Easy. Beyond the village, the story changes:",
    list: [
      "Central Kalahari Game Reserve (Matswere Gate): a 4×4 is essential beyond the gate. Deep sand, no fuel, and long stretches between waypoints.",
      "Makgadikgadi Pans: a 4×4 is strongly advised; the crust becomes impassable after rain.",
      "Boteti River tracks: a high-clearance vehicle is helpful but not always required.",
    ],
  },
  {
    q: "Are there fuel stations and supplies available nearby?",
    a: "Yes. Rakops has a small fuel outlet and basic supply shops, but stock and opening hours can be unpredictable — especially diesel during peak travel seasons or after heavy rains. We strongly recommend topping up in Maun or Letlhakane before you arrive, and carrying extra water and supplies for any trip into the reserves. Ask us for the latest local situation before you set out.",
  },
  {
    q: "What are the check-in times and self-catering kitchen amenities provided?",
    a: "Standard check-in is from 14:00 and check-out is by 10:00. Flexible arrivals can be arranged in advance on WhatsApp. Each apartment is fully self-catering, with:",
    list: [
      "A complete kitchen — gas/electric stove, fridge, cookware, utensils and crockery.",
      "Linen, towels, and daily essentials provided on arrival.",
      "Private bathroom with hot shower, and a comfortable lounge for relaxing after a day out.",
    ],
  },
  {
    q: "Do you offer secure parking for 4×4 rigs and trailers?",
    a: "Yes. Rest Easy offers gated, on-site parking within the plot, with space for 4×4 vehicles and trailers. The yard is enclosed and lit at night, and you keep the keys to your vehicle throughout your stay. Let us know the size of your rig when you book so we can confirm the best parking spot.",
  },
];

export function VisitorFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mt-16 md:mt-24 bg-dark border border-gold/15 p-6 md:p-12">
      <SectionHeading
        eyebrow="Before you arrive"
        title="Essential visitor info & FAQs"
        intro="Practical answers for travellers heading to Rakops and the Kalahari. Still unsure? Message us on WhatsApp and we'll help you plan."
      />

      <div className="mt-10 divide-y divide-gold/15 border-t border-b border-gold/15">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-start gap-5 py-5 text-left group"
              >
                <span className="mt-1 font-display text-gold text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-lg md:text-xl leading-snug text-paper group-hover:text-gold-light transition-colors">
                  {faq.q}
                </span>
                <span className="mt-1 shrink-0 w-8 h-8 grid place-items-center border border-gold/30 text-gold transition-colors group-hover:border-gold">
                  {isOpen ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pl-0 md:pl-10 pr-12 pb-6 text-sm md:text-base text-paper/70 leading-relaxed">
                    <p>{faq.a}</p>
                    {faq.list ? (
                      <ul className="mt-4 space-y-2">
                        {faq.list.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 border-l border-gold/30 pl-4"
                          >
                            <span className="mt-2 w-1 h-1 bg-gold rounded-full shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
          Still have questions?
        </p>
        <a
          href="https://wa.me/26771621866"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-gold text-gold hover:bg-gold hover:text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
        >
          Ask on WhatsApp
        </a>
      </div>
    </section>
  );
}
