import { Flag } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CtaBand, MetricGrid, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { asset, safetyNotes } from '../data'

const routeFacts = [
  { value: '4', label: 'race distances' },
  { value: '1', label: 'start and finish line' },
  { value: '4', label: 'route maps' },
  { value: '29 Nov', label: 'run day, 2026' },
]

// Every distance starts and finishes at Makerere University Freedom Square.
const distances = [
  { km: '21 km', name: 'Half Marathon', note: 'Out through Kawempe, Ntinda and Kyambogo, back along Jinja Road and Nakasero.', map: 'route-21k.webp' },
  { km: '10 km', name: 'Road Race', note: 'Makerere Kavule, Kubbiri and Kamwokya, then back via Uganda Museum and Wandegeya.', map: 'route-10k.webp' },
  { km: '5 km', name: 'Fun Run', note: 'A loop around Makerere Hill via Wandegeya, Kikoni and the Western Gate.', map: 'route-5k.webp' },
  { km: '3 km', name: 'Inclusive Run', note: 'For persons with disabilities. Two flat, paved 1.5 km laps inside the campus, anticlockwise.', map: 'route-3k.webp' },
]

export default function RoutePage() {
  return (
    <>
      <PageHero
        eyebrow="Distances and route"
        title="One start. One finish. Four routes."
        copy="Choose 21 km, 10 km, 5 km or the 3 km inclusive run. Every distance starts and finishes at Freedom Square, Makerere University. Full route maps are below."
      />

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="Race distances"
          title="Four distances. One start and finish line."
          copy="Pick the distance that suits you when you register. Every distance starts and finishes at Freedom Square, Makerere University."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {distances.map((distance, index) => (
            <Reveal key={distance.km} delay={index * 70}>
              <article className="h-full bg-background p-5 sm:p-6">
                <div className="flex items-baseline gap-3">
                  <p className="font-display text-4xl uppercase leading-none text-primary sm:text-5xl">{distance.km}</p>
                  <h3 className="font-display text-xl uppercase leading-none sm:text-2xl">{distance.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{distance.note}</p>
                <a href={asset(distance.map)} target="_blank" rel="noreferrer" className="mt-4 block" aria-label={`Open the ${distance.km} ${distance.name} route map`}>
                  <img
                    src={asset(distance.map)}
                    alt={`Route map for the ${distance.km} ${distance.name}, starting and finishing at Freedom Square, Makerere University`}
                    loading="lazy"
                    className="w-full border border-border bg-white"
                  />
                </a>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">Tap the map to open it full size</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-8">
          <MetricGrid items={routeFacts} />
        </div>
      </PageSection>

      <PageSection dark>
        <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <Reveal>
            <div>
              <p className="eyebrow">Route safety</p>
              <h2 className="section-title-dark mt-4">Cleared, marshalled and supported.</h2>
              <p className="mt-5 text-base leading-7 text-white/68">
                Route operations are planned around official clearance, medical cover and marshals at every key junction and water point.
              </p>
            </div>
          </Reveal>
          <div className="divide-y divide-white/12 border-y border-white/12">
            {safetyNotes.map((note, index) => (
              <Reveal key={note} delay={index * 70}>
                <div className="flex gap-4 py-5">
                  <Flag className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <p className="text-sm font-bold uppercase leading-6 tracking-[0.06em] text-white/78">{note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>

      <CtaBand
        title="Pick your distance and register."
        copy="Registration takes a few minutes: your details, your category and distance, and payment by mobile money or Visa card."
        primaryLabel="Register to run"
        primaryPage="register"
        secondaryLabel="Runner guide"
        secondaryPage="runners"
      />
    </>
  )
}
