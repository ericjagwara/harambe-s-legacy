import Reveal from '../components/Reveal'
import { CtaBand, PageHero, PageSection, SectionHeader, TextList } from '../components/PageLayout'
import { asset, kitImages, kitItems, ticketTypes } from '../data'
import { pageHref } from '../routes'

const runnerSteps = [
  'Choose a student, public or virtual donor category.',
  'Select an official campus or neighborhood start point.',
  'Collect the physical kit at the chosen dispatch point.',
  'Run the cleared route and converge at Makerere University.',
]

export default function RunnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Runner guide"
        title="Pick a start point. Collect the kit. Fund a founder."
        copy="Each paid runner receives an official kit for collection at the chosen starting point. Student runners use a valid student ID to access the reduced rate."
        image={asset('runner-mockup.webp')}
        imageAlt="Runner wearing the official Harambe Run vest"
        imageCaption="Official 2026 runner identity"
        portrait
      />

      <PageSection>
        <SectionHeader
          eyebrow="Entry categories"
          title="Three clear ways to take part."
          copy="Pricing is simple and public. Registration support, donations and kit details remain available through the run secretariat."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {ticketTypes.map((ticket, index) => (
            <Reveal key={ticket.name} delay={index * 80}>
              <article className="flex h-full flex-col bg-white p-6 sm:p-8">
                <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Entry 0{index + 1}</p>
                <h3 className="mt-5 font-display text-3xl uppercase leading-none text-foreground">{ticket.name}</h3>
                <p className="mt-5 font-display text-4xl uppercase leading-none text-primary">{ticket.price}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{ticket.detail}</p>
                <a href={pageHref('register')} className="btn-primary mt-7 w-full">Select category</a>
              </article>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <PageSection className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
          <Reveal>
            <div>
              <p className="eyebrow">Runner kit</p>
              <h2 className="section-title mt-4">Race-day ready.</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                The official kit carries the 2026 identity across the course and remains consistent from registration through finish-line activities.
              </p>
              <div className="mt-8">
                <TextList items={kitItems} />
              </div>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {kitImages.map((image, index) => (
              <Reveal key={image.name} delay={index * 70}>
                <figure className="bg-white">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={image.src} alt={`${image.name} for the Harambe Run kit`} className="h-full w-full object-cover" />
                  </div>
                  <figcaption className="flex items-center justify-between px-4 py-4 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                    {image.name}
                    <span className="text-accent">2026</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection>
        <SectionHeader eyebrow="Race-day flow" title="From dispatch point to Freedom Square." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {runnerSteps.map((step, index) => (
            <Reveal key={step} delay={index * 80}>
              <div className="h-full bg-white p-6">
                <p className="font-display text-4xl leading-none text-accent">0{index + 1}</p>
                <p className="mt-5 text-sm font-bold uppercase leading-6 tracking-[0.06em] text-foreground/78">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <CtaBand
        title="Reserve your place for 29 November."
        copy="Choose a category, select a start point and complete the runner registration flow."
        primaryLabel="Register as a runner"
        primaryPage="register"
        secondaryLabel="View the route"
        secondaryPage="route"
      />
    </>
  )
}
