import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { hubBySlug, hubs as allHubs } from '../data/hubs'

// Private dashboard: visits, registrations, payments and partner hub results. Password protected (ANALYTICS_PASSWORD).

type Row = { label: string; count: number; amount?: number }
type Payment = { purpose: string; status: string; method: string; count: number; amount: number }
type HubRow = {
  hub: string
  visits: number
  kit_clicks: number
  tagged_sessions: number
  donation_attempts: number
  donations_paid: number
  donations_amount: number
  kit_attempts: number
  kits_paid: number
  kits_amount: number
  raised: number
}
type Report = {
  days: number
  generated_at: string
  traffic: { sessions: number; visitors: number; pageviews: number }
  daily: Array<{ date: string; visits: number; pageviews: number; attempts: number; paid: number; paid_amount: number }>
  funnel: { sessions: number; form_page_sessions: number; form_start_sessions: number; pay_attempt_sessions: number; payments_created: number; payments_paid: number }
  payments: Payment[]
  categories: Row[]
  distances: Row[]
  pages: Array<{ path: string; views: number; sessions: number }>
  sources: Row[]
  devices: Row[]
  countries: Row[]
  hubs: HubRow[]
  volunteers: Array<{ code: string; payments: number; paid: number; enquiries: number }>
  enquiries: Array<{ type: string; status: string; count: number }>
  documents: { volunteer_agreements: number; partner_mous: number }
  recent: Array<{ at: string; reference: string; purpose: string; status: string; amount: number; name: string; method: string; hub: string | null; category: string | null; referral: string | null }>
}

const PERIODS: Array<{ days: number; label: string }> = [
  { days: 1, label: 'Last 24 hours' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
]

const ugx = (n: number) => `UGX ${Math.round(Number(n) || 0).toLocaleString('en-UG')}`
const num = (n: number) => Math.round(Number(n) || 0).toLocaleString('en-UG')
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
const when = (iso: string) => new Date(iso).toLocaleString('en-UG', { timeZone: 'Africa/Kampala', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const hubName = (slug: string) => hubBySlug(slug)?.name ?? slug

function remember(value: string) {
  try {
    sessionStorage.setItem('dashboard-password', value)
  } catch {
    /* ignore */
  }
}
function recall() {
  try {
    return sessionStorage.getItem('dashboard-password') ?? ''
  } catch {
    return ''
  }
}

function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white p-5 sm:p-6 ${className}`}>
      <h2 className="font-ui text-[11px] font-black uppercase tracking-[0.2em] text-foreground/60">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-white p-5">
      <p className="font-ui text-[10px] font-black uppercase tracking-[0.18em] text-foreground/60">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none sm:text-4xl">{value}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-foreground/65">{note}</p> : null}
    </div>
  )
}

function BarList({ rows, format = num, empty = 'Nothing yet.' }: { rows: Array<{ label: string; value: number; sub?: string }>; format?: (n: number) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-sm text-foreground/60">{empty}</p>
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{row.label}</span>
            <span className="shrink-0 tabular-nums text-foreground/75">
              {format(row.value)}
              {row.sub ? <span className="ml-2 text-foreground/50">{row.sub}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 bg-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Bars({ data, field, format }: { data: Report['daily']; field: 'visits' | 'paid_amount'; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d[field]))
  const total = data.reduce((sum, d) => sum + d[field], 0)
  return (
    <div>
      <p className="mb-3 text-sm text-foreground/70">Total in view: <strong>{format(total)}</strong></p>
      <div className="flex h-36 items-end gap-[2px]" role="img" aria-label="Daily chart">
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1" style={{ height: '100%' }}>
            <div className="absolute inset-x-0 bottom-0 bg-primary/85 group-hover:bg-secondary" style={{ height: `${d[field] > 0 ? Math.max(3, (d[field] / max) * 100) : 0}%` }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap bg-foreground px-2 py-1 text-xs text-white group-hover:block">
              {d.date}: {format(d[field])}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-foreground/55">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-ui text-[10px] font-black uppercase tracking-[0.14em] text-foreground/60">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((cells, i) => (
              <tr key={i} className="border-b border-border/60 align-top">
                {cells.map((cell, j) => (
                  <td key={j} className="px-2 py-2 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-2 py-4 text-foreground/60" colSpan={head.length}>
                Nothing yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function DashboardPage() {
  const [password, setPassword] = useState(recall)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(recall()))
  const [days, setDays] = useState(30)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (pw: string, period: number) => {
      setBusy(true)
      const { data, error: fnError } = await supabase.functions.invoke('site-insights', { body: { action: 'report', password: pw, days: period } })
      setBusy(false)
      if (fnError) {
        const payload = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
        const message = payload?.error ?? 'Could not reach the dashboard service.'
        if (/password/i.test(message) && !/not set up/i.test(message)) {
          remember('')
          setLoggedIn(false)
        }
        setError(message)
        return false
      }
      setError('')
      setReport(data as Report)
      return true
    },
    []
  )

  useEffect(() => {
    if (!loggedIn) return
    load(password, days)
    const timer = window.setInterval(() => load(password, days), 60_000)
    return () => window.clearInterval(timer)
  }, [loggedIn, days, password, load])

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (await load(password, days)) {
      remember(password)
      setLoggedIn(true)
    }
  }

  const sums = useMemo(() => {
    const paid = (purpose: string) => (report?.payments ?? []).filter((p) => p.purpose === purpose && p.status === 'SUCCESSFUL')
    const all = (purpose: string) => (report?.payments ?? []).filter((p) => p.purpose === purpose)
    const add = (rows: Payment[], key: 'count' | 'amount') => rows.reduce((s, r) => s + Number(r[key]), 0)
    const kits = { paid: add(paid('Runner registration'), 'count'), amount: add(paid('Runner registration'), 'amount'), attempts: add(all('Runner registration'), 'count') }
    const gifts = { paid: add(paid('Donation'), 'count'), amount: add(paid('Donation'), 'amount'), attempts: add(all('Donation'), 'count') }
    return { kits, gifts, total: kits.amount + gifts.amount, attempts: kits.attempts + gifts.attempts, paid: kits.paid + gifts.paid }
  }, [report])

  // Every hub with a page is listed, even before its first visit.
  const hubRows = useMemo<HubRow[]>(() => {
    const zero = { visits: 0, kit_clicks: 0, tagged_sessions: 0, donation_attempts: 0, donations_paid: 0, donations_amount: 0, kit_attempts: 0, kits_paid: 0, kits_amount: 0, raised: 0 }
    const have = new Map((report?.hubs ?? []).map((h) => [h.hub, h]))
    const rows = allHubs.map((h) => have.get(h.slug) ?? { hub: h.slug, ...zero })
    for (const h of report?.hubs ?? []) if (!allHubs.some((x) => x.slug === h.hub)) rows.push(h)
    return rows.sort((a, b) => b.raised - a.raised || b.visits - a.visits)
  }, [report])

  if (!loggedIn) {
    return (
      <section className="border-b border-border bg-background py-12 sm:py-16">
        <div className="container-site max-w-xl">
          <p className="eyebrow">Private</p>
          <h1 className="page-title mt-4">Dashboard</h1>
          {error ? <p className="mt-8 bg-foreground p-5 text-lg text-white">{error}</p> : null}
          <form onSubmit={login} className="mt-8 grid gap-5 bg-white p-6 sm:p-8">
            <div>
              <label className="label" htmlFor="dash-password">Dashboard password</label>
              <input className="field" id="dash-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Open the dashboard'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-border bg-background py-8 sm:py-12">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Private</p>
            <h1 className="page-title mt-3">Dashboard</h1>
            <p className="mt-2 text-sm text-foreground/65">
              {report ? `Updated ${when(report.generated_at)} (Kampala time). Refreshes every minute.` : 'Loading…'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="dash-period">Period</label>
            <select id="dash-period" className="field !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {PERIODS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
            <button className="btn-primary" type="button" onClick={() => load(password, days)} disabled={busy}>
              {busy ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              className="font-ui text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4"
              type="button"
              onClick={() => {
                remember('')
                setPassword('')
                setReport(null)
                setLoggedIn(false)
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {error ? <p className="mt-6 bg-foreground p-4 text-white">{error}</p> : null}

        {report ? (
          <div className="mt-8 grid gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Visits" value={num(report.traffic.sessions)} note={`${num(report.traffic.visitors)} people, ${num(report.traffic.pageviews)} page views`} />
              <Stat label="Money received" value={ugx(sums.total)} note={`${ugx(sums.kits.amount)} kits, ${ugx(sums.gifts.amount)} donations`} />
              <Stat label="Kits paid" value={num(sums.kits.paid)} note={`${num(sums.kits.attempts)} started, ${pct(sums.kits.paid, sums.kits.attempts)} completed`} />
              <Stat label="Donations paid" value={num(sums.gifts.paid)} note={`${num(sums.gifts.attempts)} started, ${pct(sums.gifts.paid, sums.gifts.attempts)} completed`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Visits per day">
                <Bars data={report.daily} field="visits" format={num} />
              </Card>
              <Card title="Money received per day">
                <Bars data={report.daily} field="paid_amount" format={ugx} />
              </Card>
            </div>

            <Card title="Partner hubs">
              <Table
                head={['Hub', 'Page visits', 'Kits chosen', 'Donations paid', 'Donations (UGX)', 'Kits started', 'Kits paid', 'Kits (UGX)', 'Total (UGX)']}
                rows={hubRows.map((h) => [
                  <a key="n" className="font-bold text-primary underline underline-offset-4" href={`/hubs/${h.hub}`} target="_blank" rel="noopener noreferrer">
                    {hubName(h.hub)}
                  </a>,
                  num(h.visits),
                  num(h.kit_clicks),
                  `${num(h.donations_paid)} of ${num(h.donation_attempts)}`,
                  num(h.donations_amount),
                  num(h.kit_attempts),
                  num(h.kits_paid),
                  num(h.kits_amount),
                  <strong key="t">{num(h.raised)}</strong>,
                ])}
              />
              <p className="mt-3 text-xs leading-5 text-foreground/60">
                A supporter is counted for the hub whose page they opened last, for 7 days. Kits and donations are counted once paid; a kit and donation paid together are split into each.
              </p>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Visitor journey">
                <BarList
                  format={num}
                  rows={[
                    { label: 'Visits', value: report.funnel.sessions },
                    { label: 'Opened a register, donate or hub page', value: report.funnel.form_page_sessions, sub: pct(report.funnel.form_page_sessions, report.funnel.sessions) },
                    { label: 'Started filling a form', value: report.funnel.form_start_sessions, sub: pct(report.funnel.form_start_sessions, report.funnel.sessions) },
                    { label: 'Pressed pay', value: report.funnel.pay_attempt_sessions, sub: pct(report.funnel.pay_attempt_sessions, report.funnel.sessions) },
                    { label: 'Payments started', value: report.funnel.payments_created },
                    { label: 'Payments completed', value: report.funnel.payments_paid, sub: pct(report.funnel.payments_paid, report.funnel.payments_created) },
                  ]}
                />
                <p className="mt-3 text-xs leading-5 text-foreground/60">
                  Visit counts start from the day the site tracking went live. Payments come from the payment records, so they are complete for all time.
                </p>
              </Card>
              <Card title="Payments by status">
                <Table
                  head={['What', 'Status', 'How', 'Count', 'UGX']}
                  rows={report.payments
                    .slice()
                    .sort((a, b) => a.purpose.localeCompare(b.purpose) || a.status.localeCompare(b.status))
                    .map((p) => [p.purpose === 'Donation' ? 'Donation' : 'Kit', p.status.charAt(0) + p.status.slice(1).toLowerCase(), p.method === 'card' ? 'Card' : 'Mobile money', num(p.count), num(p.amount)])}
                />
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card title="Where visitors came from">
                <BarList rows={report.sources.map((r) => ({ label: r.label, value: r.count }))} empty="No visits recorded yet." />
              </Card>
              <Card title="Devices">
                <BarList rows={report.devices.map((r) => ({ label: r.label, value: r.count }))} empty="No visits recorded yet." />
              </Card>
              <Card title="Countries">
                <BarList rows={report.countries.map((r) => ({ label: r.label, value: r.count }))} empty="No visits recorded yet." />
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Most visited pages">
                <BarList rows={report.pages.map((r) => ({ label: r.path, value: r.views, sub: `${num(r.sessions)} visits` }))} empty="No visits recorded yet." />
              </Card>
              <div className="grid gap-4">
                <Card title="Kits sold by category (paid)">
                  <BarList rows={report.categories.map((r) => ({ label: r.label, value: r.count, sub: ugx(r.amount ?? 0) }))} />
                </Card>
                <Card title="Kits by distance (paid)">
                  <BarList rows={report.distances.map((r) => ({ label: r.label, value: r.count }))} />
                </Card>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Volunteer referrals">
                <Table
                  head={['Code', 'Payments', 'Paid (UGX)', 'Enquiries']}
                  rows={report.volunteers.map((v) => [v.code, num(v.payments), num(v.paid), num(v.enquiries)])}
                />
              </Card>
              <Card title="Enquiries and signed documents">
                <Table
                  head={['Type', 'Status', 'Count']}
                  rows={[
                    ...report.enquiries.map((e) => [e.type, e.status, num(e.count)]),
                    ['Volunteer agreements signed', '', num(report.documents.volunteer_agreements)],
                    ['Partner MOUs signed', '', num(report.documents.partner_mous)],
                  ]}
                />
              </Card>
            </div>

            <Card title="Latest payments">
              <Table
                head={['When', 'Name', 'What', 'Status', 'UGX', 'Hub', 'Volunteer']}
                rows={report.recent.map((p) => [
                  when(p.at),
                  p.name,
                  p.purpose === 'Donation' ? 'Donation' : `Kit${p.category ? `: ${p.category.split(',')[0]}` : ''}`,
                  p.status.charAt(0) + p.status.slice(1).toLowerCase(),
                  num(p.amount),
                  p.hub ? hubName(p.hub) : '',
                  p.referral ?? '',
                ])}
              />
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  )
}
