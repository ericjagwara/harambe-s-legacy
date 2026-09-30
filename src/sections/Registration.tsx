import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Reveal from '../components/Reveal'
import { supabase } from '@/integrations/supabase/client'
import { booths, sectorPackages, sponsorTiers, universityStarts } from '../data'

export type RegistrationTab = 'run' | 'donate' | 'sponsor' | 'booth'

const choices: Array<{ key: RegistrationTab; title: string }> = [
  { key: 'run', title: 'Run - Register to run / Offer discounts' },
  { key: 'donate', title: 'Donate - Give any amount' },
  { key: 'sponsor', title: 'Sponsor - Partner as an organisation' },
  { key: 'booth', title: 'Exhibit - Book a booth and exhibit' },
]

const guides: Record<RegistrationTab, string[]> = {
  run: [
    'Fill in your details, your run and an emergency contact.',
    'Pay for your running kit by mobile money or Visa card.',
    'You get a receipt on screen, by SMS and by email. Show it at kit pickup. Run day is Sunday 29 November 2026.',
  ],
  donate: [
    'Enter your details and the amount you want to give.',
    'Pay by mobile money or Visa card. You choose whether your name shows on the public donor board.',
    'You get a receipt on screen, by SMS and by email. Funds support university startup programmes, startup funding and angel investor training.',
  ],
  sponsor: [
    'Tell us about your organisation and the package that interests you.',
    'Nothing is paid here. Our partnerships team sends you the full proposal and an invoice.',
    'Every sponsorship tier includes Startup Funding Vehicles corporate membership.',
  ],
  booth: [
    'Choose an exhibition booth at the finish line.',
    'Nothing is paid here. We confirm availability first, then send you an invoice.',
  ],
}

const exhibitOptions = [
  ...booths.map((booth) => `${booth.name}, ${booth.size}, ${booth.price}`),
]

const kitSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const distances = ['21 km (half marathon)', '10 km', '5 km', '3 km (fun run)']

// Keep these labels identical to RUNNER_PRICES in blinkpay-deposit, blinkpay-card-start and pickup-desk.
const runnerCategories = [
  { label: 'Student runner, UGX 15,000', amount: 15000 },
  { label: 'General public runner, UGX 30,000', amount: 30000 },
  { label: 'Featured Startup, UGX 60,000 (Offering Discount)', amount: 60000 },
  { label: 'Featured SME/Corporate, UGX 100,000 (Offering Discount)', amount: 100000 },
]

type PayState = 'idle' | 'starting' | 'waiting' | 'success' | 'pending' | 'error'
type PayMethod = 'mobile' | 'card'

// Reads the message from a failed Supabase function call (4xx/5xx responses carry { error }).
async function functionError(error: unknown, fallback: string) {
  const context = (error as { context?: Response } | null)?.context
  const body = await context?.json?.().catch(() => null)
  return typeof body?.error === 'string' ? body.error : fallback
}

// Sends the browser to Blink's hosted card page with the signed fields.
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

type RegistrationProps = {
  initialTab?: RegistrationTab | ''
  // Show only this form, with its own heading and no "What would you like to do?" dropdown.
  fixed?: { tab: RegistrationTab; eyebrow: string; title: string; intro: string }
}

export default function Registration({ initialTab = '', fixed }: RegistrationProps) {
  const [active, setActive] = useState<RegistrationTab | ''>(fixed?.tab ?? initialTab)
  const [submitted, setSubmitted] = useState('')
  const [payState, setPayState] = useState<PayState>('idle')
  const [payMessage, setPayMessage] = useState('')
  const [pendingRef, setPendingRef] = useState('')
  const [pendingKey, setPendingKey] = useState('')
  const [charged, setCharged] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [method, setMethod] = useState<PayMethod>('mobile')
  const [category, setCategory] = useState(runnerCategories[0].label)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const pollRef = useRef<number | null>(null)
  const noticeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setActive(fixed?.tab ?? initialTab)
    setSubmitted('')
    setFormError('')
    resetPayment()
  }, [initialTab])

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current)
  }, [])

  // Seconds counter shown while waiting for the payment approval.
  useEffect(() => {
    if (payState !== 'waiting') return
    setElapsed(0)
    const timer = window.setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => window.clearInterval(timer)
  }, [payState])

  // Bring a result or error into view, wherever the person was on the page.
  useEffect(() => {
    if (payState === 'error' || payState === 'pending' || submitted || formError) {
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [payState, submitted, formError])

  function resetPayment() {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = null
    setPayState('idle')
    setPayMessage('')
    setPendingRef('')
  }

  const choose = (key: RegistrationTab | '') => {
    setActive(key)
    setSubmitted('')
    setFormError('')
    resetPayment()
  }

  const submit = async (event: FormEvent<HTMLFormElement>, type: 'Sponsorship' | 'Exhibition') => {
    event.preventDefault()
    const form = event.currentTarget
    const fields: Record<string, string> = {}
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '') fields[key] = value.trim()
    })
    setSending(true)
    setFormError('')
    setSubmitted('')
    const { error } = await supabase.functions.invoke('submit-enquiry', { body: { type, fields } })
    setSending(false)
    if (error) {
      setFormError(await functionError(error, 'We could not send your details. Please try again, or email info@haramberun.com.'))
      return
    }
    setSubmitted(
      type === 'Sponsorship'
        ? 'Thank you for backing Uganda\'s builders. Our partnerships team will contact you with the full proposal and next steps. A confirmation email is on its way. Nothing has been charged.'
        : 'Your request is in. We will confirm availability and send you an invoice. A confirmation email is on its way. Nothing has been charged.'
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

    const extras: Record<string, string> = {}
    data.forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '' && !['name', 'phone', 'amount'].includes(key)) {
        extras[key] = value
      }
    })

    // Startup/SME runners may attach a logo; it is stored privately in Supabase Storage (bucket startup-logos).
    const logo = data.get('startup_logo')
    if (logo instanceof File && logo.size > 0) {
      const ext = (logo.name.split('.').pop() ?? '').toLowerCase().replace('jpeg', 'jpg')
      if (!['png', 'jpg', 'webp', 'svg'].includes(ext) || logo.size > 2 * 1024 * 1024) {
        setPayState('error')
        setPayMessage('The logo must be a PNG, JPG, WEBP or SVG image of 2 MB or less.')
        return
      }
      setPayState('starting')
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('startup-logos')
        .upload(path, logo, { contentType: logo.type || undefined, upsert: false })
      if (uploadError) {
        setPayState('error')
        setPayMessage('We could not upload your logo. Please try again, or remove the logo and send it to info@haramberun.com later.')
        return
      }
      extras.startup_logo = path
    }
    const body = {
      fullName,
      email: data.get('email'),
      phone,
      amount,
      purpose,
      isAnonymous: String(data.get('display') ?? '').toLowerCase().includes('anonymous'),
      details: extras,
    }

    setPayState('starting')
    setPayMessage('')
    setCharged(amount)

    if (method === 'card') {
      const { data: cardResult, error: cardError } = await supabase.functions.invoke('blinkpay-card-start', { body })
      const started = cardResult as { url?: string; fields?: Record<string, string> } | null
      if (cardError || !started?.url || !started.fields) {
        setPayState('error')
        setPayMessage(await functionError(cardError, 'We could not open the card payment page. Please try again, or pay with mobile money.'))
        return
      }
      postToBlink(started.url, started.fields)
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
    setCharged(Number((result as { amount?: number }).amount ?? amount))
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
        // The receipt page is the success page: confirmation, receipt, WhatsApp group and next steps.
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

  const busy = payState === 'starting' || payState === 'waiting'
  const student = category.toLowerCase().includes('student')
  const businessListing = category.toLowerCase().includes('startup') || category.toLowerCase().includes('sme')
  const runnerPrice = runnerCategories.find((c) => c.label === category)?.amount ?? 30000
  const minutes = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  const payNotice =
    payState === 'error' || payState === 'pending' ? (
      <div ref={noticeRef} className={`scroll-mt-28 p-6 ${payState === 'error' ? 'bg-foreground text-white' : 'bg-secondary text-secondary-foreground'}`} role="alert">
        <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em]">
          {payState === 'error' ? 'Payment not completed' : 'Still waiting for approval'}
        </p>
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
    ) : null

  const overlay = busy ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/85 p-4" role="dialog" aria-modal="true" aria-live="polite">
      <div className="w-full max-w-md bg-white p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/15 border-t-primary" aria-hidden="true" />
        {payState === 'starting' ? (
          <>
            <p className="mt-6 font-display text-3xl uppercase leading-none">
              {method === 'card' ? 'Opening card payment' : 'Sending the request'}
            </p>
            <p className="mt-4 text-base leading-7 text-foreground/75">
              {method === 'card'
                ? 'Taking you to Blink\'s secure payment page. You will enter your card details there.'
                : 'Sending a payment request to your phone. This takes a few seconds.'}
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 font-display text-3xl uppercase leading-none">Check your phone</p>
            <p className="mt-4 text-base leading-7 text-foreground/75">
              Approve the payment of <strong>UGX {charged.toLocaleString('en-UG')}</strong> by entering your mobile money PIN. MTN or Airtel shows its network charges on the prompt.
            </p>
            <p className="mt-4 text-sm text-foreground/60">
              Waiting for approval, {minutes}. Keep this page open; it moves on by itself.
            </p>
            <button type="button" onClick={resetPayment} className="btn-outline mt-6">
              No prompt? Cancel
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  ) : null

  const methodPicker = (
    <fieldset className="min-w-0 sm:col-span-2">
      <legend className="label">Pay with</legend>
      <div className="mt-1 space-y-3">
        {(
          [
            ['mobile', 'Mobile money', 'MTN or Airtel. You approve a prompt on your phone.'],
            ['card', 'Visa card', 'You enter your card on Blink\'s secure payment page.'],
          ] as Array<[PayMethod, string, string]>
        ).map(([key, title, hint]) => (
          <label key={key} className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="pay_method"
              value={key}
              checked={method === key}
              onChange={() => {
                setMethod(key)
                if (payState === 'error') resetPayment()
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
  )

  const chargesNote =
    method === 'card'
      ? 'You leave this site briefly to pay on Blink\'s secure page, then come back to your receipt.'
      : 'Mobile money network charges apply and are shown on the prompt before you enter your PIN.'

  const success = submitted ? (
    <div ref={noticeRef} className="scroll-mt-28 bg-primary p-6 text-primary-foreground" role="status">
      <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Received</p>
      <p className="mt-3 text-lg leading-8">{submitted}</p>
    </div>
  ) : null

  const errorBox = formError ? (
    <div ref={noticeRef} className="scroll-mt-28 bg-foreground p-6 text-lg leading-8 text-white" role="alert">
      {formError}
    </div>
  ) : null

  return (
    <section id="register" className="relative border-b border-border bg-background pb-8 pt-4 sm:py-12 lg:py-16">
      {overlay}
      <div className="container-site">
        <Reveal>
          <div className="-mx-5 bg-white px-5 py-7 sm:mx-0 sm:p-10">
            {fixed ? (
              <>
                <p className="eyebrow">{fixed.eyebrow}</p>
                <h1 className="mt-3 font-display text-[2.1rem] uppercase leading-none sm:mt-4 sm:text-5xl">{fixed.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/75 sm:text-lg sm:leading-8">{fixed.intro}</p>
              </>
            ) : (
              <>
            <p className="eyebrow">Startups Harambe Run 2026</p>
            <h1 className="mt-3 font-display text-[2.1rem] uppercase leading-none sm:mt-4 sm:text-5xl">What would you like to do?</h1>
            <label htmlFor="what" className="sr-only">
              What would you like to do?
            </label>
            <select
              id="what"
              name="what"
              required
              value={active}
              onChange={(event) => choose(event.target.value as RegistrationTab | '')}
              className="field mt-5 sm:mt-6 sm:max-w-xl"
            >
              <option value="" disabled>
                Select an option
              </option>
              {choices.map((choice) => (
                <option key={choice.key} value={choice.key}>
                  {choice.title}
                </option>
              ))}
            </select>

            {active === '' ? (
              <p className="mt-4 text-base leading-7 text-foreground/70">Choose an option to see the form. Runners and donors pay online; everyone else sends their details and our team follows up.</p>
            ) : null}
              </>
            )}

            {active !== '' ? (
            <div className="mt-6 border-t border-border pt-5 sm:mt-10 sm:pt-8">
              <p className="label">How it works</p>
              <ol className="mt-2 max-w-3xl space-y-1.5 text-[15px] leading-6 text-foreground/80 sm:mt-3 sm:space-y-2 sm:text-base sm:leading-7">
                {guides[active].map((line, index) => (
                  <li key={line} className="flex gap-3">
                    <span className="font-ui text-xs font-black leading-7 text-accent">{index + 1}.</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>
            ) : null}

            <div className="mt-6 sm:mt-8">
              {active === 'run' ? (
                <form
                  onSubmit={(event) =>
                    pay(event, 'Runner registration', (data) =>
                      runnerCategories.find((c) => c.label === String(data.get('category')))?.amount ?? 30000
                    )
                  }
                  className="grid grid-cols-1 gap-6 sm:gap-8"
                >
                  <FormGroup title="About you">
                    <Field label="Full name" id="runner-name">
                      <input className="field" id="runner-name" name="name" autoComplete="name" required />
                    </Field>
                    <Field label="Email (your receipt is sent here)" id="runner-email">
                      <input className="field" id="runner-email" type="email" name="email" autoComplete="email" required />
                    </Field>
                    <Field label="Gender" id="runner-gender">
                      <select className="field" id="runner-gender" name="gender" required defaultValue="">
                        <option value="" disabled>Choose</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Prefer not to say</option>
                      </select>
                    </Field>
                    <Field label="Date of birth" id="runner-dob">
                      <input className="field max-w-full appearance-none" id="runner-dob" type="date" name="date_of_birth" min="1930-01-01" max="2014-12-31" required />
                    </Field>
                  </FormGroup>

                  <FormGroup title="Your run">
                    <Field label="Category" id="category">
                      <select className="field" id="category" name="category" required value={category} onChange={(e) => setCategory(e.target.value)}>
                        {runnerCategories.map((c) => (
                          <option key={c.label}>{c.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Distance" id="distance">
                      <select className="field" id="distance" name="distance" required defaultValue="">
                        <option value="" disabled>Choose a distance</option>
                        {distances.map((distance) => (
                          <option key={distance}>{distance}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Running kit size" id="kit-size">
                      <select className="field" id="kit-size" name="kit_size" required defaultValue="">
                        <option value="" disabled>Choose a size</option>
                        {kitSizes.map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </Field>
                    {businessListing ? (
                      <>
                        <Field label="Startup or business name" id="startup-name">
                          <input className="field" id="startup-name" name="startup_name" autoComplete="organization" required />
                        </Field>
                        <Field label="Logo (optional, PNG, JPG or SVG, up to 2 MB)" id="startup-logo">
                          <input
                            className="field py-2.5 file:mr-3 file:border-0 file:bg-background file:px-3 file:py-1.5 file:font-ui file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-foreground"
                            id="startup-logo"
                            name="startup_logo"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          />
                        </Field>
                        <p className="text-sm leading-6 text-foreground/70 sm:col-span-2">
                          Your business name and logo are used for the discount listing, social media mentions and visibility included in this package.
                        </p>
                      </>
                    ) : (
                      <Field label={student ? 'University or institution' : 'Organisation or institution (optional)'} id="institution">
                        <input className="field" id="institution" name="institution" list="institution-list" required={student} />
                        <datalist id="institution-list">
                          {universityStarts.map((u) => (
                            <option key={u} value={u.split(',')[0]} />
                          ))}
                        </datalist>
                      </Field>
                    )}
                    {student ? (
                      <p className="text-sm leading-6 text-foreground/70 sm:col-span-2">
                        Student rate: bring your valid student ID to kit pickup. No upload is needed now.
                      </p>
                    ) : null}
                  </FormGroup>

                  <FormGroup title="Next of kin (emergency contact)">
                    <Field label="Full name" id="nok-name">
                      <input className="field" id="nok-name" name="next_of_kin_name" required />
                    </Field>
                    <Field label="Relationship" id="nok-relationship">
                      <input className="field" id="nok-relationship" name="next_of_kin_relationship" placeholder="Parent, sibling, spouse, friend" required />
                    </Field>
                    <Field label="Phone number" id="nok-phone">
                      <input className="field" id="nok-phone" name="next_of_kin_phone" inputMode="tel" placeholder="0772000000" required />
                    </Field>
                    <Field label="Medical conditions or allergies (optional)" id="medical">
                      <input className="field" id="medical" name="medical_notes" placeholder="e.g. asthma, none" />
                    </Field>
                  </FormGroup>

                  <FormGroup title="Payment">
                    {methodPicker}
                    <Field label={method === 'card' ? 'Your phone number (your SMS receipt is sent here)' : 'Mobile money number (the payment prompt comes here)'} id="runner-phone">
                      <input className="field" id="runner-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required />
                    </Field>
                  </FormGroup>

                  <label className="flex items-start gap-3 text-base leading-7">
                    <input type="checkbox" name="consent" value="Agreed" required className="mt-1.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                    <span>
                      I confirm I am fit to take part and run at my own risk, that my details above are correct, and that photos and videos of me at the event may be used to promote Harambe Run.
                    </span>
                  </label>

                  {payNotice}

                  <div>
                    <button className="btn-primary w-full sm:w-auto" type="submit" disabled={busy}>
                      {method === 'card' ? 'Continue to card payment' : `Pay UGX ${runnerPrice.toLocaleString('en-UG')} and confirm my place`}
                    </button>
                    <p className="mt-3 text-sm leading-6 text-foreground/70">{chargesNote}</p>
                  </div>
                </form>
              ) : null}

              {active === 'donate' ? (
                <form onSubmit={(event) => pay(event, 'Donation', (data) => Number(String(data.get('amount')).replace(/\D/g, '')))} className="grid grid-cols-1 gap-6 sm:gap-8">
                  <FormGroup title="About you">
                    <Field label="Name or organisation" id="donor-name">
                      <input className="field" id="donor-name" name="name" autoComplete="name" required />
                    </Field>
                    <Field label="Email (your receipt is sent here)" id="donor-email">
                      <input className="field" id="donor-email" type="email" name="email" autoComplete="email" required />
                    </Field>
                    <Field label="Amount in UGX (minimum 500)" id="amount">
                      <input className="field" id="amount" name="amount" inputMode="numeric" placeholder="100000" required />
                    </Field>
                    <Field label="On the public donor board" id="display">
                      <select className="field" id="display" name="display" required>
                        <option>Show my name</option>
                        <option>Display as anonymous</option>
                      </select>
                    </Field>
                  </FormGroup>

                  <FormGroup title="Payment">
                    {methodPicker}
                    <Field
                      label={method === 'card' ? 'Your phone number (your SMS receipt is sent here)' : 'Mobile money number (the payment prompt comes here)'}
                      id="donor-phone"
                    >
                      <input className="field" id="donor-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required />
                    </Field>
                  </FormGroup>

                  {payNotice}

                  <div>
                    <button className="btn-gold w-full sm:w-auto" type="submit" disabled={busy}>
                      {method === 'card' ? 'Continue to card payment' : 'Give now'}
                    </button>
                    <p className="mt-3 text-sm leading-6 text-foreground/70">{chargesNote}</p>
                  </div>
                </form>
              ) : null}

              {active === 'sponsor' ? (
                <form onSubmit={(event) => submit(event, 'Sponsorship')} className="grid grid-cols-1 gap-6 sm:gap-8">
                  <HoneyPot />
                  <FormGroup title="Your organisation">
                    <Field label="Organisation" id="sponsor-org">
                      <input className="field" id="sponsor-org" name="organisation" autoComplete="organization" required />
                    </Field>
                    <Field label="Contact person" id="sponsor-name">
                      <input className="field" id="sponsor-name" name="name" autoComplete="name" required />
                    </Field>
                    <Field label="Role or title" id="sponsor-role">
                      <input className="field" id="sponsor-role" name="role" autoComplete="organization-title" />
                    </Field>
                    <Field label="Email" id="sponsor-email">
                      <input className="field" id="sponsor-email" type="email" name="email" autoComplete="email" required />
                    </Field>
                    <Field label="Phone number" id="sponsor-phone">
                      <input className="field" id="sponsor-phone" name="phone" inputMode="tel" autoComplete="tel" required />
                    </Field>
                    <Field label="Package of interest" id="tier">
                      <select className="field" id="tier" name="choice" required defaultValue="">
                        <option value="" disabled>Choose a package</option>
                        <optgroup label="Sponsorship tiers">
                          {sponsorTiers.map((tier) => (
                            <option key={tier.name}>{`${tier.name}, ${tier.price}`}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Sector and add-on packages">
                          {sectorPackages.map(([name, price]) => (
                            <option key={name}>{`${name}, ${price}`}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Other">
                          <option>In-kind support (goods or services)</option>
                          <option>Not sure yet, please advise</option>
                        </optgroup>
                      </select>
                    </Field>
                  </FormGroup>
                  <Field label="Anything we should know? (optional)" id="sponsor-message">
                    <textarea className="field min-h-28" id="sponsor-message" name="message" placeholder="Goals for the partnership, in-kind offer, timelines" />
                  </Field>
                  {success}
                  {errorBox}
                  <div>
                    <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                      {sending ? 'Sending…' : 'Send sponsorship interest'}
                    </button>
                  </div>
                </form>
              ) : null}

              {active === 'booth' ? (
                <form onSubmit={(event) => submit(event, 'Exhibition')} className="grid grid-cols-1 gap-6 sm:gap-8">
                  <HoneyPot />
                  <FormGroup title="Your business">
                    <Field label="Business or organisation" id="booth-org">
                      <input className="field" id="booth-org" name="organisation" autoComplete="organization" required />
                    </Field>
                    <Field label="Contact person" id="booth-name">
                      <input className="field" id="booth-name" name="name" autoComplete="name" required />
                    </Field>
                    <Field label="Email" id="booth-email">
                      <input className="field" id="booth-email" type="email" name="email" autoComplete="email" required />
                    </Field>
                    <Field label="Phone number" id="booth-phone">
                      <input className="field" id="booth-phone" name="phone" inputMode="tel" autoComplete="tel" required />
                    </Field>
                    <Field label="Booth" id="booth-choice">
                      <select className="field" id="booth-choice" name="choice" required defaultValue="">
                        <option value="" disabled>Choose a booth</option>
                        {exhibitOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="What will you showcase or offer?" id="booth-offer">
                      <input className="field" id="booth-offer" name="offer" placeholder="Products or services you will showcase" required />
                    </Field>
                  </FormGroup>
                  {success}
                  {errorBox}
                  <div>
                    <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                      {sending ? 'Sending…' : 'Send request'}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 sm:gap-5 sm:pt-6">
      <legend className="float-left mb-1 w-full font-ui text-xs font-black uppercase tracking-[0.2em] text-primary sm:col-span-2">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

// Hidden from people; spam bots fill it in and their submission is ignored.
function HoneyPot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
