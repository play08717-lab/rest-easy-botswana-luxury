import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

const PHONE = "+26771621866";

export function FloatingWhatsApp() {
  const handleCall = () => {
    toast.success("Opening the dialer…", {
      description: "Calling Rest Easy Apartment on +267 71 621 866",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <a
        href={`tel:${PHONE}`}
        onClick={handleCall}
        aria-label="Call Rest Easy Apartment"
        title="Call +267 71 621 866"
        className="flex items-center gap-2 border border-gold/40 bg-dark/90 text-gold shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105 hover:bg-gold hover:text-dark rounded-full pl-3 pr-4 py-3"
      >
        <Phone className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] hidden sm:inline">
          Call now
        </span>
      </a>
      <a
        href="https://wa.me/26771621866"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Book on WhatsApp"
        className="flex items-center gap-3 bg-whatsapp text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] hidden sm:inline">
          Book on WhatsApp
        </span>
      </a>
    </div>
  );
}
