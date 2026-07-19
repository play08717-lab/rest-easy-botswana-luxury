import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Rest Easy Apartment" },
      { name: "description", content: "How Rest Easy Apartment uses cookies and how you can control them." },
      { property: "og:title", content: "Cookie Policy — Rest Easy Apartment" },
      { property: "og:description", content: "How our website uses cookies." },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage eyebrow="Legal" title={<>Cookie <em className="text-gold-light">Policy</em></>}>
      <LegalSection title="How we use cookies">
        <p>Our website may use cookies to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Improve website performance</li>
          <li>Remember your preferences</li>
          <li>Analyse website traffic</li>
          <li>Enhance your browsing experience</li>
        </ul>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          You may disable cookies through your browser settings. Disabling cookies may affect
          some features of the website.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
