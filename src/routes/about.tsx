import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { EVENT } from "@/data/event";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TechBuzz Hub, SFV & the Run | Startups Harambe Run" },
      {
        name: "description",
        content:
          "Who is behind the Startups Harambe Run: TechBuzz Hub, the Startup Funding Vehicles initiative, and the purpose of the run.",
      },
      { property: "og:title", content: "About the Startups Harambe Run" },
      {
        property: "og:description",
        content: "TechBuzz Hub, SFV and the concept behind Uganda's multi-origin fundraising run.",
      },
    ],
  }),
  component: About,
});

const SECTIONS = [
  {
    id: "techbuzz",
    title: "About TechBuzz Hub",
    body: [
      "TechBuzz Hub is a Ugandan innovation and enterprise-support organisation working with student innovators, early-stage founders and the institutions around them. Its programmes span campus outreach, incubation, founder training and investor readiness.",
      "The Hub convenes the Startups Harambe Run each year as its flagship public fundraising and visibility moment.",
    ],
  },
  {
    id: "sfv",
    title: "About SFV - Startup Funding Vehicles",
    body: [
      "Startup Funding Vehicles (SFV) is TechBuzz Hub's initiative to build practical, locally governed funding instruments for African startups - from small campus innovation grants to structured co-investment vehicles.",
      "Funds raised through the run flow into SFV instruments, and the site reports the totals publicly so every contributor can see where the money lands.",
    ],
  },
  {
    id: "run",
    title: "About the Run",
    body: [
      `The Startups Harambe Run is a multi-origin run: participants start from one of 8 university campuses or 7 neighborhood stations and converge on a single finish line at ${EVENT.finish}, on ${EVENT.date}.`,
      "Harambe means pulling together. Student runners, public runners, virtual donors, volunteers, sponsors and exhibitors each pull one part of the same rope: capital and visibility for the next generation of Ugandan founders.",
    ],
  },
];

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="About us"
        title="Pulling together for Uganda's founders"
        description="The organisers, the funding initiative and the idea behind the run."
      />
      <div className="section space-y-14">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl uppercase text-primary md:text-3xl">{s.title}</h2>
            <div className="space-y-4 text-muted-foreground">
              {s.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SiteFooter />
    </div>
  );
}
