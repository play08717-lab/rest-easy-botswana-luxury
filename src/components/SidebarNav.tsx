import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Phone } from "lucide-react";
import { useSession, useIsAdmin } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/apartments", label: "Apartments" },
  { to: "/why-choose-us", label: "Why Choose Us" },
  { to: "/gallery", label: "Gallery" },
  { to: "/nearby", label: "Nearby" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/book", label: "Book Now" },
] as const;

const WHATSAPP_URL = "https://wa.me/26771621866";

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const isAdmin = useIsAdmin();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between h-16 px-5 bg-dark/95 backdrop-blur-md border-b border-gold/15">
        <Link to="/" className="font-display text-lg tracking-tight text-gold-light leading-none">
          REST EASY
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="text-paper hover:text-gold transition-colors"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen w-72 bg-dark border-r border-gold/20 flex-col justify-between py-10 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${open ? "flex translate-x-0" : "hidden lg:flex lg:translate-x-0 -translate-x-full"}`}
      >
        <div className="px-10">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="font-display text-3xl font-semibold tracking-tight text-gold-light leading-none block"
          >
            REST<br />EASY
          </Link>
          <p className="text-[10px] uppercase tracking-[0.35em] mt-4 text-paper/40 font-medium">
            Rakops · Botswana
          </p>
          <div className="mt-3 h-px w-10 bg-gold/60" />
        </div>

        <ul className="flex flex-col gap-5 px-10 mt-10">
          {links.map((l) => {
            const active =
              l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`group relative text-[13px] uppercase tracking-[0.2em] transition-colors ${
                    active ? "text-gold" : "text-paper/60 hover:text-gold"
                  }`}
                >
                  <span className="inline-block">
                    {l.label}
                    <span
                      className={`block h-px bg-gold transition-all duration-500 ${
                        active ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-10 space-y-4">
          <div className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.2em]">
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="text-paper/60 hover:text-gold">My bookings</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-paper/60 hover:text-gold">Admin</Link>
                )}
                <button onClick={() => supabase.auth.signOut()} className="text-left text-paper/40 hover:text-gold">Sign out</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="text-paper/60 hover:text-gold">Sign in</Link>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-3 bg-gold hover:bg-gold-light text-dark py-4 px-6 rounded-sm transition-all duration-300 group"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Book via WhatsApp
              </span>
            </a>
            <a
              href="tel:+26771621866"
              onClick={() =>
                toast.success("Opening the dialer…", {
                  description: "Calling Rest Easy Apartment on +267 71 621 866",
                })
              }
              aria-label="Call +267 71 621 866"
              className="flex items-center justify-center gap-2 px-4 rounded-sm border border-gold/40 text-gold hover:bg-gold hover:text-dark transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] hidden sm:inline">
                Call now
              </span>
            </a>
          </div>
          <p className="text-[10px] text-paper/40 text-center tracking-widest">
            +267 71 621 866
          </p>

        </div>
      </nav>
    </>
  );
}
