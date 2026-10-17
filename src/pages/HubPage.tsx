import { useEffect, useState } from 'react'
import Registration from '../sections/Registration'
import { supabase } from '@/integrations/supabase/client'
import { hubBySlug } from '../data/hubs'
import { captureHub } from '@/lib/hub'
import { trackEvent } from '@/lib/analytics'
import { pageHref } from '../routes'

const ugx = (amount: number) => `UGX ${Math.round(amount).toLocaleString('en-UG')}`

// The bar shows how far the total has come on a simple ladder of round figures. There is no goal; the number is what matters.
const STEPS = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000]
const fillFor = (raised: number) => {
  if (raised <= 0) return 0
  const step = STEPS.find((s) => raised < s) ?? raised
  return Math.max(3, Math.min(100, Math.round((raised / step) * 100)))
}

const INTRO =
  'Every Shilling, Every Dollar, Every Pound, etc. turns student innovators into entrepreneurs and empowers local investors to invest in them. Imagine billions sitting in savings, bonds and land while young founders cannot raise a shilling. The #StartupsHarambeRun / #CapitalHarambeRun 2026 puts that money to work.'

type Stats = { raised: number; donations: number; kits: number }

export default function HubPage({ slug }: { slug: string }) {
  const hub = hubBySlug(slug)
  const [stats, setStats] = useState<Stats | null>(null)

  // Remember this hub for 7 days, so kits and donations paid later are counted for it too.
  useEffect(() => {
    if (hub) captureHub(hub.slug)
  }, [hub])

  useEffect(() => {
    if (!hub) return
    let cancelled = false
    supabase.functions.invoke('site-insights', { body: { action: 'hub-stats', hub: hub.slug } }).then(({ data, error }) => {
      if (!cancelled && !error && data && typeof (data as Stats).raised === 'number') setStats(data as Stats)
    })
    return () => {
      cancelled = true
    }
  }, [hub])

  if (!hub) {
    return (
      <section className="container-site py-24">
        <h1 className="font-display text-4xl uppercase">Page not found</h1>
        <p className="mt-4 text-lg text-foreground/75">We could not find that partner page. You can still give or register on the main site.</p>
        <a className="btn-gold mt-8 inline-flex" href={pageHref('donate')}>
          Donate
        </a>
      </section>
    )
  }

  return (
    <>
      <div className="bg-white pt-10 sm:pt-14">
        {hub.banner ? (
          <img
            src={hub.banner}
            alt={`${hub.name} and TechBuzz Hub, event co-hosts of the Startups Harambe Fund`}
            className="mx-auto block w-full max-w-[1708px]"
            width={1708}
            height={650}
          />
        ) : (
          <div className="container-site py-12 sm:py-16">
            <p className="eyebrow">Event co-hosts: TechBuzz Hub and {hub.name}</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none text-primary sm:text-6xl">Startups Harambe Fund</h2>
            <p className="mt-3 font-display text-2xl uppercase leading-none text-foreground sm:text-3xl">with {hub.name}</p>
            <p className="mt-6 max-w-4xl text-base leading-7 text-foreground/80 sm:text-lg sm:leading-8">{INTRO}</p>
          </div>
        )}
      </div>

      <section className="border-b border-border bg-background pt-8 sm:pt-12">
        <div className="container-site">
          <div className="bg-white p-6 sm:p-8">
            <div>
              <p className="label">Raised through this page</p>
              <p className="mt-2 font-display text-4xl leading-none sm:text-5xl">{stats ? ugx(stats.raised) : '—'}</p>
              <div
                className="mt-4 h-3 w-full overflow-hidden bg-muted"
                role="progressbar"
                aria-label="Total raised through this page"
                aria-valuenow={stats?.raised ?? 0}
                aria-valuemin={0}
              >
                <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${fillFor(stats?.raised ?? 0)}%` }} />
              </div>
              {stats ? (
                <p className="mt-3 text-sm text-foreground/70">
                  {stats.donations} {stats.donations === 1 ? 'donation' : 'donations'}
                  {stats.kits > 0 ? ` and ${stats.kits} running ${stats.kits === 1 ? 'kit' : 'kits'}` : ''} so far
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Registration
        fixed={{
          tab: 'donate',
          compact: true,
          eyebrow: `Give through ${hub.name}`,
          title: 'Give now',
          intro: 'Any amount, by mobile money or Visa card.',
        }}
      />

      <section className="bg-background pb-12 sm:pb-16">
        <div className="container-site">
          <div className="flex flex-col gap-4 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-xl text-base leading-7 text-foreground/80">Want to run too? Buy your running kit and join us on Sunday 29 November 2026.</p>
            <a href="/register?for=run" onClick={() => trackEvent('kit_click')} className="btn-gold inline-flex w-full justify-center sm:w-auto">
              Run with us: buy a kit
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
