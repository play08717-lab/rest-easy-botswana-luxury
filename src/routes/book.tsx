import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { apartments } from "@/data/apartments";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Now — Rest Easy Apartment, Rakops" },
      {
        name: "description",
        content:
          "Reserve your stay at Rest Easy Apartment. Send a WhatsApp booking request in one tap.",
      },
      { property: "og:title", content: "Book Now — Rest Easy Apartment" },
      {
        property: "og:description",
        content:
          "Send a booking request on WhatsApp — we confirm within the day.",
      },
      { property: "og:url", content: "/book" },
    ],
    links: [{ rel: "canonical", href: "/book" }],
  }),
  component: Book,
});

function Book() {
  const [form, setForm] = useState({
    name: "",
    apartment: apartments[0].name,
    checkIn: "",
    checkOut: "",
    guests: "2",
    notes: "",
  });

  const whatsappUrl = useMemo(() => {
    const msg = [
      `Hello Rest Easy Apartment,`,
      ``,
      `I'd like to enquire about a stay:`,
      `• Name: ${form.name || "—"}`,
      `• Apartment: ${form.apartment}`,
      `• Check-in: ${form.checkIn || "—"}`,
      `• Check-out: ${form.checkOut || "—"}`,
      `• Guests: ${form.guests}`,
      form.notes ? `• Notes: ${form.notes}` : "",
      ``,
      `Thank you.`,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/26771621866?text=${encodeURIComponent(msg)}`;
  }, [form]);

  return (
    <>
      <PageHero
        eyebrow="Reserve"
        title={<>Send a request. <span className="italic text-gold-light">We'll take it from there.</span></>}
        intro="Fill in your details below — we'll open WhatsApp with your enquiry pre-filled. It's the quickest way to check availability."
      />

      <section className="grid lg:grid-cols-5 gap-6 md:gap-8 mt-10">
        <form
          className="lg:col-span-3 bg-paper text-dark p-8 md:p-10 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <Field
            label="Your name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Full name"
            required
          />

          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-dark/50 block mb-2">
              Apartment
            </label>
            <select
              value={form.apartment}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              className="w-full bg-transparent border-b border-dark/20 focus:border-gold outline-none py-3 text-base"
            >
              {apartments.map((a) => (
                <option key={a.slug} value={a.name}>
                  {a.name}
                </option>
              ))}
              <option value="Any / help me decide">Any / help me decide</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field
              label="Check-in"
              type="date"
              value={form.checkIn}
              onChange={(v) => setForm({ ...form, checkIn: v })}
            />
            <Field
              label="Check-out"
              type="date"
              value={form.checkOut}
              onChange={(v) => setForm({ ...form, checkOut: v })}
            />
          </div>

          <Field
            label="Guests"
            type="number"
            value={form.guests}
            onChange={(v) => setForm({ ...form, guests: v })}
          />

          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-dark/50 block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Arrival time, special requests…"
              className="w-full bg-transparent border-b border-dark/20 focus:border-gold outline-none py-3 text-base resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center gap-3 bg-dark text-paper px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold hover:text-dark transition-colors"
          >
            Send on WhatsApp
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-dark/50">
            No booking is confirmed until we reply. You can also call +267 71 621 866.
          </p>
        </form>

        <aside className="lg:col-span-2 bg-dark border border-gold/15 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
              How booking works
            </span>
            <h2 className="font-display text-3xl mt-5 leading-[1.05]">
              Simple, and personal.
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                "Send us your dates and preferred apartment.",
                "We reply on WhatsApp with availability and rate.",
                "You confirm — and we'll be ready for your arrival.",
              ].map((t, i) => (
                <li key={t} className="flex gap-5">
                  <span className="text-gold font-display text-lg leading-none pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-paper/70 leading-relaxed">{t}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-10 pt-8 border-t border-gold/15">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Direct line</p>
            <p className="text-lg mt-2">+267 71 621 866</p>
            <p className="text-sm text-paper/50 mt-4">
              Plot 2903, Rakops, Botswana
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-dark/50 block mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border-b border-dark/20 focus:border-gold outline-none py-3 text-base"
      />
    </div>
  );
}
