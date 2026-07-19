import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — Rest Easy Apartment" },
      { name: "description", content: "Cancellation windows, refund amounts, and no-show terms for Rest Easy Apartment bookings." },
      { property: "og:title", content: "Cancellation & Refund Policy" },
      { property: "og:description", content: "Cancellation and refund terms for Rest Easy Apartment." },
      { property: "og:url", content: "/cancellation" },
    ],
    links: [{ rel: "canonical", href: "/cancellation" }],
  }),
  component: CancellationPage,
});

function CancellationPage() {
  return (
    <LegalPage eyebrow="Legal" title={<>Cancellation & <em className="text-gold-light">Refund Policy</em></>}>
      <LegalSection title="Cancellation">
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-paper">More than 7 days before arrival:</strong> Full refund (excluding transaction fees, if applicable).</li>
          <li><strong className="text-paper">3–7 days before arrival:</strong> 50% refund.</li>
          <li><strong className="text-paper">Less than 72 hours before arrival:</strong> No refund.</li>
        </ul>
      </LegalSection>

      <LegalSection title="No Show">
        <p>Failure to arrive without notice may result in the full booking amount being charged.</p>
      </LegalSection>

      <LegalSection title="Refund Processing">
        <p>Approved refunds will normally be processed within 7–14 business days.</p>
      </LegalSection>
    </LegalPage>
  );
}
