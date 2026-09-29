import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { receiptRefFromPath } from '../routes'

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/FKehPb60rdo9z9wW2shBr2'

type Receipt = {
  reference: string
  status: string
  purpose: string
  name: string
  amount: number
  category: string | null
  start: string | null
  phone: string
  paidAt: string | null
  createdAt: string
  receiptNumber: string | null
  method?: 'card' | 'mobile'
  collected: boolean
  collectedAt: string | null
}

// Blink sends local Kampala time without a zone ("2026-09-28 14:28:34"); show it as given.
export function formatWhen(value: string | null) {
  if (!value) return ''
  const plain = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (plain && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${Number(plain[3])} ${months[Number(plain[2]) - 1]} ${plain[1]}, ${plain[4]}:${plain[5]}`
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' })
}

const ugx = (amount: number) => `UGX ${Number(amount).toLocaleString('en-UG')}`

export default function ReceiptPage() {
  const [reference, setReference] = useState(() => receiptRefFromPath(window.location.pathname))
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  // Set when Blink's card page sends the customer back here (?card=returned or ?card=cancelled).
  const [cardReturn] = useState(() => new URLSearchParams(window.location.search).get('card'))

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    const quiet = refresh > 0
    if (!quiet) {
      setLoading(true)
      setError('')
      setReceipt(null)
    }
    supabase.functions
      .invoke('payment-receipt', { body: { reference } })
      .then(async ({ data, error: fnError }) => {
        if (cancelled) return
        let message = (data as { error?: string } | null)?.error
        if (fnError) {
          const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
          message = body?.error ?? 'Could not load the receipt. Please try again.'
        }
        if (message) {
          if (!quiet) setError(message)
        } else {
          setReceipt(data as Receipt)
        }
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [reference, refresh])

  // After a card payment, keep checking for Blink's confirmation for about two minutes.
  const waitingForCard = cardReturn === 'returned' && receipt?.status === 'PENDING' && refresh < 30
  useEffect(() => {
    if (!waitingForCard) return
    const timer = window.setTimeout(() => setRefresh((n) => n + 1), 4000)
    return () => window.clearTimeout(timer)
  }, [waitingForCard, refresh])

  const lookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('reference') ?? '').trim().toUpperCase()
    if (!value) return
    const ref = value.startsWith('HR26-') ? value : `HR26-${value.replace(/^HR26/, '')}`
    window.history.pushState(null, '', `/receipt/${ref}`)
    setRefresh(0)
    setReference(ref)
  }

  const paid = receipt?.status === 'SUCCESSFUL'
  const runner = receipt?.purpose === 'Runner registration'
  const student = Boolean(receipt?.category?.toLowerCase().includes('student'))
  const card = receipt?.method === 'card'

  return (
    <section className="border-b border-border bg-background py-12 sm:py-16 print:border-0 print:bg-white print:py-0">
      <div className="container-site max-w-3xl">
        <div className="print:hidden">
          <p className="eyebrow">Proof of payment</p>
          <h1 className="page-title mt-4">Your receipt</h1>
          <form onSubmit={lookup} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="receipt-ref">Payment reference</label>
            <input
              className="field bg-white sm:flex-1"
              id="receipt-ref"
              name="reference"
              placeholder="Payment reference, e.g. HR26-86802167"
              defaultValue={reference}
              autoCapitalize="characters"
            />
            <button className="btn-primary" type="submit">Find receipt</button>
          </form>
        </div>

        {cardReturn === 'cancelled' && receipt && !paid ? (
          <div className="mt-10 bg-foreground p-6 text-white print:hidden">
            <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Card payment cancelled</p>
            <p className="mt-3 text-lg leading-8">
              No money was taken. You can try again, or pay with mobile money instead.
            </p>
            <a href={runner ? '/register' : '/donate'} className="btn-gold mt-5 inline-flex">
              Try again
            </a>
          </div>
        ) : null}

        {loading ? <p className="mt-10 text-foreground/70">Loading receipt…</p> : null}
        {error ? <p className="mt-10 border border-border bg-white p-6 text-lg">{error}</p> : null}

        {receipt ? (
          <div className="mt-10 border-2 border-primary bg-white print:mt-0 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-primary p-6 text-primary-foreground">
              <div>
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Startups Harambe Run 2026</p>
                <p className="mt-2 font-display text-3xl uppercase leading-none">
                  {runner ? 'Runner registration' : 'Donation receipt'}
                </p>
              </div>
              <p
                className={`px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.2em] ${
                  paid ? 'bg-secondary text-secondary-foreground' : 'bg-white text-foreground'
                }`}
              >
                {paid ? 'Paid' : receipt.status === 'FAILED' ? 'Not paid' : 'Awaiting payment'}
              </p>
            </div>

            <dl className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 sm:p-8">
              <Item label="Reference" value={receipt.reference} strong />
              <Item label="Amount" value={ugx(receipt.amount)} strong />
              <Item label="Name" value={receipt.name} />
              {receipt.phone ? <Item label={card ? 'Phone number' : 'Mobile money number'} value={receipt.phone} /> : null}
              <Item label="Paid with" value={card ? 'Visa card' : 'Mobile money'} />
              {receipt.category ? <Item label="Category" value={receipt.category} /> : null}
              {receipt.start ? <Item label="Starting point" value={receipt.start} /> : null}
              {paid ? <Item label="Paid on" value={formatWhen(receipt.paidAt)} /> : null}
              {receipt.receiptNumber ? <Item label={card ? 'Card transaction ID' : 'Network receipt number'} value={receipt.receiptNumber} /> : null}
            </dl>

            {runner && paid ? (
              <div className="border-t border-border p-6 sm:p-8">
                {receipt.collected ? (
                  <p className="font-ui text-sm font-black uppercase tracking-[0.18em] text-foreground">
                    Kit collected on {formatWhen(receipt.collectedAt)}
                  </p>
                ) : (
                  <p className="text-lg leading-8">
                    <strong>Kit pickup:</strong> show this receipt or your confirmation SMS
                    {student ? ', together with your student ID,' : ''} at the kit pickup desk.
                  </p>
                )}
              </div>
            ) : null}

            {!paid && receipt.status !== 'FAILED' ? (
              <p className="border-t border-border p-6 text-lg leading-8 sm:p-8">
                {waitingForCard
                  ? 'Confirming your card payment with Blink. This page updates by itself, usually within a minute.'
                  : card
                    ? 'We have not received confirmation of this card payment yet. If you completed it, check this page again in a few minutes.'
                    : 'We have not received confirmation of this payment yet. If you approved it on your phone, check again in a few minutes.'}
              </p>
            ) : null}

            <p className="border-t border-border p-6 font-ui text-xs font-black uppercase tracking-[0.2em] text-foreground/70 sm:px-8">
              Harambe. Run. Fund. Job Creation. · info@haramberun.com
            </p>
          </div>
        ) : null}

        {receipt && paid ? (
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              Save or print receipt
            </button>
            {runner ? (
              <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="btn-gold">
                Join the WhatsApp group
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Item({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="font-ui text-[11px] font-black uppercase tracking-[0.2em] text-foreground/60">{label}</dt>
      <dd className={`mt-1 ${strong ? 'font-display text-2xl' : 'text-lg'} break-words`}>{value}</dd>
    </div>
  )
}
