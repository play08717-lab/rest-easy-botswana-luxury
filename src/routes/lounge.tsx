import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { getLoungeContext } from "@/lib/lounge.functions";
import { useLoungeCart } from "@/lib/lounge-cart";
import { ShoppingBag } from "lucide-react";

export const loungeContextQuery = {
  queryKey: ["lounge-context"] as const,
  queryFn: () => getLoungeContext(),
};

export const Route = createFileRoute("/lounge")({
  loader: ({ context }) => context.queryClient.ensureQueryData(loungeContextQuery),
  component: LoungeLayout,
  errorComponent: () => (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl text-ember-light">Engliton Lounge is offline</h1>
      <p className="mt-3 text-sm text-paper/60">
        We couldn't load the menu right now. Please call +267 71 621 866 to order.
      </p>
    </div>
  ),
  notFoundComponent: () => <p className="py-20 text-center text-paper/60">That lounge page doesn't exist.</p>,
});

const tabs = [
  { to: "/lounge", label: "Lounge", exact: true },
  { to: "/lounge/menu", label: "Menu" },
  { to: "/lounge/checkout", label: "Checkout" },
  { to: "/lounge/order", label: "Track order" },
] as const;

function LoungeLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useLoungeCart();

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -top-10 h-72 bg-[radial-gradient(60%_70%_at_20%_0%,rgba(217,100,47,0.18),transparent_70%)]"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ember/20 pb-4 mb-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`text-[11px] uppercase tracking-[0.25em] transition-colors ${
                    active ? "text-ember-light" : "text-paper/50 hover:text-paper"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <Link
            to="/lounge/checkout"
            className="inline-flex items-center gap-2 rounded-sm border border-ember/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-ember-light hover:bg-ember hover:text-dark transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Basket{count > 0 ? ` · ${count}` : ""}
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
