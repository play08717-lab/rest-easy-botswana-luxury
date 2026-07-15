import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/26771621866"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-whatsapp text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] hidden sm:inline">
        Book on WhatsApp
      </span>
    </a>
  );
}
