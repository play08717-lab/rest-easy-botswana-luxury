import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/lounge")({
  head: () => ({ meta: [{ title: "Engliton Lounge — Admin" }, { name: "robots", content: "noindex" }] }),
  component: LoungeAdminLayout,
  errorComponent: ({ error }) => <p className="text-red-400">{error.message}</p>,
});

const tabs: Array<{
  to: "/admin/lounge" | "/admin/lounge/menu" | "/admin/lounge/promotions" | "/admin/lounge/reports" | "/admin/lounge/settings";
  label: string;
  exact?: boolean;
}> = [
  { to: "/admin/lounge", label: "Order board", exact: true },
  { to: "/admin/lounge/menu", label: "Menu" },
  { to: "/admin/lounge/promotions", label: "Promotions" },
  { to: "/admin/lounge/reports", label: "Sales reports" },
  { to: "/admin/lounge/settings", label: "Lounge settings" },
];

function LoungeAdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ember/20 pb-4">
        <span className="text-[10px] uppercase tracking-[0.3em] text-ember">Engliton Lounge</span>
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`text-[11px] uppercase tracking-[0.25em] ${
                active ? "text-ember-light" : "text-paper/50 hover:text-paper"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
