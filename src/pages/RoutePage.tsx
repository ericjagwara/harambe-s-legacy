import { Flag } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CtaBand, MetricGrid, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { safetyNotes } from '../data'

const routeFacts = [
  { value: '4', label: 'race distances' },
  { value: '10', label: 'start points' },
  { value: '1', label: 'finish line at Makerere' },
  { value: '29 Nov', label: 'run day, 2026' },
]

// Start point locations are announced closer to run day; only the count is shown for now.
const distances = [
  { km: '21 km', name: 'Half marathon', note: 'For experienced runners.' },
  { km: '10 km', name: '10K run', note: 'A strong challenge for regular runners.' },
  { km: '5 km', name: '5K run', note: 'Popular with students and first-time racers.' },
  { km: '3 km', name: 'Fun run', note: 'Walk, jog or run. Open to everyone.' },
]

export default function RoutePage() {
  return (
    <>
      <PageHero
        eyebrow="Distances and route"
        title="Every road points to Makerere."
        copy="Choose 21 km, 10 km, 5 km or 3 km. Runners set off from 10 start points across Kampala, at university campuses, institutions and community locations, and finish together at Makerere University Freedom Square. Start points and final routes are shared with registered runners before run day."
      />

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="Race distances"
          title="Four distances. One finish line."
          copy="Pick the distance that suits you when you register. Every distance finishes at Makerere University Freedom Square."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {distances.map((distance, index) => (
            <Reveal key={distance.km} delay={index * 70}>
              <article className="h-full bg-background p-5 sm:p-7">
                <p className="font-display text-4xl uppercase leading-none text-primary sm:text-5xl">{distance.km}</p>
                <h3 className="mt-4 font-display text-xl uppercase leading-none sm:text-2xl">{distance.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{distance.note}</p>
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
                Route operations are planned around official clearance, medical cover and a managed convergence protocol at the finish line.
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
