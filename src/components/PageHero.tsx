export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl uppercase md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base text-primary-foreground/80">{description}</p>
      </div>
    </section>
  );
}
