import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/house-rules")({
  head: () => ({
    meta: [
      { title: "House Rules — Rest Easy Apartment" },
      { name: "description", content: "Simple house rules to keep Rest Easy Apartment comfortable for every guest." },
      { property: "og:title", content: "House Rules — Rest Easy Apartment" },
      { property: "og:description", content: "House rules for guests at Rest Easy Apartment." },
      { property: "og:url", content: "/house-rules" },
    ],
    links: [{ rel: "canonical", href: "/house-rules" }],
  }),
  component: HouseRulesPage,
});

function HouseRulesPage() {
  return (
    <LegalPage eyebrow="Stay" title={<>House <em className="text-gold-light">Rules</em></>}>
      <LegalSection title="For a comfortable stay">
        <ul className="list-disc pl-6 space-y-2">
          <li>Check-in from 2:00 PM</li>
          <li>Check-out by 10:00 AM</li>
          <li>No loud music after 10:00 PM</li>
          <li>No smoking inside apartments</li>
          <li>Respect other guests</li>
          <li>Keep the property clean</li>
          <li>Children must be supervised</li>
          <li>Visitors should be reported to management where required</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
