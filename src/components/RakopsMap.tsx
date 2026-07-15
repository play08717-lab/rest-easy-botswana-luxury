export function RakopsMap({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ring-1 ring-gold/20 bg-dark ${className}`}>
      <iframe
        title="Map of Rakops, Botswana"
        src="https://www.google.com/maps?q=Rakops%2C+Botswana&z=12&output=embed"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full border-0 grayscale contrast-125 brightness-90"
      />
    </div>
  );
}
