import { ArrowRight } from 'lucide-react'
import Reveal from '../components/Reveal'
import Countdown from '../components/Countdown'
import { CtaBand, MetricGrid, PageSection, SectionHeader } from '../components/PageLayout'
import { asset, heroStats, partnerLogos, programCards } from '../data'
import { pageHref } from '../routes'

export default function Home() {
  return (
    <>
      <section
        className="relative overflow-hidden bg-primary text-white"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 2vw), 0 100%)' }}
      >
        <div className="absolute inset-0">
          <img
            src={asset('hero-runners.webp')}
            alt="Three runners wearing official Harambe Run vests"
            className="kenburns h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(0, 76, 51, 0.95) 0%, rgba(0, 76, 51, 0.74) 44%, rgba(0, 76, 51, 0.3) 100%)',
            }}
          />
        </div>

        <div className="container-site relative flex min-h-[84vh] flex-col justify-end py-16 sm:py-20">
          <Reveal>
            <div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">
                Startups Harambe Run 2026
              </p>
              <h1 className="hero-title mt-5 max-w-4xl">Run the city. Fund Uganda's next startups.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
                A multi-origin fundraising run connecting students, entrepreneurs, universities and investors into one public startup funding pipeline.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={pageHref('register')} className="btn-gold">
                  Register to run
                  <ArrowRight className="ml-3 h-4 w-4" />
                </a>
                <a href={pageHref('route')} className="btn-outline-dark">
                  Explore the route
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-14 grid gap-4 border-t border-white/20 pt-5 sm:grid-cols-3 sm:gap-8">
              {[
                ['Race day', 'Sunday 6 December 2026'],
                ['Finish line', 'Makerere University, Freedom Square'],
                ['Start points', '22 official dispatch locations'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">{label}</p>
                  <p className="mt-1.5 font-ui text-sm font-bold uppercase tracking-[0.08em] text-white">{value}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Countdown />

      <Ticker items={homeTicker} variant="gold" />

      <section className="border-b border-border bg-white py-10">
        <div className="container-site">
          <MetricGrid items={heroStats} />
        </div>
      </section>

      <PageSection>
        <SectionHeader
          eyebrow="Why it exists"
          title="Public participation meets a working investment pipeline."
          copy="The run turns visible public support into student training, catalytic startup funding and a stronger local angel investor network."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.58fr_0.42fr] lg:items-start">
          <Reveal>
            <figure>
              <div className="aspect-[16/9] overflow-hidden border border-border bg-muted">
                <img src={asset('mission-workshop.webp')} alt="Startup Funding Vehicles workshop participants" className="h-full w-full object-cover" />
              </div>
              <figcaption className="image-caption">SFV ecosystem training and investment readiness programs</figcaption>
            </figure>
          </Reveal>
          <div className="divide-y divide-border border-y border-border">
            {[
              ['Students', 'Training programs, hackathons and proof of concept grants across participating universities.'],
              ['Entrepreneurs', 'Matching grants, incubation support and investor readiness for early-stage ventures.'],
              ['Investors', 'Angel network grants, investment training and structured syndication opportunities.'],
            ].map(([title, text], index) => (
              <Reveal key={title} delay={index * 80}>
                <div className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
                  <p className="font-display text-3xl leading-none text-accent">0{index + 1}</p>
                  <div>
                    <h3 className="font-display text-3xl uppercase leading-none text-foreground">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="The startup engine"
          title="Hackathons, bootcamps and investor rooms."
          copy="The event is the public entry point. The underlying program supports founders and investors before and after race day."
        />
        <div className="mt-10 grid gap-px border border-border bg-border lg:grid-cols-3">
          {programCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 90}>
              <article className="h-full bg-white">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img src={card.image} alt={card.alt} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />
                </div>
                <div className="p-6">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{card.metric}</p>
                  <h3 className="mt-3 font-display text-3xl uppercase leading-none text-foreground">{card.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionHeader
          eyebrow="Partners"
          title="Ecosystem builders behind the run."
          copy="Partner visibility spans the route, runner kits, startup programs, exhibition village and public fundraising record."
        />
        <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-6">
          {partnerLogos.map((logo) => (
            <div key={logo.name} className="logo-tile">
              <img src={logo.src} alt={`${logo.name} logo`} className="max-h-12 w-auto object-contain" />
            </div>
          ))}
        </div>
      </PageSection>

      <CtaBand
        title="Choose your place on the course."
        copy="Register as a runner, pledge a donation, book a booth or partner with the 2026 run."
        primaryLabel="Register now"
        primaryPage="register"
        secondaryLabel="Donate"
        secondaryPage="donate"
      />
    </>
  )
}
