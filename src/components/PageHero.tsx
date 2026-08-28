import heroImg from "@/assets/gen-finish-festival.jpg";

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
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <img
        src={heroImg}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-25"
      />
      <div className="pattern-stripes absolute inset-0 opacity-40" />
      <div className="hero-overlay absolute inset-0" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl uppercase md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base text-primary-foreground/85">{description}</p>
      </div>
      <div className="chevron-rule absolute inset-x-0 bottom-0" />
    </section>
  );
}
