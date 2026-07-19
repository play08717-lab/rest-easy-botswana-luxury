import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Rest Easy Apartment" },
      { name: "description", content: "How Rest Easy Apartment collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Rest Easy Apartment" },
      { property: "og:description", content: "Our commitment to protecting guest personal information." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title={<>Privacy <em className="text-gold-light">Policy</em></>}>
      <p>
        At Rest Easy Apartment, we respect your privacy and are committed to protecting your
        personal information. This policy explains what we collect and how we use it.
      </p>

      <LegalSection title="Information We Collect">
        <p>When you make a booking or contact us, we may collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Full name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Nationality</li>
          <li>Identification details (where required)</li>
          <li>Check-in and check-out dates</li>
          <li>Number of guests</li>
          <li>Payment confirmation information</li>
        </ul>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <p>Your information is used to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Process bookings</li>
          <li>Confirm reservations</li>
          <li>Contact you regarding your stay</li>
          <li>Improve our services</li>
          <li>Meet legal and regulatory requirements</li>
        </ul>
      </LegalSection>

      <LegalSection title="Information Security">
        <p>
          We use appropriate security measures — including encrypted connections (HTTPS),
          hashed passwords, role-based staff access, activity logging, and managed database
          backups — to protect your information from unauthorised access, loss, or misuse.
        </p>
      </LegalSection>

      <LegalSection title="Sharing Information">
        <p>We do not sell or rent your personal information.</p>
        <p>Information may only be shared where required by law or to process your booking.</p>
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>You may request to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>View your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information where legally permitted</li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Rest Easy Apartment<br />
          Plot 2903, Rakops, Botswana<br />
          Phone: +267 71 621 866
        </p>
      </LegalSection>
    </LegalPage>
  );
}
