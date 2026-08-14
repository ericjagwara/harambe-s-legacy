import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero.asset.json";
import { PartnerStrip } from "@/components/PartnerStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CAMPUSES, EVENT, STATIONS, ugx } from "@/data/event";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Startups Harambe Run 2026 | Run for Uganda's Startups" },
      {
        name: "description",
        content:
          "Register, donate or sponsor the Startups Harambe Run - 8 campuses and 7 neighborhood stations converging at Makerere University on 6 December 2026.",
      },
      { property: "og:title", content: "Startups Harambe Run 2026" },
      {
        property: "og:description",
        content:
          "One finish line, fifteen starting points. Run, donate or sponsor Uganda's startup pipeline.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const pct = Math.round((EVENT.raised / EVENT.target) * 100);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative isolate overflow-hidden">
        <img
          src={hero.url}
          alt="Runners in green and gold vests on a Kampala road at sunrise"
          className="absolute inset-0 size-full object-cover"
          width={1920}
          height={1088}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-36">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
            {EVENT.date} · {EVENT.finish}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl uppercase leading-[0.95] text-primary-foreground md:text-6xl">
            Fifteen starting points. <span className="text-gold">One finish line.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
            {EVENT.hashtag} - a multi-origin fundraising run backing Uganda's student founders,
            entrepreneurs and the investors who bet on them.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-ember text-ember-foreground hover:bg-ember/90">
              <Link to="/register">
                Register to run <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-gold bg-transparent text-gold hover:bg-gold hover:text-gold-foreground"
            >
              <Link to="/register">Donate instead</Link>
            </Button>
          </div>
        </div>
      </section>

      <PartnerStrip />

      <section className="section grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">The campaign</p>
          <h2 className="mt-3 text-3xl uppercase md:text-4xl">
            Every kilometre funds a founder
          </h2>
          <p className="mt-4 text-muted-foreground">
            Runners set off from 8 university campuses and 7 neighborhood stations across greater
            Kampala and converge on {EVENT.finish}. Ticket sales, corporate pledges, individual
            donations and exhibition bookings all feed one transparent pot - reported live on this
            site.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Users, label: "Students, founders, investors", value: "One pipeline" },
              { icon: MapPin, label: "Campuses & stations", value: `${CAMPUSES.length + STATIONS.length} starts` },
              { icon: HeartHandshake, label: "Ways to give", value: "4 channels" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-4 shadow-lift">
                <s.icon className="size-5 text-ember" />
                <p className="mt-3 font-display text-xl font-extrabold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lift">
          <p className="eyebrow">Live fundraising counter</p>
          <p className="mt-3 font-display text-4xl font-extrabold text-primary">
            {ugx(EVENT.raised)}
          </p>
          <p className="text-sm text-muted-foreground">raised of {ugx(EVENT.target)} target</p>
          <Progress value={pct} className="mt-5" />
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-display text-2xl font-extrabold">{EVENT.kitsSold}</p>
              <p className="text-muted-foreground">kits sold</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold">{pct}%</p>
              <p className="text-muted-foreground">of target</p>
            </div>
          </div>
          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link to="/statistics">See the contribution list</Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="section">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Our philosophy</p>
          <h2 className="mt-3 max-w-3xl text-3xl uppercase md:text-4xl">
            Students become founders. Founders become employers. Investors make it repeatable.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Students",
                d: "Campus innovators get their first exposure to capital, mentorship and market.",
              },
              {
                t: "Entrepreneurs",
                d: "Early-stage ventures get funding vehicles built for African realities.",
              },
              {
                t: "Investors",
                d: "Local and diaspora capital gets a visible, accountable pipeline of deals.",
              },
            ].map((p) => (
              <div key={p.t} className="border-t-2 border-gold pt-4">
                <h3 className="text-xl uppercase text-gold">{p.t}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow">Run map</p>
          <h2 className="mt-3 text-3xl uppercase md:text-4xl">Pick your starting point</h2>
          <p className="mt-4 text-muted-foreground">
            {CAMPUSES.length} university campuses and {STATIONS.length} neighborhood stations, each
            with its own distance, marshals, ambulance cover and kit collection desk.
          </p>
          <Button asChild className="mt-6">
            <Link to="/run">
              View the full route <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/60 p-4 text-sm">
          {[...CAMPUSES.slice(0, 4), ...STATIONS.slice(0, 4)].map((s) => (
            <div key={s.name} className="rounded-md bg-card px-3 py-2 font-semibold">
              {s.name}
            </div>
          ))}
          <div className="col-span-2 rounded-md bg-primary px-3 py-2 text-center font-bold uppercase text-gold">
            Finish · {EVENT.finish}
          </div>
        </div>
      </section>

      <section className="bg-gold text-gold-foreground">
        <div className="section text-center">
          <h2 className="text-3xl uppercase md:text-4xl">Get the race updates first</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm">
            Route confirmations, kit collection dates and sponsor announcements straight to your
            inbox.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("You're on the list - we'll be in touch.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <Input
              type="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              className="bg-background"
            />
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
