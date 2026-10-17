import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/integrations/supabase/client'
import { getReferral } from '@/lib/referral'
import { trackEvent } from '@/lib/analytics'
import { universityStarts } from '../data'
import { distances, kitSizes, runnerCategories } from '../sections/Registration'

// Partner hub giving form: your gift, an optional running kit, then one payment for both.
// Used only on /hubs/<name> pages. The main registration and donation forms are separate and unchanged.

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString('en-UG')}`
const CHIPS = [10_000, 20_000, 50_000, 100_000]
const STEPS = ['Your gift', 'Running kit', 'Review and pay']

type Method = 'mobile' | 'card'
type PayState = 'idle' | 'starting' | 'waiting' | 'error' | 'pending'

type Values = {
  name: string
  email: string
  amount: string
  display: string
  category: string
  gender: string
  dob: string
  distance: string
  kitSize: string
  institution: string
  startupName: string
  nokName: string
  nokRelationship: string
  nokPhone: string
  medical: string
  consent: boolean
  phone: string
}

const empty: Values = {
  name: '', email: '', amount: '', display: 'Show my name', category: '', gender: '', dob: '', distance: '', kitSize: '',
  institution: '', startupName: '', nokName: '', nokRelationship: '', nokPhone: '', medical: '', consent: false, phone: '',
}

async function functionError(error: unknown, fallback: string) {
  const context = (error as { context?: Response } | null)?.context
  const body = await context?.json?.().catch(() => null)
  return typeof body?.error === 'string' ? body.error : fallback
}

function postToBlink(url: string, fields: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}

function Field({ label, id, children, wide = false }: { label: string; id: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function HubGiveForm({ hubSlug, hubName }: { hubSlug: string; hubName: string }) {
  const [step, setStep] = useState(1)
  const [v, setV] = useState<Values>(empty)
  const [method, setMethod] = useState<Method>('mobile')
  const [payState, setPayState] = useState<PayState>('idle')
  const [payMessage, setPayMessage] = useState('')
  const [pendingRef, setPendingRef] = useState('')
  const [pendingKey, setPendingKey] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [stepError, setStepError] = useState('')
  const pollRef = useRef<number | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)
  const started = useRef(false)

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((current) => ({ ...current, [key]: value }))

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current)
  }, [])

  const busy = payState === 'starting' || payState === 'waiting'
  useEffect(() => {
    if (payState !== 'waiting') return
    setElapsed(0)
    const timer = window.setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => window.clearInterval(timer)
  }, [payState])

  const kit = runnerCategories.find((c) => c.label === v.category) ?? null
  const donation = Number(v.amount.replace(/\D/g, '')) || 0
  const total = donation + (kit?.amount ?? 0)
  const student = Boolean(kit && kit.label.toLowerCase().includes('student'))
  const business = Boolean(kit && (kit.label.toLowerCase().includes('startup') || kit.label.toLowerCase().includes('sme')))

  const go = (next: number) => {
    setStep(next)
    setStepError('')
    window.setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const markStarted = () => {
    if (started.current) return
    started.current = true
    trackEvent('form_start', { form: 'donate' })
  }

  const next = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 1) {
      if (donation > 0 && donation < 500) return setStepError('The smallest gift is UGX 500. You can also leave the amount empty and just add a kit in the next step.')
      go(2)
    } else if (step === 2) {
      if (!kit && donation < 500) return setStepError('Please add a gift of at least UGX 500 on the first step, or choose a kit below.')
      go(3)
    }
  }

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (total < 500) return setStepError('Please add a gift or choose a kit first.')

    const purpose = kit ? 'Runner registration' : 'Donation'
    const details: Record<string, string> = { hub: hubSlug, display: v.display }
    if (kit) {
      Object.assign(details, {
        category: kit.label,
        gender: v.gender,
        date_of_birth: v.dob,
        distance: v.distance,
        kit_size: v.kitSize,
        next_of_kin_name: v.nokName,
        next_of_kin_relationship: v.nokRelationship,
        next_of_kin_phone: v.nokPhone,
        consent: 'Agreed',
      })
      if (business) details.startup_name = v.startupName
      else if (v.institution) details.institution = v.institution
      if (v.medical) details.medical_notes = v.medical
    }
    const body = {
      fullName: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      amount: kit ? kit.amount : donation,
      extraDonation: kit ? donation : 0,
      purpose,
      isAnonymous: v.display.toLowerCase().includes('anonymous'),
      details,
      referral_code: getReferral(),
    }

    trackEvent('pay_attempt', { purpose, method })
    setPayState('starting')
    setPayMessage('')
    setStepError('')

    if (method === 'card') {
      const { data, error } = await supabase.functions.invoke('blinkpay-card-start', { body })
      const startedPayment = data as { url?: string; fields?: Record<string, string> } | null
      if (error || !startedPayment?.url || !startedPayment.fields) {
        setPayState('error')
        setPayMessage(await functionError(error, 'We could not open the card payment page. Please try again, or pay with mobile money.'))
        return
      }
      postToBlink(startedPayment.url, startedPayment.fields)
      return
    }

    const { data: result, error } = await supabase.functions.invoke('blinkpay-deposit', { body })
    if (error) {
      setPayState('error')
      setPayMessage(await functionError(error, 'We could not reach your mobile money wallet just now. Please check the number and try again.'))
      return
    }
    const referenceCode = (result as { referenceCode?: string }).referenceCode
    const reference = (result as { reference?: string }).reference ?? ''
    const receiptKey = (result as { receiptKey?: string }).receiptKey ?? ''
    setPendingRef(reference)
    setPendingKey(receiptKey)
    setPayState('waiting')

    let attempts = 0
    pollRef.current = window.setInterval(async () => {
      attempts += 1
      const { data: statusResult } = await supabase.functions.invoke('blinkpay-status', { body: { referenceCode } })
      const status = String((statusResult as { status?: string })?.status ?? '').toUpperCase()
      if (status === 'SUCCESSFUL') {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        window.location.assign(`/receipt/${reference}?paid=1${receiptKey ? `&k=${receiptKey}` : ''}`)
      } else if (status === 'FAILED') {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        setPayState('error')
        setPayMessage('The payment was not completed. It may have been declined, cancelled or timed out. You can try again, or use a different number.')
      } else if (attempts >= 36) {
        window.clearInterval(pollRef.current!)
        pollRef.current = null
        setPayState('pending')
        setPayMessage('We have not received the approval yet. If you entered your PIN, the payment will still come through and you will get an SMS and email.')
      }
    }, 5000)
  }

  const minutes = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  const overlay = busy
    ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/85 p-4" role="dialog" aria-modal="true" aria-live="polite">
          <div className="w-full max-w-md bg-white p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/15 border-t-primary" aria-hidden="true" />
            {payState === 'starting' ? (
              <>
                <p className="mt-6 font-display text-3xl uppercase leading-none">{method === 'card' ? 'Opening card payment' : 'Sending the request'}</p>
                <p className="mt-4 text-base leading-7 text-foreground/75">
                  {method === 'card'
                    ? "Taking you to Blink's secure payment page. You will enter your card details there."
                    : 'Sending a payment request to your phone. This takes a few seconds.'}
                </p>
              </>
            ) : (
              <>
                <p className="mt-6 font-display text-3xl uppercase leading-none">Check your phone</p>
                <p className="mt-4 text-base leading-7 text-foreground/75">
                  Approve the payment of <strong>{ugx(total)}</strong> on your phone by entering your mobile money PIN. This page moves on by itself once it is paid.
                </p>
                <p className="mt-4 font-ui text-xs font-bold uppercase tracking-[0.18em] text-foreground/60">Waiting {minutes}</p>
              </>
            )}
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <section id="give" className="relative border-b border-border bg-background pb-8 pt-4 sm:py-12 lg:py-16" onFocusCapture={markStarted}>
      {overlay}
      <div className="container-site">
        <div ref={topRef} className="-mx-5 scroll-mt-28 bg-white px-5 py-7 sm:mx-0 sm:p-10">
          <p className="eyebrow">Give through {hubName}</p>
          <h2 className="mt-3 font-display text-[2.1rem] uppercase leading-none sm:mt-4 sm:text-5xl">Donate to the Startups Harambe Fund</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/75 sm:text-lg sm:leading-8">
            Thank you for standing with young founders. Every gift, big or small, helps a student innovator become an entrepreneur.
          </p>

          <ol className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5" aria-label="Steps">
            {STEPS.map((title, index) => (
              <li
                key={title}
                aria-current={step === index + 1 ? 'step' : undefined}
                className={`font-ui text-[11px] font-black uppercase tracking-[0.18em] ${step === index + 1 ? 'text-primary' : step > index + 1 ? 'text-foreground/70' : 'text-foreground/40'}`}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">{index + 1}</span>
                {title}
              </li>
            ))}
          </ol>

          {stepError ? (
            <p className="mt-6 bg-foreground p-4 text-base leading-7 text-white" role="alert">
              {stepError}
            </p>
          ) : null}

          {step === 1 ? (
            <form onSubmit={next} className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="Name or organisation" id="hub-name">
                <input className="field" id="hub-name" autoComplete="name" required value={v.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Email (your receipt is sent here)" id="hub-email">
                <input className="field" id="hub-email" type="email" autoComplete="email" required value={v.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Your gift in UGX (minimum 500)" id="hub-amount" wide>
                <input
                  className="field"
                  id="hub-amount"
                  inputMode="numeric"
                  placeholder="e.g. 50000"
                  value={v.amount}
                  onChange={(e) => set('amount', e.target.value.replace(/[^\d]/g, ''))}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set('amount', String(chip))}
                      className={`border px-3 py-2 font-ui text-xs font-bold uppercase tracking-[0.12em] ${donation === chip ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-foreground hover:border-primary'}`}
                    >
                      {ugx(chip)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="On the public donor board" id="hub-display">
                <select className="field" id="hub-display" value={v.display} onChange={(e) => set('display', e.target.value)}>
                  <option>Show my name</option>
                  <option>Display as anonymous</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <button className="btn-gold w-full sm:w-auto" type="submit">
                  Continue
                </button>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
            <form onSubmit={next} className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-base leading-7 text-foreground/75">
                  Want to run too? Add a running kit to your gift. It is optional, and you pay once for both.
                </p>
              </div>
              <Field label="Running kit (optional)" id="hub-kit" wide>
                <select
                  className="field"
                  id="hub-kit"
                  value={v.category}
                  onChange={(e) => {
                    if (e.target.value) trackEvent('kit_click')
                    set('category', e.target.value)
                  }}
                >
                  <option value="">No thanks, just my gift</option>
                  {runnerCategories.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              {kit ? (
                <>
                  <Field label="Gender" id="hub-gender">
                    <select className="field" id="hub-gender" required value={v.gender} onChange={(e) => set('gender', e.target.value)}>
                      <option value="" disabled>Choose</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Date of birth" id="hub-dob">
                    <input className="field max-w-full appearance-none" id="hub-dob" type="date" min="1930-01-01" max="2014-12-31" required value={v.dob} onChange={(e) => set('dob', e.target.value)} />
                  </Field>
                  <Field label="Distance" id="hub-distance">
                    <select className="field" id="hub-distance" required value={v.distance} onChange={(e) => set('distance', e.target.value)}>
                      <option value="" disabled>Choose a distance</option>
                      {distances.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Running kit size" id="hub-size">
                    <select className="field" id="hub-size" required value={v.kitSize} onChange={(e) => set('kitSize', e.target.value)}>
                      <option value="" disabled>Choose a size</option>
                      {kitSizes.map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </Field>
                  {business ? (
                    <Field label="Startup or business name" id="hub-startup" wide>
                      <input className="field" id="hub-startup" autoComplete="organization" required value={v.startupName} onChange={(e) => set('startupName', e.target.value)} />
                    </Field>
                  ) : (
                    <Field label={student ? 'University or institution' : 'Organisation or institution (optional)'} id="hub-institution" wide>
                      <input className="field" id="hub-institution" list="hub-institution-list" required={student} value={v.institution} onChange={(e) => set('institution', e.target.value)} />
                      <datalist id="hub-institution-list">
                        {universityStarts.map((u) => (
                          <option key={u} value={u.split(',')[0]} />
                        ))}
                      </datalist>
                    </Field>
                  )}
                  {student ? <p className="text-sm leading-6 text-foreground/70 sm:col-span-2">Student rate: bring your valid student ID to kit pickup. No upload is needed now.</p> : null}
                  {business ? (
                    <p className="text-sm leading-6 text-foreground/70 sm:col-span-2">To be listed with your business logo, email it to info@haramberun.com after you pay.</p>
                  ) : null}

                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.2em] text-foreground/60 sm:col-span-2">Next of kin (emergency contact)</p>
                  <Field label="Full name" id="hub-nok-name">
                    <input className="field" id="hub-nok-name" required value={v.nokName} onChange={(e) => set('nokName', e.target.value)} />
                  </Field>
                  <Field label="Relationship" id="hub-nok-rel">
                    <input className="field" id="hub-nok-rel" placeholder="Parent, sibling, spouse, friend" required value={v.nokRelationship} onChange={(e) => set('nokRelationship', e.target.value)} />
                  </Field>
                  <Field label="Phone number" id="hub-nok-phone">
                    <input className="field" id="hub-nok-phone" inputMode="tel" placeholder="0772000000" required value={v.nokPhone} onChange={(e) => set('nokPhone', e.target.value)} />
                  </Field>
                  <Field label="Medical conditions or allergies (optional)" id="hub-medical">
                    <input className="field" id="hub-medical" placeholder="e.g. asthma, none" value={v.medical} onChange={(e) => set('medical', e.target.value)} />
                  </Field>
                  <label className="flex items-start gap-3 text-base leading-7 sm:col-span-2">
                    <input type="checkbox" required checked={v.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-1.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                    <span>
                      I confirm I am fit to take part and run at my own risk, that my details above are correct, and that photos and videos of me at the event may be used to promote Harambe Run.
                    </span>
                  </label>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button className="btn-gold" type="submit">
                  Continue
                </button>
                <button type="button" onClick={() => go(1)} className="px-4 py-3 font-ui text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">
                  Back
                </button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <form onSubmit={pay} className="mt-6 grid grid-cols-1 gap-6">
              <div className="border border-border">
                <dl className="divide-y divide-border text-base">
                  {donation > 0 ? (
                    <div className="flex items-baseline justify-between gap-4 p-4">
                      <dt>Your gift{kit ? ' (extra donation)' : ''}</dt>
                      <dd className="font-bold tabular-nums">{ugx(donation)}</dd>
                    </div>
                  ) : null}
                  {kit ? (
                    <div className="flex items-baseline justify-between gap-4 p-4">
                      <dt>Running kit: {kit.label.split(',')[0]}</dt>
                      <dd className="font-bold tabular-nums">{ugx(kit.amount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-4 bg-background p-4">
                    <dt className="font-ui text-xs font-black uppercase tracking-[0.18em]">Total to pay</dt>
                    <dd className="font-display text-3xl leading-none tabular-nums">{ugx(total)}</dd>
                  </div>
                </dl>
              </div>
              <p className="text-sm leading-6 text-foreground/70">Your receipt shows how the payment is shared between your gift and your kit. It is counted for {hubName}.</p>

              <fieldset className="min-w-0">
                <legend className="label">Pay with</legend>
                <div className="mt-1 space-y-3">
                  {(
                    [
                      ['mobile', 'Mobile money', 'MTN or Airtel. You approve a prompt on your phone.'],
                      ['card', 'Visa card', "You enter your card on Blink's secure payment page."],
                    ] as Array<[Method, string, string]>
                  ).map(([key, title, hint]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="hub_pay_method"
                        checked={method === key}
                        onChange={() => {
                          setMethod(key)
                          if (payState === 'error') setPayState('idle')
                        }}
                        className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
                      />
                      <span className="leading-6">
                        <span className="block text-base text-foreground">{title}</span>
                        <span className="block text-sm text-foreground/60">{hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label={method === 'card' ? 'Your phone number (your SMS receipt is sent here)' : 'Mobile money number (the payment prompt comes here)'} id="hub-phone">
                <input className="field sm:max-w-md" id="hub-phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required value={v.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>

              {payState === 'error' || payState === 'pending' ? (
                <div className={`p-6 ${payState === 'error' ? 'bg-foreground text-white' : 'bg-secondary text-secondary-foreground'}`} role="alert">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em]">{payState === 'error' ? 'Payment not completed' : 'Still waiting for approval'}</p>
                  <p className="mt-3 text-lg leading-8">{payMessage}</p>
                  {payState === 'pending' && pendingRef ? (
                    <p className="mt-3 text-base leading-7">
                      Your reference is <strong>{pendingRef}</strong>.{' '}
                      <a href={`/receipt/${pendingRef}${pendingKey ? `?k=${pendingKey}` : ''}`} className="font-bold underline underline-offset-4">
                        Check your receipt
                      </a>{' '}
                      in a few minutes.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-gold w-full sm:w-auto" type="submit" disabled={busy}>
                    {method === 'card' ? `Continue to card payment: ${ugx(total)}` : `Pay ${ugx(total)}`}
                  </button>
                  <button type="button" onClick={() => go(2)} disabled={busy} className="px-4 py-3 font-ui text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">
                    Back
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {method === 'card'
                    ? "You leave this site briefly to pay on Blink's secure page, then come back to your receipt."
                    : 'Mobile money network charges apply and are shown on the prompt before you enter your PIN.'}
                </p>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  )
}
