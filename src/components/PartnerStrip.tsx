const PARTNERS = [
  "TechBuzz Hub",
  "Startup Funding Vehicles",
  "Makerere University",
  "Innovation Village",
  "Kampala Angel Network",
  "Your brand here",
];

export function PartnerStrip() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-secondary/50">
      <div className="pattern-dots absolute inset-0 opacity-60" />
      <div className="relative w-full py-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Featured partners &amp; sponsors
        </p>
        <div className="mt-5 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track flex w-max shrink-0 items-center gap-3 pr-3">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80 shadow-lift"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
