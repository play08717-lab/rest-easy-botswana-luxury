import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <header className="pt-4 md:pt-8 pb-14 md:pb-20 border-b border-gold/10 animate-reveal">
      <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-semibold">
        {eyebrow}
      </span>
      <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.02] text-balance">
        {title}
      </h1>
      {intro ? (
        <p className="mt-6 text-paper/60 max-w-2xl text-base leading-relaxed">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
