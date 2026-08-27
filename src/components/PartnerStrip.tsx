import { PARTNERS } from "@/data/partners";

export function PartnerStrip() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-secondary/50">
      <div className="pattern-dots absolute inset-0 opacity-60" />
      <div className="relative w-full py-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Featured partners &amp; sponsors
        </p>
        <div className="mt-5 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track flex w-max shrink-0 items-center gap-4 pr-4">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <span
                key={`${p.name}-${i}`}
                className="flex h-20 w-44 shrink-0 items-center justify-center rounded-xl border border-border bg-card px-5 shadow-lift"
              >
                <img
                  src={p.logo}
                  alt={`${p.name} logo`}
                  loading="lazy"
                  className="max-h-12 w-auto max-w-full object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
