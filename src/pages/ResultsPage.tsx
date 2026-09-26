import { ArrowRight } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CtaBand, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { useContributions } from '../hooks/useContributions'
import { FUNDRAISING_TARGET, formatUGX, timeAgo } from '../data/contributors'
import { pageHref } from '../routes'

export default function ResultsPage() {
  const { rows, latestId, raised, count } = useContributions()
  const progress = (raised / FUNDRAISING_TARGET) * 100
  const remaining = Math.max(0, FUNDRAISING_TARGET - raised)

  const stats: Array<[string, string]> = [
    [formatUGX(raised), 'raised so far'],
    [`${progress.toFixed(1)}%`, 'of the target reached'],
    [formatUGX(remaining), 'still to raise'],
    [count.toLocaleString('en-UG'), 'recorded contributions'],
  ]

  return (
    <>
      <PageHero
        eyebrow="Statistics and donations"
        title="One public scoreboard for every contribution."
        copy="Tickets, pledges, booth payments and donations are reconciled into a single running total. Named or anonymous display follows each contributor's choice."
      />

      <PageSection dark>
        <SectionHeader
          eyebrow="Fundraising progress"
          title="Transparent reporting from tickets to pledges."
          copy="The total updates as new contributions are confirmed by the finance team."
          dark
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label], index) => (
            <Reveal key={label} delay={index * 70}>
              <div>
                <p className="tabular font-display text-3xl uppercase leading-none text-secondary sm:text-4xl">{value}</p>
                <p className="stat-label text-white/58">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-10 h-4 w-full bg-white/10">
            <div
              className="h-4 bg-secondary transition-[width] duration-1000 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-4 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-white/58">
            <span>{formatUGX(raised)} raised</span>
            <span>Target {formatUGX(FUNDRAISING_TARGET)}</span>
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
                Every confirmed ticket, pledge, booth payment and donation appears here in the order it is received.
              </p>
              <a href={pageHref('contributors')} className="btn-outline mt-7">
                View the full contributor list
                <ArrowRight className="ml-3 h-4 w-4" />
              </a>
            </div>
          </Reveal>
          <div>
            <div className="flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Live feed
            </div>
            <div className="mt-4 divide-y divide-border/50">
              {rows.slice(0, 8).map((row) => (
                <div
                  key={row.id}
                  className={`grid gap-2 py-5 transition-colors duration-700 sm:grid-cols-[1fr_auto] sm:items-center ${
                    row.id === latestId ? 'bg-secondary/15' : ''
                  }`}
                >
                  <div>
                    <p className="font-display text-2xl uppercase leading-none sm:text-3xl">{row.name}</p>
                    <p className="mt-2 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {row.type} <span className="text-accent">- {timeAgo(row.at)}</span>
                    </p>
                  </div>
                  <p className="tabular font-display text-2xl uppercase leading-none text-primary sm:text-3xl">
                    {formatUGX(row.amount)}
                  </p>
                </div>
              ))}
            </div>
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
