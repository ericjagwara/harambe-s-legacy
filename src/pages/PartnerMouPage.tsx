import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { asset } from '../data'
import { PageHero } from '../components/PageLayout'
import SignaturePad from '../components/SignaturePad'
import { supabase } from '@/integrations/supabase/client'
import { MOU_VERSION, buildMou, mouToText, type Mou } from '../data/partnerMou'

// Unlisted page: not linked from the menu or footer, and kept out of search engines
// (meta tag below plus an X-Robots-Tag header in netlify.toml). Partner hubs get the link directly.
// The partner signs by DRAWING their signature (a typed name is not accepted as a signature).
// Signatures are saved by the sign-partner-mou function (Supabase: partner_mous) and a signed PDF
// is emailed to the partner and to the team. TechBuzz Hub's signature (Mr. Keneth Twesigye) is already
// applied, undated, so the MOU is fully signed as soon as the partner signs.

const tidy = (value: string) => value.trim().replace(/\s+/g, ' ')
const MIN_INK = 600 // inked pixels needed on the 900x260 pad; a stray dot or short line is not a signature

type Signed = {
  reference: string
  signedAt: string
  emailed: boolean
  pdf: string | null
  hubName: string
  hubAddress: string
  repName: string
  repTitle: string
  email: string
  image: string
  date: Date
}

const when = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', { timeZone: 'Africa/Kampala', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PartnerMouPage() {
  const [hubName, setHubName] = useState('')
  const [hubAddress, setHubAddress] = useState('')
  const [repName, setRepName] = useState('')
  const [repTitle, setRepTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [auxName, setAuxName] = useState('')
  const [auxPhone, setAuxPhone] = useState('')
  const [auxEmail, setAuxEmail] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [consents, setConsents] = useState({ authority: false, agreement: false, esign: false })
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

  const todayDate = useMemo(() => new Date(), [])
  const today = todayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const mou = useMemo(() => buildMou({ hubName, hubAddress, date: todayDate }), [hubName, hubAddress, todayDate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    if (!image) {
      setSignatureError('Please draw your signature in the box. A typed name is not accepted.')
      signatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSignatureError('')
    setError('')
    setSending(true)

    const honeypot = String(new FormData(form).get('website') ?? '')
    const { data, error: fnError } = await supabase.functions.invoke('sign-partner-mou', {
      body: {
        website: honeypot,
        hubName: tidy(hubName),
        hubAddress: tidy(hubAddress),
        repName: tidy(repName),
        repTitle: tidy(repTitle),
        email: email.trim(),
        phone: phone.trim(),
        auxName: tidy(auxName),
        auxPhone: auxPhone.trim(),
        auxEmail: auxEmail.trim(),
        signatureImage: image,
        consents,
        mouVersion: MOU_VERSION,
        mouText: mouToText(mou),
      },
    })
    setSending(false)

    if (fnError) {
      const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
      setError(body?.error ?? 'We could not record your signature. Please try again, or email info@haramberun.com.')
      return
    }

    const result = (data ?? {}) as { reference?: string; signedAt?: string; emailed?: boolean; pdf?: string | null }
    setSigned({
      reference: result.reference ?? '',
      signedAt: result.signedAt ?? new Date().toISOString(),
      emailed: Boolean(result.emailed),
      pdf: result.pdf ?? null,
      hubName: tidy(hubName),
      hubAddress: tidy(hubAddress),
      repName: tidy(repName),
      repTitle: tidy(repTitle),
      email: email.trim(),
      image,
      date: todayDate,
    })
  }

  const tick = (key: keyof typeof consents) => (event: { target: { checked: boolean } }) =>
    setConsents((current) => ({ ...current, [key]: event.target.checked }))

  const downloadPdf = () => {
    if (!signed?.pdf) return
    const bytes = Uint8Array.from(atob(signed.pdf), (c) => c.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `Harambe-Run-Partner-MOU-${signed.reference}.pdf`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <>
      <div className="print:hidden">
        <PageHero
          eyebrow="Partner MOU"
          title="Sign the co-hosting MOU"
          copy="Read the Memorandum of Understanding for the Startups Harambe Run 2026, then sign it online with your own drawn signature. A signed PDF is emailed to you."
        />
      </div>

      <section className="bg-background pb-12 pt-8 sm:py-14 print:py-0">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            {signed ? (
              <div>
                <div ref={signedRef} className="mb-6 scroll-mt-28 bg-primary p-6 text-primary-foreground print:hidden" role="status">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">MOU signed</p>
                  <p className="mt-3 text-lg leading-8">
                    Thank you, {signed.repName.split(/\s+/)[0]}. Your reference is <strong>{signed.reference || 'pending'}</strong>.{' '}
                    {signed.emailed
                      ? `A signed copy has been emailed to ${signed.email}.`
                      : 'We could not email you a copy, so please download the signed PDF here and keep your reference.'}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {signed.pdf ? (
                      <button type="button" onClick={downloadPdf} className="btn-gold">
                        <Download className="mr-2 h-4 w-4" />
                        Download signed PDF
                      </button>
                    ) : null}
                  </div>
                </div>
                <Letter mou={buildMou({ hubName: signed.hubName, hubAddress: signed.hubAddress, date: signed.date })}>
                  <SignatureTable
                    mou={mou}
                    partner={{
                      title: signed.repTitle,
                      name: signed.repName,
                      image: signed.image,
                      date: when(signed.signedAt),
                      note: `Ref ${signed.reference}`,
                    }}
                    auxiliary={{ name: auxName, phone: auxPhone, email: auxEmail }}
                  />
                </Letter>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 gap-8">
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="mou-website">Website</label>
                  <input id="mou-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <Block title="1. Your hub">
                  <Field label="Name of innovation hub" id="m-hub">
                    <input className="field" id="m-hub" value={hubName} onChange={(e) => setHubName(e.target.value)} autoComplete="organization" required />
                  </Field>
                  <Field label="Physical address / institution" id="m-address">
                    <input className="field" id="m-address" value={hubAddress} onChange={(e) => setHubAddress(e.target.value)} autoComplete="street-address" required />
                  </Field>
                  <Field label="Your full name (hub representative)" id="m-rep">
                    <input className="field" id="m-rep" value={repName} onChange={(e) => setRepName(e.target.value)} autoComplete="name" required />
                  </Field>
                  <Field label="Your title at the hub" id="m-title">
                    <input className="field" id="m-title" value={repTitle} onChange={(e) => setRepTitle(e.target.value)} placeholder="e.g. Director" autoComplete="organization-title" required />
                  </Field>
                  <Field label="Your email address" id="m-email">
                    <input className="field" id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                  </Field>
                  <Field label="Your phone number" id="m-phone">
                    <input className="field" id="m-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0781405551" required />
                  </Field>
                </Block>

                <Block title="2. Hub in-charge person (Auxiliary Organising Committee Member)">
                  <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">
                    Under clause 5.1.6 the hub assigns an in-charge person to the Organising Committee. This can be you.
                  </p>
                  <Field label="Full name" id="m-aux">
                    <input className="field" id="m-aux" value={auxName} onChange={(e) => setAuxName(e.target.value)} required />
                  </Field>
                  <Field label="Phone number" id="m-aux-phone">
                    <input className="field" id="m-aux-phone" value={auxPhone} onChange={(e) => setAuxPhone(e.target.value)} inputMode="tel" required />
                  </Field>
                  <Field label="Email address" id="m-aux-email" wide>
                    <input className="field" id="m-aux-email" type="email" value={auxEmail} onChange={(e) => setAuxEmail(e.target.value)} required />
                  </Field>
                </Block>

                <Block title="3. Read the MOU" single>
                  <Letter mou={mou} />
                </Block>

                <Block title="4. Sign" single>
                  <div className="grid gap-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.authority} onChange={tick('authority')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">I am authorised to sign this MOU on behalf of the hub named above.</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.agreement} onChange={tick('agreement')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">I have read and understood this MOU, and the hub agrees to it, including the Guiding Principles it refers to.</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consents.esign} onChange={tick('esign')} required className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">
                        I understand that the signature I draw below is my electronic signature on this MOU, and that the time of signing and basic device details are recorded as evidence.
                      </span>
                    </label>
                  </div>

                  <div ref={signatureRef} className="mt-8 scroll-mt-28">
                    <p className="label">Draw your signature</p>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Sign with your finger, stylus or mouse, as you would on paper. A typed name does not count as a signature.
                    </p>
                    <SignaturePad
                      minInk={MIN_INK}
                      hint="Draw inside the box. Use Clear to start again."
                      onChange={(png) => {
                        setImage(png)
                        if (png) setSignatureError('')
                      }}
                    />
                    {signatureError ? (
                      <p className="mt-2 text-sm font-bold text-accent" role="alert">
                        {signatureError}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm text-muted-foreground">Date of signing: {today}</p>
                  </div>

                  <p className="mt-8 text-sm leading-6 text-muted-foreground">
                    We record the details above, your drawn signature, the time of signing and basic device details (IP address and browser) as evidence that you signed. TechBuzz Hub's signature is already applied, so the MOU takes effect on the date you sign it.
                  </p>
                </Block>

                {error ? (
                  <div ref={noticeRef} className="scroll-mt-28 bg-foreground p-6 text-lg leading-8 text-white" role="alert">
                    {error}
                  </div>
                ) : null}

                <div>
                  <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                    {sending ? 'Signing…' : 'Sign MOU'}
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

const indent = ['', 'pl-8', 'pl-16']

// The MOU as a letter. Also used for the signed copy, which is the only part that prints.
function Letter({ mou, children }: { mou: Mou; children?: ReactNode }) {
  return (
    <article className="border border-border bg-white p-5 sm:p-8 print:border-0 print:p-0">
      <header className="border-b border-border pb-4">
        <p className="font-ui text-sm font-bold text-foreground">{mou.letterhead[0]}</p>
        {mou.letterhead.slice(1).map((line) => (
          <p key={line} className="text-sm leading-6 text-muted-foreground">
            {line}
          </p>
        ))}
      </header>

      <h2 className="mt-6 text-center font-display text-xl uppercase leading-tight sm:text-2xl">{mou.title}</h2>
      <p className="mt-2 text-center text-base font-bold leading-7">{mou.subtitle}</p>
      <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">{mou.tagline}</p>
      <p className="mt-6 text-base leading-7 text-foreground/85">{mou.dateLine}</p>

      {mou.sections.map((section) => (
        <section key={section.no} className="mt-6">
          <h3 className="font-ui text-xs font-black uppercase tracking-[0.18em] text-primary">
            {section.no}. {section.heading}
          </h3>
          {section.clauses.map((clause, index) => (
            <p
              key={`${section.no}-${index}`}
              className={`mt-2 text-base leading-7 text-foreground/85 ${indent[clause.level ?? 0]} ${clause.no ? 'flex gap-3' : ''} ${
                clause.text === 'BETWEEN' || clause.text === 'AND' ? 'font-bold' : ''
              }`}
            >
              {clause.no ? (
                <>
                  <span className="shrink-0 font-bold text-foreground/60">{clause.no}</span>
                  <span>{clause.text}</span>
                </>
              ) : (
                clause.text
              )}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-6">
        <h3 className="font-ui text-xs font-black uppercase tracking-[0.18em] text-primary">13. Signatures</h3>
        <p className="mt-2 text-base leading-7 text-foreground/85">IN WITNESS WHEREOF, the Parties have signed this MOU on the dates indicated below.</p>
      </section>
      {children}
    </article>
  )
}

// Both parties' signature blocks. TechBuzz Hub's signature is pre-applied and undated.
function SignatureTable({
  mou,
  partner,
  auxiliary,
}: {
  mou: Mou
  partner: { title: string; name: string; image: string; date: string; note: string }
  auxiliary: { name: string; phone: string; email: string }
}) {
  return (
    <>
      <div className="mt-6 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <p className="label">For and on behalf of TechBuzz Hub</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {mou.hubCounterparty.name}
            <br />
            {mou.hubCounterparty.title}
          </p>
          <div className="mt-3 border-b border-foreground/40 pb-1">
            <img src={asset('ken-signature.png')} alt={`Signature of ${mou.hubCounterparty.name}`} className="h-16 w-auto max-w-full" />
          </div>
        </div>
        <div>
          <p className="label">For and on behalf of the Partner Hub</p>
          <img src={partner.image} alt="Drawn signature" className="mb-1 h-20 w-auto max-w-full" />
          <p className="border-t border-foreground/40 pt-2 text-sm leading-6 text-muted-foreground">
            {partner.name} · {partner.title}
            <br />
            Signed electronically on {partner.date} (EAT) · {partner.note}
          </p>
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
        <p className="label">Partner Hub in-charge person (Auxiliary Organising Committee Member)</p>
        {auxiliary.name} · {auxiliary.phone} · {auxiliary.email}
      </div>
    </>
  )
}
