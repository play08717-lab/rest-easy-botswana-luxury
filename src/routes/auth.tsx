import { useState } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/PageHero";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Rest Easy Apartment" },
      { name: "description", content: "Sign in or create an account to manage your bookings at Rest Easy Apartment." },
      { property: "og:title", content: "Sign in — Rest Easy Apartment" },
      { property: "og:description", content: "Manage your bookings and profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/account",
            data: { full_name: name, phone },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const dest = next && next.startsWith("/") ? next : "/account";
      nav({ to: dest });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow={mode === "signin" ? "Welcome back" : "Create account"}
        title={mode === "signin" ? <>Sign in <span className="italic text-gold-light">to your stay.</span></> : <>Create your <span className="italic text-gold-light">guest account.</span></>}
        intro={mode === "signin" ? "Access your bookings, download vouchers, and message reception." : "It only takes a moment — you'll use this to manage your bookings."}
      />

      <section className="grid lg:grid-cols-5 gap-8 mt-10">
        <form onSubmit={submit} className="lg:col-span-3 bg-paper text-dark p-8 md:p-10 space-y-6">
          {mode === "signup" && (
            <>
              <Field label="Full name" value={name} onChange={setName} required />
              <Field label="Phone" value={phone} onChange={setPhone} placeholder="+267 …" required />
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center gap-3 bg-dark text-paper px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-gold hover:text-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block text-xs text-dark/60 underline underline-offset-4"
          >
            {mode === "signin" ? "New here? Create an account →" : "Already have an account? Sign in →"}
          </button>
        </form>

        <aside className="lg:col-span-2 bg-dark border border-gold/15 p-8 md:p-10">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">Why sign in</span>
          <ul className="mt-6 space-y-4 text-sm text-paper/70 leading-relaxed">
            <li>• Book instantly with saved details</li>
            <li>• View and download voucher &amp; invoice</li>
            <li>• Cancel or modify (within policy)</li>
            <li>• Message reception before arrival</li>
          </ul>
          <p className="mt-8 text-xs text-paper/40">
            Prefer WhatsApp? <Link to="/book" className="text-gold underline">Send a request</Link> instead.
          </p>
        </aside>
      </section>
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-dark/50 block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border-b border-dark/20 focus:border-gold outline-none py-3 text-base"
      />
    </div>
  );
}
