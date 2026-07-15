import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import {
  KeyRound,
  Car,
  Coffee,
  Moon,
  Phone,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/why-choose-us")({
  head: () => ({
    meta: [
      { title: "Why Choose Us — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "Warm hospitality, secure parking, a quiet location and a fully self-catering setup — small details, quietly done well.",
      },
      { property: "og:title", content: "Why Choose Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "The small details that make a stay feel like home.",
      },
      { property: "og:url", content: "/why-choose-us" },
    ],
    links: [{ rel: "canonical", href: "/why-choose-us" }],
  }),
  component: WhyChooseUs,
});

const features = [
  {
    icon: Sparkles,
    title: "Warm hospitality",
    text: "Attentive hosts who know Rakops well and are always a phone call away.",
  },
  {
    icon: Moon,
    title: "Quiet by design",
    text: "A calm plot tucked away from the main road for restful nights.",
  },
  {
    icon: Car,
    title: "Secure parking",
    text: "Gated, on-site parking included for every guest.",
  },
  {
    icon: KeyRound,
    title: "Private entrance",
    text: "Each apartment has its own key and its own front door.",
  },
  {
    icon: Coffee,
    title: "Self-catering",
    text: "Kitchen or kitchenette with the essentials — cook when it suits you.",
  },
  {
    icon: Phone,
    title: "Easy to book",
    text: "Message us on WhatsApp and we'll confirm within the day.",
  },
];

function WhyChooseUs() {
  return (
    <>
      <PageHero
        eyebrow="Why guests return"
        title={<>Small details, <span className="italic text-gold-light">quietly done well.</span></>}
        intro="We keep our promises modest and our standards high. Here's what you can count on when you stay with us."
      />

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <article
              key={f.title}
              className="bg-dark border border-gold/15 p-8 hover:border-gold/50 transition-colors duration-500 animate-reveal"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 grid place-items-center border border-gold/40 text-gold mb-6">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-display text-2xl mb-3">{f.title}</h3>
              <p className="text-sm text-paper/60 leading-relaxed">{f.text}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-20 md:mt-24 border-t border-gold/10 pt-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              What guests say
            </span>
            <h3 className="font-display text-3xl md:text-4xl mt-5 leading-[1.05]">
              A calm base for the road ahead.
            </h3>
          </div>
          <div className="space-y-8">
            {[
              {
                q: "Clean, quiet and warmly welcomed on arrival. Exactly what we needed after a long drive.",
                a: "A returning guest",
              },
              {
                q: "The apartment felt like a real home. Easy to cook in, easy to rest in.",
                a: "A self-drive traveller",
              },
            ].map((t) => (
              <blockquote key={t.a} className="border-l border-gold pl-6">
                <p className="font-display italic text-xl leading-snug">"{t.q}"</p>
                <cite className="text-[10px] uppercase tracking-[0.3em] text-paper/50 mt-3 block not-italic">
                  — {t.a}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
