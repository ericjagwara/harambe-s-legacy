import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Reveal from '../components/Reveal'
import { supabase } from '@/integrations/supabase/client'
import { booths, neighborhoodStarts, sectorPackages, sponsorTiers, universityStarts } from '../data'

export type RegistrationTab = 'run' | 'donate' | 'sponsor' | 'booth' | 'volunteer'

const tabs: Array<{ key: RegistrationTab; title: string; description: string; tag: string }> = [
  { key: 'run', title: 'Run', description: 'Register and pay for your running kit.', tag: 'Pay online' },
  { key: 'donate', title: 'Donate', description: 'Give any amount, named or anonymous.', tag: 'Pay online' },
  { key: 'sponsor', title: 'Sponsor', description: 'Partner as an organisation or investor.', tag: 'We contact you' },
  { key: 'booth', title: 'Exhibit', description: 'Book a booth or offer a runner discount.', tag: 'We contact you' },
  { key: 'volunteer', title: 'Volunteer', description: 'Help on race day or on your campus.', tag: 'Free' },
]

const intros: Record<RegistrationTab, { title: string; text: string }> = {
  run: {
    title: 'Register as a runner',
    text: 'Pay for your running kit online with mobile money or a Visa card. You get a receipt and an SMS to show at kit pickup. Run day is 29 November 2026, finishing at Makerere University Freedom Square.',
  },
  donate: {
    title: 'Donate to the Harambe fund',
    text: 'Your gift funds startup programmes in universities, catalytic funds for startups and angel investor training. Funds are overseen by a steering committee and reported publicly on this site.',
  },
  sponsor: {
    title: 'Become a sponsor or partner',
    text: 'Tell us about your organisation and the package that interests you. Our partnerships team will contact you with the full proposal and an invoice. Nothing is paid on this site. Every tier includes Startup Funding Vehicles corporate membership.',
  },
  booth: {
    title: 'Exhibit or offer a runner discount',
    text: 'Request an exhibition booth at the finish line, or list your business as a featured discount provider for runners. We confirm availability and send you an invoice. Nothing is paid on this site.',
  },
  volunteer: {
    title: 'Volunteer with us',
    text: 'Help as a route marshal, at kit pickup, with media, or by mobilising runners on your campus. Volunteering is free.',
  },
}

const exhibitOptions = [
  ...booths.map((booth) => `${booth.name}, ${booth.size}, ${booth.price}`),
  'Featured startup discount provider, UGX 60,000',
  'Featured SME or corporate discount provider, UGX 100,000',
]

const volunteerRoles = [
  'Route marshal',
  'Registration and kit pickup',
  'Media, photos and content',
  'Mobilising runners on my campus',
  'First aid (I am trained)',
  'Wherever I am needed',
]

const kitSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const startPoints = [...universityStarts, ...neighborhoodStarts]

const runnerCategories = [
  { label: 'Student runner, UGX 15,000', amount: 15000 },
  { label: 'General public runner, UGX 30,000', amount: 30000 },
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

export default function Registration({ initialTab = 'run' }: { initialTab?: RegistrationTab }) {
  const [active, setActive] = useState<RegistrationTab>(initialTab)
  const [submitted, setSubmitted] = useState('')
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [receiptRef, setReceiptRef] = useState('')
  const [payState, setPayState] = useState<PayState>('idle')
  const [payMessage, setPayMessage] = useState('')
  const [method, setMethod] = useState<PayMethod>('mobile')
  const [category, setCategory] = useState(runnerCategories[0].label)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [successTitle, setSuccessTitle] = useState('You are in')
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    setActive(initialTab)
    setSubmitted('')
    setShowJoinGroup(false)
    setReceiptRef('')
    resetPayment()
  }, [initialTab])

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current)
  }, [])

  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/FKehPb60rdo9z9wW2shBr2'

  function resetPayment() {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = null
    setPayState('idle')
    setPayMessage('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>, type: 'Sponsorship' | 'Exhibition' | 'Volunteer') => {
    event.preventDefault()
    const form = event.currentTarget
    const fields: Record<string, string> = {}
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '') fields[key] = value.trim()
    })
    setSending(true)
    setFormError('')
    const { error } = await supabase.functions.invoke('submit-enquiry', { body: { type, fields } })
    setSending(false)
    if (error) {
      setFormError(await functionError(error, 'We could not send your details. Please try again, or email info@haramberun.com.'))
      return
    }
    setSuccessTitle('Received')
    setSubmitted(
      type === 'Sponsorship'
        ? 'Thank you for backing Uganda\'s builders. Our partnerships team will contact you with the full proposal and next steps. Nothing has been charged.'
        : type === 'Exhibition'
          ? 'Your request is in. We will confirm availability and send you an invoice. Nothing has been charged.'
          : 'Thank you for volunteering. We will contact you with your role and a briefing before run day.'
    )
    form.reset()
    window.scrollTo({ top: (document.getElementById('register')?.offsetTop ?? 0) - 120, behavior: 'smooth' })
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
    setShowJoinGroup(false)
    setReceiptRef('')
    setPayState('starting')
    setPayMessage(method === 'card' ? 'Opening the secure Blink card payment page.' : 'Sending a payment request to your phone.')

    const extras: Record<string, string> = {}
    data.forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '' && !['name', 'phone', 'amount'].includes(key)) {
        extras[key] = value
      }
    })

    if (method === 'card') {
      const { data: cardResult, error: cardError } = await supabase.functions.invoke('blinkpay-card-start', {
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
      const started = cardResult as { url?: string; fields?: Record<string, string>; error?: string } | null
      if (cardError || !started?.url || !started.fields) {
        setPayState('error')
        setPayMessage(
          started?.error ?? (await functionError(cardError, 'We could not open the card payment page. Please try again, or pay with mobile money.'))
        )
        return
      }
      postToBlink(started.url, started.fields)
      return
    }

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
    const reference = (result as { reference?: string }).reference ?? ''
    const charged = Number((result as { amount?: number }).amount ?? amount)
    setPayState('waiting')
    setPayMessage(
      `Check your phone. Approve the mobile money request for UGX ${charged.toLocaleString('en-UG')} by entering your PIN. Network charges from MTN or Airtel are shown on the prompt.`
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
        setSuccessTitle('You are in')
        setSubmitted(
          purpose === 'Donation'
            ? `Payment received. Thank you for funding Uganda's next job creators. Your gift of UGX ${charged.toLocaleString('en-UG')} is already counted on our live fundraising board. Your reference is ${reference}.`
            : `Payment received. Your place at Harambe Run 2026 is confirmed. Your reference is ${reference}. Save your receipt below: you will need it, or your confirmation SMS, at kit pickup. Harambe. Run. Fund. Job Creation. Tell a friend!`
        )
        setShowJoinGroup(purpose === 'Runner registration')
        setReceiptRef(reference)
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
          `We have not seen the approval yet. If you approved it, the payment will still come through. Your reference is ${reference}; you can check it any time at haramberun.com/receipt/${reference}.`
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
        {payState === 'error' ? 'Try again' : payState === 'pending' ? 'Still processing' : method === 'card' ? 'Card payment' : 'Approve on your phone'}
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

  const methodPicker = (
    <fieldset>
      <legend className="label">Pay with</legend>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['mobile', 'Mobile money', 'MTN or Airtel'],
            ['card', 'Visa card', 'Secure Blink page'],
          ] as Array<[PayMethod, string, string]>
        ).map(([key, title, hint]) => (
          <button
            key={key}
            type="button"
            aria-pressed={method === key}
            onClick={() => {
              setMethod(key)
              if (payState === 'error') resetPayment()
            }}
            className={`border p-4 text-left transition-colors ${
              method === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'
            }`}
          >
            <span className="block font-ui text-xs font-black uppercase tracking-[0.2em]">{title}</span>
            <span className={`mt-1 block text-sm ${method === key ? 'text-primary-foreground/80' : 'text-foreground/60'}`}>{hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )

  const chargesNote =
    method === 'card'
      ? 'You will enter your card details on Blink\'s secure payment page, not on this site. You come back here to your receipt when you finish.'
      : 'Mobile money network charges apply. MTN or Airtel shows them on the prompt before you enter your PIN.'
  const busyLabel = method === 'card' ? 'Opening card payment' : 'Waiting for approval'
  const student = category.toLowerCase().includes('student')

  const switchTab = (key: RegistrationTab) => {
    setActive(key)
    setSubmitted('')
    setShowJoinGroup(false)
    setReceiptRef('')
    setFormError('')
    resetPayment()
  }

  const intro = intros[active]
  const activeTab = tabs.find((tab) => tab.key === active)!

  return (
    <section id="register" className="relative border-b border-border bg-background py-14 lg:py-20">
      <div className="container-site">
        <Reveal>
          <p className="label">What would you like to do?</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="tablist" aria-label="Ways to take part">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active === tab.key}
                onClick={() => switchTab(tab.key)}
                className={`flex flex-col border-2 p-4 text-left transition-colors ${
                  active === tab.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-foreground hover:border-primary'
                }`}
              >
                <span className="font-display text-2xl uppercase leading-none">{tab.title}</span>
                <span className={`mt-2 text-sm leading-5 ${active === tab.key ? 'text-primary-foreground/80' : 'text-foreground/65'}`}>
                  {tab.description}
                </span>
                <span
                  className={`mt-3 self-start px-2 py-1 font-ui text-[10px] font-black uppercase tracking-[0.18em] ${
                    active === tab.key ? 'bg-secondary text-secondary-foreground' : 'bg-background text-foreground/70'
                  }`}
                >
                  {tab.tag}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-4 bg-white p-6 sm:p-9">
            <div className="mb-8 max-w-3xl">
              <p className="eyebrow">{activeTab.tag}</p>
              <h2 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">{intro.title}</h2>
              <p className="mt-4 text-lg leading-8 text-foreground/75">{intro.text}</p>
            </div>

            {submitted ? (
              <div className="mb-7 border border-primary bg-primary p-6 text-primary-foreground">
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">{successTitle}</p>
                <p className="mt-3 text-lg leading-8">{submitted}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {receiptRef ? (
                    <a href={`/receipt/${receiptRef}`} className="btn-gold inline-flex">
                      View and save receipt
                    </a>
                  ) : null}
                  {showJoinGroup ? (
                    <a
                      href={WHATSAPP_GROUP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline inline-flex border-white text-white"
                    >
                      Join the WhatsApp group
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {active === 'run' || active === 'donate' ? payNotice : null}
            {formError ? <div className="mb-7 bg-foreground p-6 text-lg leading-8 text-white">{formError}</div> : null}

            {active === 'run' ? (
              <form
                onSubmit={(event) =>
                  pay(event, 'Runner registration', (data) =>
                    runnerCategories.find((c) => c.label === String(data.get('category')))?.amount ?? 30000
                  )
                }
                className="grid gap-8"
              >
                <FormGroup title="About you">
                  <Field label="Full name" id="runner-name">
                    <input className="field" id="runner-name" name="name" autoComplete="name" required />
                  </Field>
                  <Field label="Email" id="runner-email">
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
                    <input className="field" id="runner-dob" type="date" name="date_of_birth" min="1930-01-01" max="2014-12-31" required />
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
                  <Field label="Starting point" id="start">
                    <select className="field" id="start" name="start" required>
                      {startPoints.map((point) => (
                        <option key={point}>{point}</option>
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
                  <Field label={student ? 'University or institution' : 'Organisation or institution (optional)'} id="institution">
                    <input className="field" id="institution" name="institution" list="institution-list" required={student} />
                    <datalist id="institution-list">
                      {universityStarts.map((u) => (
                        <option key={u} value={u.split(',')[0]} />
                      ))}
                    </datalist>
                  </Field>
                </FormGroup>
                {student ? (
                  <p className="-mt-4 text-sm leading-6 text-foreground/70">
                    Student rate: bring your valid student ID to kit pickup. No upload is needed now.
                  </p>
                ) : null}

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
                  <div className="sm:col-span-2">{methodPicker}</div>
                  <Field label={method === 'card' ? 'Your phone number' : 'Mobile money number (the payment prompt comes here)'} id="runner-phone">
                    <input className="field" id="runner-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required />
                  </Field>
                </FormGroup>

                <label className="flex items-start gap-3 text-base leading-7">
                  <input type="checkbox" name="consent" value="Agreed" required className="mt-1.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                  <span>
                    I confirm I am fit to take part and run at my own risk, that my details above are correct, and that photos and videos of me at the event may be used to promote Harambe Run.
                  </span>
                </label>

                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={busy}>
                    {busy ? busyLabel : method === 'card' ? 'Continue to card payment' : 'Pay and confirm my place'}
                  </button>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">{chargesNote}</p>
                </div>
              </form>
            ) : null}

            {active === 'donate' ? (
              <form onSubmit={(event) => pay(event, 'Donation', (data) => Number(String(data.get('amount')).replace(/\D/g, '')))} className="grid gap-8">
                <FormGroup title="About you">
                  <Field label="Name or organisation" id="donor-name">
                    <input className="field" id="donor-name" name="name" autoComplete="name" required />
                  </Field>
                  <Field label="Email" id="donor-email">
                    <input className="field" id="donor-email" type="email" name="email" autoComplete="email" required />
                  </Field>
                  <Field label="Amount, UGX (minimum 500)" id="amount">
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
                  <div className="sm:col-span-2">{methodPicker}</div>
                  <Field
                    label={method === 'card' ? 'Phone number (optional, for your receipt SMS)' : 'Mobile money number (the payment prompt comes here)'}
                    id="donor-phone"
                  >
                    <input className="field" id="donor-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required={method === 'mobile'} />
                  </Field>
                </FormGroup>

                <div>
                  <button className="btn-gold w-full sm:w-auto" type="submit" disabled={busy}>
                    {busy ? busyLabel : method === 'card' ? 'Continue to card payment' : 'Give now'}
                  </button>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">{chargesNote}</p>
                </div>
              </form>
            ) : null}

            {active === 'sponsor' ? (
              <form onSubmit={(event) => submit(event, 'Sponsorship')} className="grid gap-8">
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
                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                    {sending ? 'Sending' : 'Send sponsorship interest'}
                  </button>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">No payment is taken here. We will send the proposal and an invoice.</p>
                </div>
              </form>
            ) : null}

            {active === 'booth' ? (
              <form onSubmit={(event) => submit(event, 'Exhibition')} className="grid gap-8">
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
                  <Field label="Booth or listing" id="booth-choice">
                    <select className="field" id="booth-choice" name="choice" required defaultValue="">
                      <option value="" disabled>Choose an option</option>
                      {exhibitOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="What will you showcase or offer?" id="booth-offer">
                    <input className="field" id="booth-offer" name="offer" placeholder="Products, services, or the discount for runners" required />
                  </Field>
                </FormGroup>
                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                    {sending ? 'Sending' : 'Send request'}
                  </button>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">No payment is taken here. We confirm availability first, then invoice you.</p>
                </div>
              </form>
            ) : null}

            {active === 'volunteer' ? (
              <form onSubmit={(event) => submit(event, 'Volunteer')} className="grid gap-8">
                <HoneyPot />
                <FormGroup title="About you">
                  <Field label="Full name" id="vol-name">
                    <input className="field" id="vol-name" name="name" autoComplete="name" required />
                  </Field>
                  <Field label="Email" id="vol-email">
                    <input className="field" id="vol-email" type="email" name="email" autoComplete="email" required />
                  </Field>
                  <Field label="Phone number" id="vol-phone">
                    <input className="field" id="vol-phone" name="phone" inputMode="tel" autoComplete="tel" required />
                  </Field>
                  <Field label="University or organisation (optional)" id="vol-org">
                    <input className="field" id="vol-org" name="organisation" list="institution-list-vol" />
                    <datalist id="institution-list-vol">
                      {universityStarts.map((u) => (
                        <option key={u} value={u.split(',')[0]} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="How would you like to help?" id="vol-role">
                    <select className="field" id="vol-role" name="choice" required defaultValue="">
                      <option value="" disabled>Choose a role</option>
                      {volunteerRoles.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="When are you available?" id="vol-when">
                    <select className="field" id="vol-when" name="availability" required defaultValue="">
                      <option value="" disabled>Choose</option>
                      <option>Run day only (29 November)</option>
                      <option>Before the run and on run day</option>
                    </select>
                  </Field>
                </FormGroup>
                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                    {sending ? 'Sending' : 'Sign up to volunteer'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
      <legend className="float-left mb-1 w-full font-ui text-xs font-black uppercase tracking-[0.2em] text-primary sm:col-span-2">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
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
