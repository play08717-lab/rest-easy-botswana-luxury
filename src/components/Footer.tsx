import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 pt-12 pb-10 border-t border-gold/10">
      <div className="grid gap-10 md:grid-cols-3 mb-12">
        <div>
          <p className="font-display text-2xl text-gold-light leading-none">Rest Easy</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-paper/40 mt-3">
            Self-catering · Rakops
          </p>
          <p className="text-sm text-paper/50 mt-6 max-w-xs leading-relaxed">
            A quiet sanctuary in the heart of Botswana's Boteti region.
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Visit</p>
          <p className="text-sm text-paper/70 leading-relaxed">
            Plot 2903<br />Rakops, Botswana
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Contact</p>
          <p className="text-sm text-paper/70">+267 71 621 866</p>
          <a
            href="https://wa.me/26771621866"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-paper/70 hover:text-gold transition-colors"
          >
            WhatsApp booking
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-gold/5 opacity-60">
        <p className="text-[10px] uppercase tracking-[0.25em]">
          © {new Date().getFullYear()} Rest Easy Apartment (Self-Catering)
        </p>
        <div className="flex gap-8">
          <Link
            to="/contact"
            className="text-[10px] uppercase tracking-[0.25em] hover:text-gold"
          >
            Contact
          </Link>
          <Link
            to="/book"
            className="text-[10px] uppercase tracking-[0.25em] hover:text-gold"
          >
            Book
          </Link>
        </div>
      </div>
    </footer>
  );
}
