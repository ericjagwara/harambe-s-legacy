import { useState, type FormEvent } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { formatWhen } from './ReceiptPage'

type Row = {
  reference: string
  status: string
  purpose: string
  name: string
  phone: string
  category: string | null
  start: string | null
  amount: number
  expectedAmount: number | null
  paidAt: string | null
  collectedAt: string | null
  collectedBy: string | null
}

const ugx = (amount: number) => `UGX ${Number(amount).toLocaleString('en-UG')}`

function remember(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* storage unavailable, keep in memory only */
  }
}
function recall(key: string) {
  try {
    return sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

async function callDesk(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('pickup-desk', { body })
  if (error) {
    const payload = await (error as { context?: Response }).context?.json?.().catch(() => null)
    return { error: payload?.error ?? 'Could not reach the pickup desk service.', ...(payload ?? {}) }
  }
  return data as Record<string, any>
}

export default function PickupPage() {
  const [password, setPassword] = useState(() => recall('pickup-password'))
  const [loggedIn, setLoggedIn] = useState(() => Boolean(recall('pickup-password')))
  const [staff, setStaff] = useState(() => recall('pickup-staff'))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Row[] | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    const result = await callDesk({ password, action: 'login' })
    setBusy(false)
    if (result.ok) {
      remember('pickup-password', password)
      remember('pickup-staff', staff)
      setLoggedIn(true)
      setMessage(null)
    } else {
      setMessage({ tone: 'bad', text: result.error })
    }
  }

  const search = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    const result = await callDesk({ password, action: 'lookup', query })
    setBusy(false)
    if (result.error) {
      if (String(result.error).includes('password')) setLoggedIn(false)
      setMessage({ tone: 'bad', text: result.error })
      setResults(null)
    } else {
      setMessage(null)
      setResults(result.results)
    }
  }

  const act = async (row: Row, action: 'collect' | 'undo') => {
    if (action === 'collect' && !staff.trim()) {
      setMessage({ tone: 'bad', text: 'Enter your name at the top before handing out kits.' })
      return
    }
    if (action === 'undo' && !window.confirm(`Undo kit collection for ${row.name}?`)) return
    setBusy(true)
    const result = await callDesk({ password, action, reference: row.reference, staff })
    setBusy(false)
    if (result.result) {
      setResults((current) => current?.map((r) => (r.reference === row.reference ? result.result : r)) ?? null)
    }
    setMessage(
      result.ok
        ? { tone: 'ok', text: action === 'collect' ? `Kit given to ${row.name}.` : `Collection undone for ${row.name}.` }
        : { tone: 'bad', text: result.error }
    )
  }

  const signOut = () => {
    remember('pickup-password', '')
    setPassword('')
    setLoggedIn(false)
    setResults(null)
  }

  return (
    <section className="border-b border-border bg-background py-12 sm:py-16">
      <div className="container-site max-w-4xl">
        <p className="eyebrow">Staff only</p>
        <h1 className="page-title mt-4">Kit pickup desk</h1>

        {message ? (
          <p className={`mt-8 p-5 text-lg ${message.tone === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-white'}`}>
            {message.text}
          </p>
        ) : null}

        {!loggedIn ? (
          <form onSubmit={login} className="mt-8 grid gap-5 bg-white p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <label className="label" htmlFor="desk-staff">Your name</label>
              <input className="field" id="desk-staff" value={staff} onChange={(e) => setStaff(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="desk-password">Desk password</label>
              <input className="field" id="desk-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary sm:col-span-2" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Open the desk'}
            </button>
          </form>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-end gap-4 bg-white p-6 sm:p-8">
              <div className="min-w-[12rem] flex-1">
                <label className="label" htmlFor="desk-staff-in">Handing out kits as</label>
                <input
                  className="field"
                  id="desk-staff-in"
                  value={staff}
                  onChange={(e) => {
                    setStaff(e.target.value)
                    remember('pickup-staff', e.target.value)
                  }}
                />
              </div>
              <button type="button" className="btn-outline" onClick={signOut}>Sign out</button>
            </div>

            <form onSubmit={search} className="mt-4 flex flex-col gap-3 bg-white p-6 sm:flex-row sm:p-8">
              <label className="sr-only" htmlFor="desk-query">Search</label>
              <input
                className="field sm:flex-1"
                id="desk-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Reference (HR26-…), phone number or name"
                autoFocus
              />
              <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
            </form>

            {results && results.length === 0 ? (
              <p className="mt-6 bg-white p-6 text-lg">No payment found. Ask for the reference in their SMS, or try their phone number.</p>
            ) : null}

            <div className="mt-6 grid gap-4">
              {results?.map((row) => {
                const paid = row.status === 'SUCCESSFUL'
                const runner = row.purpose === 'Runner registration'
                const underpaid = row.expectedAmount !== null && row.amount < row.expectedAmount
                const student = Boolean(row.category?.toLowerCase().includes('student'))
                const canGive = paid && runner && !row.collectedAt && !underpaid
                return (
                  <article key={row.reference} className={`border-2 bg-white p-6 ${canGive ? 'border-primary' : 'border-border'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl">{row.name}</p>
                        <p className="mt-1 text-foreground/70">
                          {row.reference} · {row.phone}
                        </p>
                      </div>
                      <Badge row={row} underpaid={underpaid} />
                    </div>
                    <p className="mt-4 text-lg">
                      {runner ? (row.category ?? 'Runner').replace(/, UGX.*$/, '') : 'Donation, no kit'} · paid {ugx(row.amount)}
                      {row.start ? ` · ${row.start}` : ''}
                    </p>
                    {paid && runner && student && !row.collectedAt ? (
                      <p className="mt-3 font-ui text-xs font-black uppercase tracking-[0.18em] text-foreground">Check student ID before handing over</p>
                    ) : null}
                    {underpaid ? (
                      <p className="mt-3 font-ui text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Paid {ugx(row.amount)} but this category costs {ugx(row.expectedAmount!)}. Do not hand over; refer to the organisers.
                      </p>
                    ) : null}
                    {row.collectedAt ? (
                      <p className="mt-3 text-foreground/80">
                        Collected {formatWhen(row.collectedAt)}
                        {row.collectedBy ? ` by ${row.collectedBy}` : ''}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {canGive ? (
                        <button type="button" className="btn-primary" disabled={busy} onClick={() => act(row, 'collect')}>
                          Mark kit as collected
                        </button>
                      ) : null}
                      {row.collectedAt ? (
                        <button type="button" className="btn-outline" disabled={busy} onClick={() => act(row, 'undo')}>
                          Undo collection
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function Badge({ row, underpaid }: { row: Row; underpaid: boolean }) {
  let text = 'Paid, ready'
  let style = 'bg-primary text-primary-foreground'
  if (row.status !== 'SUCCESSFUL') {
    text = 'Not paid'
    style = 'bg-foreground text-white'
  } else if (row.purpose !== 'Runner registration') {
    text = 'Donation'
    style = 'bg-muted text-foreground'
  } else if (row.collectedAt) {
    text = 'Already collected'
    style = 'bg-foreground text-white'
  } else if (underpaid) {
    text = 'Underpaid'
    style = 'bg-foreground text-white'
  }
  return <span className={`px-3 py-2 font-ui text-xs font-black uppercase tracking-[0.18em] ${style}`}>{text}</span>
}
