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
    <section className="border-y border-border bg-secondary/50">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Featured partners &amp; sponsors
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {PARTNERS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
