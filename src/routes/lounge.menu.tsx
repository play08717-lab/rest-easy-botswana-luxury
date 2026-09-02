import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { loungeContextQuery } from "./lounge";
import { LoungeMenu } from "@/components/LoungeMenu";

export const Route = createFileRoute("/lounge/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Engliton Lounge, Rakops" },
      {
        name: "description",
        content:
          "Browse the Engliton Lounge menu: pizza, main meals, sides, snacks and drinks. Add to your basket for collection or delivery in Rakops.",
      },
      { property: "og:title", content: "Engliton Lounge Menu" },
      { property: "og:description", content: "Pizza, main meals, sides and drinks — order for collection or delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data } = useSuspenseQuery(loungeContextQuery);
  return (
    <>
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ember">The menu</p>
        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
          Everything <span className="italic text-ember-light">on the fire</span> tonight.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-paper/65">
          Prices are in Botswana Pula. Items marked sold out are off the menu for today — the kitchen updates this
          list live.
        </p>
      </header>

      <div className="mt-10">
        <LoungeMenu
          categories={data.categories}
          items={data.items}
          whatsappNumber={data.settings?.whatsapp_number ?? ""}
        />
      </div>
    </>
  );
}
