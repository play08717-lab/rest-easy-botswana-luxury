import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Rest Easy Apartment" },
      { name: "description", content: "Booking, check-in, guest responsibilities and liability terms for Rest Easy Apartment." },
      { property: "og:title", content: "Terms & Conditions — Rest Easy Apartment" },
      { property: "og:description", content: "Booking and stay terms for guests of Rest Easy Apartment." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title={<>Terms & <em className="text-gold-light">Conditions</em></>}>
      <LegalSection title="Booking">
        <p>Bookings are only confirmed after payment has been received or as otherwise agreed.</p>
      </LegalSection>

      <LegalSection title="Check-In & Check-Out">
        <p>Standard check-in: 2:00 PM</p>
        <p>Standard check-out: 10:00 AM</p>
      </LegalSection>

      <LegalSection title="Guest Responsibilities">
        <p>Guests agree to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Respect other guests</li>
          <li>Keep the apartment clean</li>
          <li>Avoid damaging property</li>
          <li>Follow house rules</li>
        </ul>
        <p>Guests are responsible for any damages caused during their stay.</p>
      </LegalSection>

      <LegalSection title="Smoking">
        <p>Smoking inside apartments is prohibited.</p>
      </LegalSection>

      <LegalSection title="Pets">
        <p>Pets are only allowed with prior approval.</p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          Rest Easy Apartment is not responsible for loss, theft, or damage to personal
          belongings.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
