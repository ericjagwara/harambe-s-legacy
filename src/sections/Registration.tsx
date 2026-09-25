import { useEffect, useRef, useState, type FormEvent } from 'react'
import Reveal from '../components/Reveal'
import { supabase } from '@/integrations/supabase/client'
import { booths, neighborhoodStarts, sponsorTiers, universityStarts } from '../data'

export type RegistrationTab = 'run' | 'donate' | 'sponsor' | 'booth' | 'volunteer'

const tabs: Array<[RegistrationTab, string]> = [
  ['run', 'Run'],
  ['donate', 'Donate'],
  ['sponsor', 'Sponsor'],
  ['booth', 'Exhibit'],
  ['volunteer', 'Volunteer'],
]

const startPoints = [...universityStarts, ...neighborhoodStarts]

const runnerCategories = [
  { label: 'Student runner, UGX 30,000', amount: 30000 },
  { label: 'General public runner, UGX 50,000', amount: 50000 },
]

type PayState = 'idle' | 'starting' | 'waiting' | 'success' | 'pending' | 'error'

export default function Registration({ initialTab = 'run' }: { initialTab?: RegistrationTab }) {
  const [active, setActive] = useState<RegistrationTab>(initialTab)
  const [submitted, setSubmitted] = useState('')
  const [payState, setPayState] = useState<PayState>('idle')
  const [payMessage, setPayMessage] = useState('')
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    setActive(initialTab)
    setSubmitted('')
    resetPayment()
  }, [initialTab])

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current)
  }, [])

  const WHATSAPP_NUMBER = '256781405551'

  function resetPayment() {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = null
    setPayState('idle')
    setPayMessage('')
  }

  const submit = (event: FormEvent<HTMLFormElement>, label: string) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const details = Array.from(data.entries())
      .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    const message = encodeURIComponent(`Harambe Run 2026, ${label}\n\n${details}`)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener')
    setSubmitted(
      `Thank you for stepping up for Uganda's builders. Your ${label.toLowerCase()} is with our team and your place is held. We will reach out to you personally the moment we confirm your details. You are part of the movement already.`
    )
    form.reset()
  }

  const pay = async (
    event: FormEvent<HTMLFormElement>,
    purpose: 'Runner registration' | 'Donation',
    amountFrom: (data: FormData) => number
  ) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const amount = amountFrom(data)
    const fullName = String(data.get('name') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()

    if (!Number.isFinite(amount) || amount < 500) {
      setPayState('error')
      setPayMessage('Please enter a valid amount of at least UGX 500.')
      return
    }

    setSubmitted('')
    setPayState('starting')
    setPayMessage('Sending a payment request to your phone.')

    const extras: Record<string, string> = {}
    data.forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '' && !['name', 'phone', 'amount'].includes(key)) {
        extras[key] = value
      }
    })

    const { data: result, error } = await supabase.functions.invoke('blinkpay-deposit', {
      body: {
        fullName,
        email: data.get('email'),
        phone,
        amount,
        purpose,
        isAnonymous: String(data.get('display') ?? '').toLowerCase().includes('anonymous'),
        details: extras,
      },
    })

    const failure = error || (result && (result as { error?: string }).error)
    if (failure) {
      setPayState('error')
      setPayMessage(
        typeof failure === 'string'
          ? failure
          : 'We could not reach your mobile money wallet just now. Please check the number and try again.'
      )
      return
    }

    const referenceCode = (result as { referenceCode?: string }).referenceCode
    setPayState('waiting')
    setPayMessage(
      `Check your phone. Approve the mobile money request for UGX ${amount.toLocaleString('en-UG')} by entering your PIN.`
    )

    let attempts = 0
    pollRef.current = window.setInterval(async () => {
      attempts += 1
      const { data: statusResult } = await supabase.functions.invoke('blinkpay-status', { body: { referenceCode } })
      const status = String((statusResult as { status?: string })?.status ?? '').toUpperCase()

      if (status === 'SUCCESSFUL') {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        setPayState('success')
        setPayMessage('')
        setSubmitted(
          purpose === 'Donation'
            ? `Payment received. Thank you for funding Uganda's next job creators. Your gift of UGX ${amount.toLocaleString('en-UG')} is already counted on our live fundraising board.`
            : `Payment received. Your place at Harambe Run 2026 is confirmed. We will send your kit collection details and start point briefing by email.`
        )
        form.reset()
      } else if (status === 'FAILED') {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        setPayState('error')
        setPayMessage('The payment was not completed. You can try again, or use a different mobile money number.')
      } else if (attempts >= 24) {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        setPayState('pending')
        setPayMessage(
          'We have not seen the approval yet. If you approved it, the payment will still come through and our team will confirm with you.'
        )
      }
    }, 5000)
  }

  const busy = payState === 'starting' || payState === 'waiting'

  const payNotice = payMessage ? (
    <div
      className={`mb-7 p-6 ${
        payState === 'error' ? 'bg-foreground text-white' : 'bg-secondary text-secondary-foreground'
      }`}
    >
      <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em]">
        {payState === 'error' ? 'Try again' : payState === 'pending' ? 'Still processing' : 'Approve on your phone'}
      </p>
      <p className="mt-3 text-lg leading-8">{payMessage}</p>
      {payState === 'waiting' ? (
        <button
          type="button"
          onClick={resetPayment}
          className="mt-4 font-ui text-[11px] font-black uppercase tracking-[0.22em] underline underline-offset-4"
        >
          No prompt? Cancel and try again
        </button>
      ) : null}
    </div>
  ) : null

  return (
    <section id="register" className="relative border-b border-border bg-background py-14 lg:py-20">
      <div className="container-site">
        <div className="grid gap-4 lg:grid-cols-[0.3fr_0.7fr]">
          <Reveal>
            <div className="h-full bg-foreground p-4 text-white sm:p-5">
              <div className="grid gap-2">
                {tabs.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActive(key)
                      setSubmitted('')
                      resetPayment()
                    }}
                    className={`border px-4 py-4 text-left font-ui text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                      active === key
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-white/15 bg-white/5 text-white hover:border-secondary hover:text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-6 border-t border-white/15 p-4">
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Pay with mobile money</p>
                <p className="mt-3 text-sm leading-6 text-white/66">
                  Pay instantly with MTN Mobile Money or Airtel Money. Enter your number, approve the prompt on your phone and your place is confirmed on the spot.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="bg-white p-6 sm:p-9">
              {submitted ? (
                <div className="mb-7 border border-primary bg-primary p-6 text-primary-foreground">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">You are in</p>
                  <p className="mt-3 text-lg leading-8">{submitted}</p>
                </div>
              ) : null}

              {active === 'run' || active === 'donate' ? payNotice : null}

              {active === 'run' ? (
                <form
                  onSubmit={(event) =>
                    pay(event, 'Runner registration', (data) =>
                      runnerCategories.find((c) => c.label === String(data.get('category')))?.amount ?? 50000
                    )
                  }
                  className="grid gap-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="runner-name">Full name</label>
                      <input className="field" id="runner-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="runner-email">Email</label>
                      <input className="field" id="runner-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="category">Category</label>
                      <select className="field" id="category" name="category" required>
                        {runnerCategories.map((category) => (
                          <option key={category.label}>{category.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="start">Starting point</label>
                      <select className="field" id="start" name="start" required>
                        {startPoints.map((point) => (
                          <option key={point}>{point}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="runner-phone">Mobile money number</label>
                      <input className="field" id="runner-phone" name="phone" inputMode="tel" placeholder="0781405551" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="student-id">Student ID upload, required for student rate</label>
                      <input className="field bg-background" id="student-id" type="file" name="studentId" accept="image/*,.pdf" />
                    </div>
                  </div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={busy}>
                    {busy ? 'Waiting for approval' : 'Pay and confirm my place'}
                  </button>
                </form>
              ) : null}

              {active === 'donate' ? (
                <form
                  onSubmit={(event) => pay(event, 'Donation', (data) => Number(String(data.get('amount')).replace(/\D/g, '')))}
                  className="grid gap-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="donor-name">Name or organisation</label>
                      <input className="field" id="donor-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="donor-email">Email</label>
                      <input className="field" id="donor-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="amount">Amount, UGX</label>
                      <input className="field" id="amount" name="amount" inputMode="numeric" placeholder="500000" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="donor-phone">Mobile money number</label>
                      <input className="field" id="donor-phone" name="phone" inputMode="tel" placeholder="0781405551" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="display">Public display</label>
                    <select className="field" id="display" name="display" required>
                      <option>Show my name</option>
                      <option>Display as anonymous</option>
                    </select>
                  </div>
                  <button className="btn-gold w-full sm:w-auto" type="submit" disabled={busy}>
                    {busy ? 'Waiting for approval' : 'Give now'}
                  </button>
                </form>
              ) : null}

              {active === 'sponsor' ? (
                <form onSubmit={(event) => submit(event, 'Sponsorship interest')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="sponsor-org">Organisation</label>
                      <input className="field" id="sponsor-org" name="organisation" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="sponsor-email">Email</label>
                      <input className="field" id="sponsor-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="tier">Preferred package</label>
                    <select className="field" id="tier" name="tier" required>
                      {sponsorTiers.map((tier) => (
                        <option key={tier.name}>{tier.name}, {tier.price}</option>
                      ))}
                      <option>Sector or event-specific package</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="sponsor-message">Partnership note</label>
                    <textarea className="field min-h-32" id="sponsor-message" name="message" />
                  </div>
                  <button className="btn-primary w-full sm:w-auto" type="submit">Submit sponsor interest</button>
                </form>
              ) : null}

              {active === 'booth' ? (
                <form onSubmit={(event) => submit(event, 'Exhibition booth request')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="booth-org">Organisation</label>
                      <input className="field" id="booth-org" name="organisation" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="booth-email">Email</label>
                      <input className="field" id="booth-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="booth">Booth package</label>
                    <select className="field" id="booth" name="booth" required>
                      {booths.map((booth) => (
                        <option key={booth.name}>{booth.name}, {booth.size}, {booth.price}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-start gap-3 border border-border bg-background p-4 text-sm leading-6 text-foreground">
                    <input className="mt-1 h-4 w-4 accent-[#007a45]" type="checkbox" name="earlyStage" />
                    <span>Request early-stage startup Bronze verification. Company registration must be dated 1 to 3 years before the event with annual revenue up to UGX 35,000,000.</span>
                  </label>
                  <button className="btn-primary w-full sm:w-auto" type="submit">Book booth</button>
                </form>
              ) : null}

              {active === 'volunteer' ? (
                <form onSubmit={(event) => submit(event, 'Volunteer sign-up')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="vol-name">Full name</label>
                      <input className="field" id="vol-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="vol-email">Email</label>
                      <input className="field" id="vol-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="vol-role">Preferred support area</label>
                    <select className="field" id="vol-role" name="role" required>
                      <option>Route marshal support</option>
                      <option>Registration and kit collection</option>
                      <option>Media and content</option>
                      <option>Fundraising and donor care</option>
                      <option>Event-day operations</option>
                    </select>
                  </div>
                  <button className="btn-outline w-full sm:w-auto" type="submit">Join as volunteer</button>
                </form>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
