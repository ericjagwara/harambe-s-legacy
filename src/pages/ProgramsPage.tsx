import Reveal from '../components/Reveal'
import { CtaBand, MetricGrid, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { asset, fundFlow, missionStats, programCards, surveyStats } from '../data'

export default function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow="Startup programs"
        title="The run feeds a year-round venture pipeline."
        copy="Race-day energy connects to student startup education, hackathons, proof of concept support, catalytic funding and local angel investor development."
        image={asset('program-group.webp')}
        imageAlt="Startup Funding Vehicles program participants"
        imageCaption="Ecosystem partners and program participants"
      />

      <section className="border-b border-border bg-white py-10">
        <div className="container-site">
          <MetricGrid items={missionStats} />
        </div>
      </section>

      <PageSection>
        <SectionHeader
          eyebrow="Where the money works"
          title="Three audiences. One funding pipeline."
          copy="The campaign moves public goodwill into structured programs for students, founders and local investors."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.58fr_0.42fr] lg:items-start">
          <Reveal>
            <figure>
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img src={asset('mission-workshop.webp')} alt="Angel investment and startup finance workshop" className="h-full w-full object-cover" />
              </div>
              <figcaption className="image-caption">Investment readiness and blended finance training</figcaption>
            </figure>
          </Reveal>
          <div className="grid gap-4">
            {fundFlow.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <article className="bg-white p-6 sm:p-7">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-accent">0{index + 1}</p>
                  <h3 className="mt-3 font-display text-3xl uppercase leading-none">{item.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="Program tracks"
          title="From campus ideas to investor-ready ventures."
          copy="The run supports practical startup education, venture funding preparation and angel investor network growth."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {programCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 90}>
              <article className="h-full bg-white">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img src={card.image} alt={card.alt} className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{card.metric}</p>
                  <h3 className="mt-3 font-display text-3xl uppercase leading-none">{card.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <PageSection dark>
        <SectionHeader
          eyebrow="The investment gap"
          title="Ugandans save. Few invest at scale."
          copy="Survey findings from the campaign material show why public education and visible investor pathways matter."
          dark
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {surveyStats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 70}>
              <div className="bg-white/[0.07] p-6">
                <p className="font-display text-5xl uppercase leading-none text-secondary">{stat.value}{stat.suffix}</p>
                <p className="mt-4 text-sm leading-6 text-white/68">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <CtaBand
        title="Put your organisation inside the pipeline."
        copy="Partner visibility supports the run while strengthening startup training, venture funding and investor development."
        primaryLabel="Explore partnership"
        primaryPage="partners"
        secondaryLabel="Donate"
        secondaryPage="donate"
      />
    </>
  )
}
