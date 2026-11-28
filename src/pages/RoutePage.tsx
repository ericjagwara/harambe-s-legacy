import { ExternalLink, Flag } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CtaBand, PageSection } from '../components/PageLayout'
import { asset, safetyNotes } from '../data'

const routeMap = asset('makerere-club-route.jpg')

export default function RoutePage() {
  return (
    <>
      <PageSection className="bg-white">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className="eyebrow">Sunday 29 November 2026</p>
            <h1 className="page-title mt-4">Makerere Club route</h1>
            <p className="section-copy mt-6">The Harambe Run follows one course at Makerere University, Kampala.</p>
            <ul className="mt-7 space-y-3 text-sm font-semibold text-foreground">
              <li className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-green-600" aria-hidden="true" />
                Start at the green marker
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1 w-3 rounded-full bg-blue-600" aria-hidden="true" />
                Follow the arrows along the blue line
              </li>
              <li className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-600" aria-hidden="true" />
                Finish at the red marker
              </li>
            </ul>
          </Reveal>

          <Reveal>
            <figure className="mx-auto w-full max-w-xl">
              <a href={routeMap} target="_blank" rel="noreferrer" className="block border border-border bg-white">
                <img
                  src={routeMap}
                  alt="Makerere Club route map with a green start marker, blue course arrows, and a red finish marker"
                  width={766}
                  height={994}
                  className="h-auto w-full"
                />
                <span className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-bold text-primary">
                  Open full-size map
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </span>
              </a>
            </figure>
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
        title="Register to run."
        copy="Choose your runner category and pay by mobile money or Visa card."
        primaryLabel="Register to run"
        primaryPage="register"
        secondaryLabel="Runner guide"
        secondaryPage="runners"
      />
    </>
  )
}
