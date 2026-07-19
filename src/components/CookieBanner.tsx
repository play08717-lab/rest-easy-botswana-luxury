import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "rea-cookie-consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const save = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-40 bg-dark/95 backdrop-blur-md border border-gold/30 p-5 shadow-2xl">
      <p className="text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Cookies</p>
      <p className="text-sm text-paper/75 leading-relaxed">
        We use cookies to improve your experience. See our{" "}
        <Link to="/cookies" className="underline hover:text-gold">Cookie Policy</Link>.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => save("accepted")}
          className="bg-gold text-dark px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gold-light"
        >
          Accept
        </button>
        <button
          onClick={() => save("declined")}
          className="border border-gold/30 text-paper/70 px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:text-gold"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
