import type { ReactNode } from "react";
import { PageHero } from "./PageHero";

export function LegalPage({
  eyebrow,
  title,
  updated = "July 2026",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} />
      <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-paper/40">
        Last updated: {updated}
      </p>
      <article className="mt-10 max-w-3xl space-y-8 text-paper/75 leading-relaxed text-[15px]">
        {children}
      </article>
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-gold-light mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
