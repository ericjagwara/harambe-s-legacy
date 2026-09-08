import { Flag, MapPin } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CtaBand, MetricGrid, PageHero, PageSection, SectionHeader, TextList } from '../components/PageLayout'
import { asset, neighborhoodStarts, safetyNotes, universityStarts } from '../data'

const routeFacts = [
  { value: '15', label: 'university dispatch points' },
  { value: '7', label: 'neighborhood stations' },
  { value: '22', label: 'official start locations' },
  { value: '1', label: 'shared finish line' },
]

export default function RoutePage() {
  return (
    <>
      <PageHero
        eyebrow="Route and start points"
        title="Every road points to Makerere."
        copy="Runners start from partner university campuses and neighborhood stations, follow official cleared routes and converge at Makerere University Freedom Square Pitch."
      />

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="Official route map"
          title="One citywide convergence."
          copy="Final route distances will be published with route clearance. Dispatch points and safety cover remain coordinated by the organising team."
        />
        <Reveal delay={120}>
          <figure className="mt-10 bg-white p-3 sm:p-4">
            <img src={asset('route-map.webp')} alt="Official Startups Harambe Run route map" className="w-full object-contain" />
            <figcaption className="image-caption">Convergence and culmination point, Makerere University Freedom Square Pitch</figcaption>
          </figure>
        </Reveal>
        <div className="mt-8">
          <MetricGrid items={routeFacts} />
        </div>
      </PageSection>

      <PageSection>
        <SectionHeader eyebrow="Dispatch network" title="Fifteen campuses and seven neighborhood stations." />
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="content-panel">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-display text-3xl uppercase leading-none">University starts</h3>
              </div>
              <div className="mt-6">
                <TextList items={universityStarts} />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="content-panel">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-display text-3xl uppercase leading-none">Neighborhood stations</h3>
              </div>
              <div className="mt-6">
                <TextList items={neighborhoodStarts} />
              </div>
            </div>
          </Reveal>
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
        title="Choose the start point closest to you."
        copy="Runner registration includes category selection, start point selection and kit collection details."
        primaryLabel="Register to run"
        primaryPage="register"
        secondaryLabel="Runner guide"
        secondaryPage="runners"
      />
    </>
  )
}
