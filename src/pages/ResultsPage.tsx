import Reveal from '../components/Reveal'
import { CtaBand, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { donorRows } from '../data'

const scoreboardStats = [
  ['UGX 486,250,000', 'sample preview raised'],
  ['13%', 'preview progress'],
  ['UGX 3.75B', 'campaign target'],
  ['1,248', 'sample kit count'],
]

export default function ResultsPage() {
  return (
    <>
      <PageHero
        eyebrow="Statistics and donations"
        title="One public scoreboard for every contribution."
        copy="The production tracker will reconcile tickets, pledges, booth payments and donations. Named or anonymous display follows each contributor's choice."
      />

      <PageSection dark>
        <SectionHeader
          eyebrow="Fundraising progress"
          title="Transparent reporting from tickets to pledges."
          copy="The figures below are a presentation preview and will be replaced by the confirmed production tracker."
          dark
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scoreboardStats.map(([value, label], index) => (
            <Reveal key={label} delay={index * 70}>
              <div className="bg-white/[0.07] p-6">
                <p className="font-display text-4xl uppercase leading-none text-secondary">{value}</p>
                <p className="stat-label text-white/58">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-10 border border-white/15 bg-white/5 p-2">
            <div className="h-4 bg-secondary" style={{ width: '13%' }} />
          </div>
          <div className="mt-3 flex justify-between gap-4 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-white/58">
            <span>13% preview</span>
            <span>Target UGX 3.75B</span>
          </div>
        </Reveal>
      </PageSection>

      <PageSection className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-start">
          <Reveal>
            <div>
              <p className="eyebrow">Contributor list</p>
              <h2 className="section-title mt-4">Named or anonymous by choice.</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Public reporting keeps ticket revenue, pledges, booth payments and donations separate while contributing to one transparent total.
              </p>
            </div>
          </Reveal>
          <div className="divide-y divide-border/60">
            {donorRows.map((row) => (
              <div key={`${row.name}-${row.amount}`} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-display text-3xl uppercase leading-none">{row.name}</p>
                  <p className="mt-2 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{row.type}</p>
                </div>
                <p className="font-display text-3xl uppercase leading-none text-primary">{row.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <CtaBand
        title="Add your name to the public record."
        copy="Pledge a donation and choose whether your contribution appears by name or anonymously."
        primaryLabel="Donate now"
        primaryPage="donate"
        secondaryLabel="Contact the team"
        secondaryPage="contact"
      />
    </>
  )
}
