import { createFileRoute } from "@tanstack/react-router";
import { Ambulance, ShieldCheck, Siren, TrafficCone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CAMPUSES, EVENT, KIT_CONTENTS, STATIONS } from "@/data/event";

export const Route = createFileRoute("/run")({
  head: () => ({
    meta: [
      { title: "Route Map, Starting Points & Safety | Startups Harambe Run" },
      {
        name: "description",
        content:
          "All 8 university campuses and 7 neighborhood starting stations, per-station distances, kit collection and safety arrangements for the Startups Harambe Run.",
      },
      { property: "og:title", content: "Run / Route Map - Startups Harambe Run" },
      {
        property: "og:description",
        content: "Fifteen starting points converging at Makerere University Main Campus.",
      },
    ],
  }),
  component: RoutePage,
});

const SAFETY = [
  { icon: ShieldCheck, t: "Route marshals", d: "Marshals stationed at every start, junction and water point." },
  { icon: Ambulance, t: "Ambulance cover", d: "Standby ambulances along each corridor and at the finish line." },
  { icon: Siren, t: "Police clearance", d: "Route clearance and traffic escort coordinated with Uganda Police." },
  { icon: TrafficCone, t: "Road management", d: "Cones, signage and rolling closures on all converging roads." },
];

function StartList({ title, items }: { title: string; items: { name: string; distance: string }[] }) {
  return (
    <div>
      <h3 className="text-xl uppercase text-primary">{title}</h3>
      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="font-semibold">{s.name}</span>
            <span className="text-right text-muted-foreground">{s.distance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoutePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Run / Route map"
        title="Fifteen starts, one convergence"
        description={`Every corridor ends at ${EVENT.finish}. Choose the start closest to you - that is also where you collect your kit.`}
      />

      <div className="section space-y-14">
        <div className="overflow-hidden rounded-xl border border-border shadow-lift">
          <iframe
            title="Startups Harambe Run finish line map"
            src="https://www.google.com/maps?q=Makerere%20University%20Main%20Campus%20Kampala&output=embed"
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <StartList title="8 university campuses" items={CAMPUSES} />
          <StartList title="7 neighborhood stations" items={STATIONS} />
        </div>

        <section>
          <p className="eyebrow">Safety on the route</p>
          <h2 className="mt-3 text-3xl uppercase">You run, we cover the road</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY.map((s) => (
              <div key={s.t} className="rounded-lg border border-border bg-card p-5 shadow-lift">
                <s.icon className="size-6 text-ember" />
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow">Further details</p>
          <h2 className="mt-3 text-3xl uppercase">Collection centres & race day</h2>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="kit">
              <AccordionTrigger>Kit collection at your starting point</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Registered runners collect their kit at the campus or station they selected, from
                  the Thursday before race day and on race morning until 30 minutes before the gun.
                  Bring your confirmation and, for student tickets, your student ID.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {KIT_CONTENTS.map((k) => (
                    <li key={k} className="text-sm font-semibold">
                      · {k}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="finish">
              <AccordionTrigger>Finish line - {EVENT.finish}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All corridors converge at Makerere University Main Campus, where the exhibition
                village, pitch stage, medical tent and prize ceremony are hosted.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="times">
              <AccordionTrigger>Start times</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Long corridors (Mukono, Entebbe) start at 06:00. Campuses and stations within 12 km
                start at 07:00 so that the field converges together. Final times are confirmed two
                weeks before {EVENT.date}.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
