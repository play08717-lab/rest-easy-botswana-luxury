import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-3xl"}>
      {eyebrow ? (
        <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-semibold">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-4xl md:text-5xl mt-5 leading-[1.05] text-balance">
        {title}
      </h2>
      {intro ? (
        <p className="mt-6 text-paper/60 text-sm md:text-base leading-relaxed max-w-xl">
          {intro}
        </p>
      ) : null}
    </div>
  );
}
