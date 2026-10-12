import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Check, Printer } from 'lucide-react'
import { PageHero } from '../components/PageLayout'
import { supabase } from '@/integrations/supabase/client'
import {
  AGREEMENT_VERSION,
  agreementToText,
  buildAgreement,
  volunteerRoles,
  type Agreement,
} from '../data/volunteerAgreement'

// Unlisted page: not linked from the menu or footer, and kept out of search engines
// (meta tag below plus an X-Robots-Tag header in netlify.toml). Volunteers get the link directly.
// Signatures are saved by the sign-volunteer-agreement function (Supabase: volunteer_agreements)
// and a copy is emailed to the volunteer and to the team.

const tidy = (value: string) => value.trim().replace(/\s+/g, ' ')
const normalise = (value: string) => tidy(value).toLowerCase()

type Signed = {
  reference: string
  signedAt: string
  emailed: boolean
  name: string
  email: string
  role: string
  typed: string
  image: string | null
}

const when = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    timeZone: 'Africa/Kampala',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VolunteerAgreementPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleChoice, setRoleChoice] = useState('')
  const [otherRole, setOtherRole] = useState('')
  const [typed, setTyped] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [consents, setConsents] = useState({ adult: false, agreement: false, confidentiality: false, esign: false })
  const [signatureError, setSignatureError] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [signed, setSigned] = useState<Signed | null>(null)
  const signatureRef = useRef<HTMLDivElement | null>(null)
  const noticeRef = useRef<HTMLDivElement | null>(null)
  const signedRef = useRef<HTMLDivElement | null>(null)

  // Keep this page out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    if (error) noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  useEffect(() => {
    if (signed) signedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [signed])

  const role = roleChoice === 'Other' ? (otherRole.trim() ? `Other: ${otherRole.trim()}` : '') : roleChoice
  const agreement = useMemo(() => buildAgreement(name, role), [name, role])
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    if (normalise(typed) !== normalise(name)) {
      setSignatureError('Your typed signature must match your full name above.')
      signatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSignatureError('')
    setError('')
    setSending(true)

    const honeypot = String(new FormData(form).get('website') ?? '')
    const { data, error: fnError } = await supabase.functions.invoke('sign-volunteer-agreement', {
      body: {
        website: honeypot,
        fullName: tidy(name),
        email: email.trim(),
        phone: phone.trim(),
        role,
        typedSignature: tidy(typed),
        signatureImage: image,
        consents,
        agreementVersion: AGREEMENT_VERSION,
        agreementText: agreementToText(agreement),
      },
    })
    setSending(false)

    if (fnError) {
      const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
      setError(body?.error ?? 'We could not record your signature. Please try again, or email info@haramberun.com.')
      return
    }

    const result = (data ?? {}) as { reference?: string; signedAt?: string; emailed?: boolean }
    setSigned({
      reference: result.reference ?? '',
      signedAt: result.signedAt ?? new Date().toISOString(),
      emailed: Boolean(result.emailed),
      name: tidy(name),
      email: email.trim(),
      role,
      typed: tidy(typed),
      image,
    })
  }

  const tick = (key: keyof typeof consents) => (event: { target: { checked: boolean } }) =>
    setConsents((current) => ({ ...current, [key]: event.target.checked }))

  return (
    <>
      <div className="print:hidden">
        <PageHero
          eyebrow="Volunteer agreement"
          title="Sign your volunteer agreement"
          copy="Read your agreement for the Startups Harambe Run 2026, then sign it online. It takes about two minutes, and a copy is emailed to you."
        />
      </div>

      <section className="bg-background pb-12 pt-8 sm:py-14 print:py-0">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            {signed ? (
              <div>
                <div ref={signedRef} className="mb-6 scroll-mt-28 bg-primary p-6 text-primary-foreground print:hidden" role="status">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Agreement signed</p>
                  <p className="mt-3 text-lg leading-8">
                    Thank you, {signed.name.split(/\s+/)[0]}. Your reference is <strong>{signed.reference || 'pending'}</strong>.{' '}
                    {signed.emailed
                      ? `A copy has been emailed to ${signed.email}.`
                      : 'We could not email you a copy, so please print or save this page and keep your reference.'}
                  </p>
                  <button type="button" onClick={() => window.print()} className="btn-gold mt-5">
                    <Printer className="mr-2 h-4 w-4" />
                    Print or save a copy
                  </button>
                </div>
                <Letter agreement={buildAgreement(signed.name, signed.role)}>
                  <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
                    <div>
                      <p className="label">Signed by the Volunteer</p>
                      {signed.image ? <img src={signed.image} alt="Drawn signature" className="mb-2 h-20 w-auto max-w-full" /> : null}
                      <p className="font-serif text-3xl italic leading-tight">{signed.typed}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {signed.name} · {signed.role}
                        <br />
                        Signed electronically on {when(signed.signedAt)} (EAT)
                        {signed.reference ? ` · Ref ${signed.reference}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="label">Issued by</p>
                      <p className="text-sm leading-6 text-muted-foreground">TechBuzz Hub, on behalf of the Startups Harambe Run 2026 Organising Committee</p>
                    </div>
                  </div>
                </Letter>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 gap-8">
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="agreement-website">Website</label>
                  <input id="agreement-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <Block title="1. Your details">
                  <Field label="Full name" id="a-name">
                    <input className="field" id="a-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                  </Field>
                  <Field label="Email address" id="a-email">
                    <input className="field" id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                  </Field>
                  <Field label="Phone number" id="a-phone">
                    <input
                      className="field"
                      id="a-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0781405551"
                      required
                    />
                  </Field>
                  <Field label="Your volunteer role" id="a-role">
                    <select className="field" id="a-role" value={roleChoice} onChange={(e) => setRoleChoice(e.target.value)} required>
                      <option value="" disabled>
                        Choose your role
                      </option>
                      {volunteerRoles.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                      <option>Other</option>
                    </select>
                  </Field>
                  {roleChoice === 'Other' ? (
                    <Field label="Please specify your role" id="a-role-other" wide>
                      <input className="field" id="a-role-other" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} required />
                    </Field>
                  ) : null}
                </Block>

                <Block title="2. Read the agreement" single>
                  <Letter agreement={agreement} />
                </Block>

                <Block title="3. Sign" single>
                  <div className="grid gap-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.adult} onChange={tick('adult')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">
                        I am 18 years or older.
                        <span className="mt-1 block text-sm text-muted-foreground">
                          Under 18? Please email info@haramberun.com so a parent or guardian can sign for you.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.agreement} onChange={tick('agreement')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">
                        I have read and understood this agreement, and I agree to carry out my role in line with it and with the Run’s Code of Conduct and volunteer safeguarding guidelines.
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={consents.confidentiality}
                        onChange={tick('confidentiality')}
                        required
                        className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
                      />
                      <span className="text-base leading-6">
                        I will keep non-public information I receive through the Run confidential, and I will tell the Organising Committee promptly about any conflict of interest.
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.esign} onChange={tick('esign')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">
                        I understand that typing my name below (and drawing my signature, if I choose to) is my electronic signature on this agreement, and that the time of signing and basic device details are recorded as evidence.
                      </span>
                    </label>
                  </div>

                  <div ref={signatureRef} className="mt-8 scroll-mt-28">
                    <label className="label" htmlFor="a-typed">
                      Type your full name as your signature
                    </label>
                    <input
                      className="field"
                      id="a-typed"
                      value={typed}
                      onChange={(e) => {
                        setTyped(e.target.value)
                        setSignatureError('')
                      }}
                      autoComplete="off"
                      placeholder={name.trim() || 'Your full name'}
                      required
                    />
                    {signatureError ? (
                      <p className="mt-2 text-sm font-bold text-accent" role="alert">
                        {signatureError}
                      </p>
                    ) : null}
                    <div className="mt-3 flex min-h-[4.5rem] items-center border border-dashed border-border bg-background px-4 py-3">
                      {typed.trim() ? (
                        <p className="font-serif text-3xl italic leading-tight text-foreground">{typed}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Your signature will appear here.</p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Date of signing: {today}</p>
                  </div>

                  <div className="mt-8">
                    <p className="label">Draw your signature (optional)</p>
                    <SignaturePad onChange={setImage} />
                  </div>

                  <p className="mt-8 text-sm leading-6 text-muted-foreground">
                    We use your details only to run the Run’s volunteer programme. We record your name, contact details, role, the time of signing and basic device details (IP address and browser) as evidence that you signed.
                  </p>
                </Block>

                {error ? (
                  <div ref={noticeRef} className="scroll-mt-28 bg-foreground p-6 text-lg leading-8 text-white" role="alert">
                    {error}
                  </div>
                ) : null}

                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                    {sending ? 'Signing…' : 'Sign agreement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function Block({ title, children, single = false }: { title: string; children: ReactNode; single?: boolean }) {
  return (
    <fieldset className="min-w-0 bg-white p-6 sm:p-8 print:hidden">
      <legend className="float-left mb-4 w-full font-ui text-xs font-black uppercase tracking-[0.2em] text-primary">{title}</legend>
      <div className={single ? 'clear-both' : 'clear-both grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'}>{children}</div>
    </fieldset>
  )
}

function Field({ label, id, wide = false, children }: { label: string; id: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

// The agreement as a letter. Also used for the signed copy, which is the only part that prints.
function Letter({ agreement, children }: { agreement: Agreement; children?: ReactNode }) {
  return (
    <article className="border border-border bg-white p-5 sm:p-8 print:border-0 print:p-0">
      <header className="border-b border-border pb-4">
        <p className="font-ui text-sm font-bold text-foreground">{agreement.letterhead[0]}</p>
        {agreement.letterhead.slice(1).map((line) => (
          <p key={line} className="text-sm leading-6 text-muted-foreground">
            {line}
          </p>
        ))}
      </header>

      <h2 className="mt-6 text-center font-display text-xl uppercase leading-tight sm:text-2xl">{agreement.title}</h2>
      <p className="mt-6 text-base leading-7 text-foreground/85">{agreement.intro}</p>

      {agreement.sections.map((section) => (
        <section key={section.heading} className="mt-6">
          <h3 className="font-ui text-xs font-black uppercase tracking-[0.18em] text-primary">{section.heading}</h3>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-base leading-7 text-foreground/85">
              {paragraph}
            </p>
          ))}
          {section.items ? (
            <ol className="mt-2 list-decimal space-y-2 pl-6 text-base leading-7 text-foreground/85">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : null}
          {section.note ? <p className="mt-3 text-base italic leading-7 text-foreground/75">{section.note}</p> : null}
        </section>
      ))}

      <p className="mt-6 text-base leading-7 text-foreground/85">{agreement.closing}</p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{agreement.issuedBy}</p>
      {children}
    </article>
  )
}

// Optional drawn signature. Fixed internal resolution, scaled to the box with CSS, so no resize handling is needed.
const PAD_WIDTH = 900
const PAD_HEIGHT = 260

function SignaturePad({ onChange }: { onChange: (png: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  const position = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    const { x, y } = position(event)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b2e22'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.01, y) // a tap leaves a dot
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    const { x, y } = position(event)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const end = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    setHasInk(true)
    onChange(event.currentTarget.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        aria-label="Signature drawing area"
        className="block aspect-[900/260] w-full cursor-crosshair touch-none border border-dashed border-border bg-background"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Use your finger or mouse. Your typed name above is what makes the signature valid.</p>
        <button type="button" onClick={clear} disabled={!hasInk} className="btn-outline px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">
          Clear
        </button>
      </div>
      {hasInk ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
          <Check className="h-4 w-4" strokeWidth={3} /> Signature captured
        </p>
      ) : null}
    </div>
  )
}
