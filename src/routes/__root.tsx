import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarNav } from "../components/SidebarNav";
import { FloatingWhatsApp } from "../components/FloatingWhatsApp";
import { Footer } from "../components/Footer";
import { CookieBanner } from "../components/CookieBanner";
import { GlobalAssistant } from "../components/GlobalAssistant";


function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">404</p>
        <h1 className="mt-4 font-display text-5xl">Not found</h1>
        <p className="mt-4 text-sm text-paper/60">
          The page you're looking for isn't here. Let's take you back to the entrance.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold-light transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">Something went wrong</p>
        <h1 className="mt-4 font-display text-4xl">This page didn't load</h1>
        <p className="mt-4 text-sm text-paper/60">
          Please try again in a moment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold-light transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-gold/40 text-paper px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold/10 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rest Easy Apartment — Boutique Self-Catering in Rakops, Botswana" },
      {
        name: "description",
        content:
          "Rest Easy Apartment offers refined self-catering accommodation on Plot 2903, Rakops. Warm hospitality, secure parking and a quiet retreat in the Boteti region.",
      },
      { name: "author", content: "Rest Easy Apartment" },
      { property: "og:site_name", content: "Rest Easy Apartment" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Rest Easy Apartment — Boutique Self-Catering, Rakops" },
      {
        property: "og:description",
        content:
          "Refined self-catering apartments in Rakops, Botswana. Book on WhatsApp +267 71 621 866.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: "Rest Easy Apartment",
          description:
            "Self-catering boutique guest house in Rakops, Botswana.",
          telephone: "+267 71 621 866",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Plot 2903",
            addressLocality: "Rakops",
            addressCountry: "BW",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark text-paper">
        <SidebarNav />
        <main className="lg:ml-72 pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto px-5 md:px-10 py-8 md:py-12">
            <Outlet />
            <Footer />
          </div>
        </main>
        <FloatingWhatsApp />
        <GlobalAssistant />
        <CookieBanner />

      </div>
    </QueryClientProvider>
  );
}
