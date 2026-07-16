import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";

const FAQS = [
  { q: "Where is Rest Easy Apartment located?", a: "Plot 2903, Rakops, Botswana — in the Boteti sub-district, a comfortable base for exploring the Makgadikgadi Pans, Boteti River, and Central Kalahari." },
  { q: "How do I book?", a: "Search availability on the Book Now page, choose your apartment, and submit your details. You'll receive bank details for a manual EFT and your reservation is confirmed once payment is received." },
  { q: "How do I pay?", a: "Payment is by bank transfer (EFT). Full bank details appear on your booking confirmation page. Please use your booking reference on the transfer so we can match your payment quickly." },
  { q: "What are check-in and check-out times?", a: "Standard check-in is from 14:00 and check-out by 10:00. Earlier or later times can be arranged on request — WhatsApp us to confirm." },
  { q: "Can I cancel or change my booking?", a: "Yes. Cancellations made more than 48 hours before check-in are free. Later cancellations may not be refundable. Reach out on WhatsApp to change dates." },
  { q: "Is it self-catering?", a: "Yes — every apartment has a kitchenette or full kitchen so you can prepare your own meals. Bring your groceries; a small shop is nearby in Rakops." },
  { q: "Is parking available?", a: "Yes — secure parking on the premises." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Rest Easy Apartment, Rakops" },
      { name: "description", content: "Answers to common questions about booking, payment, check-in and stays at Rest Easy Apartment in Rakops, Botswana." },
      { property: "og:title", content: "Frequently Asked Questions" },
      { property: "og:description", content: "Everything you need to know before booking." },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      })},
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title={<>Answers to <em className="text-gold-light">common questions</em></>} />
      <div className="mt-10 max-w-3xl space-y-3">
        {FAQS.map((f, i) => (
          <details key={i} className="group bg-dark border border-gold/15 p-6 open:border-gold/40 transition-colors">
            <summary className="cursor-pointer list-none flex justify-between items-center font-display text-lg">
              {f.q}
              <span className="text-gold group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-4 text-sm text-paper/70 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
