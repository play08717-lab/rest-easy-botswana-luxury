import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", (context as { user: { id: string } }).user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs: Array<{ to: "/admin" | "/admin/bookings" | "/admin/calendar" | "/admin/apartments" | "/admin/guests" | "/admin/housekeeping" | "/admin/reports" | "/admin/data-requests" | "/admin/settings"; label: string; exact?: boolean }> = [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/calendar", label: "Calendar" },
    { to: "/admin/bookings", label: "Bookings" },
    { to: "/admin/apartments", label: "Apartments" },
    { to: "/admin/guests", label: "Guests" },
    { to: "/admin/housekeeping", label: "Housekeeping" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/data-requests", label: "Data Requests" },
    { to: "/admin/settings", label: "Settings" },
  ];
  return (
    <div>
      <div className="border-b border-gold/15 pb-4 mb-8 flex flex-wrap gap-x-6 gap-y-3">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to} className={`text-[11px] uppercase tracking-[0.25em] ${active ? "text-gold" : "text-paper/50 hover:text-paper"}`}>
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
