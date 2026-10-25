import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { PageHero } from '../components/PageLayout'
import { supabase } from '@/integrations/supabase/client'
import { asset } from '../data'
import { ACTIVITIES, TAGLINES, TEMPLATES, drawPoster, loadFonts, loadImage, posterBlob, type PosterTemplate } from '../lib/posterCanvas'

// "I will be there" poster. Built in the visitor's browser (their photo is not uploaded). To download it they confirm
// their email with a short code; the finished poster is then also emailed to them (Supabase function: poster).

async function functionError(error: unknown, fallback: string) {
  const context = (error as { context?: Response } | null)?.context
  const body = await context?.json?.().catch(() => null)
  return typeof body?.error === 'string' ? body.error : fallback
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

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 bg-white p-6 sm:p-8">
      <legend className="float-left mb-4 w-full font-ui text-xs font-black uppercase tracking-[0.2em] text-primary">{title}</legend>
      <div className="clear-both grid grid-cols-1 gap-4 sm:gap-5">{children}</div>
    </fieldset>
  )
}

export default function PosterPage() {
  const [template, setTemplate] = useState<PosterTemplate>('green')
  const [name, setName] = useState('')
  const [activity, setActivity] = useState('5 km')
  const [tagline, setTagline] = useState(TAGLINES[0])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [stage, setStage] = useState<'edit' | 'code' | 'done'>('edit')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [emailed, setEmailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const photoRef = useRef<HTMLImageElement | null>(null)
  const logoRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(0)

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    let alive = true
    Promise.all([loadFonts(), loadImage(asset('brand-logo-harambe-run.webp')).then((img) => (logoRef.current = img)).catch(() => null)]).then(() => {
      if (alive) setReady((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!photoUrl) {
      photoRef.current = null
      setReady((n) => n + 1)
      return
    }
    let alive = true
    loadImage(photoUrl)
      .then((img) => {
        if (!alive) return
        photoRef.current = img
        setReady((n) => n + 1)
      })
      .catch(() => setPhotoError('We could not read that image. Please try a JPG or PNG.'))
    return () => {
      alive = false
    }
  }, [photoUrl])

  useEffect(() => {
    if (canvasRef.current) drawPoster(canvasRef.current, { template, name, activity, tagline, photo: photoRef.current, logo: logoRef.current })
  }, [template, name, activity, tagline, ready])

  const onPhoto = (file: File | undefined) => {
    setPhotoError('')
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file.')
    if (file.size > 10 * 1024 * 1024) return setPhotoError('That photo is over 10 MB. Please choose a smaller one.')
    setPhotoUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
  }

  const label = useMemo(() => ACTIVITIES.find((a) => a.value === activity)?.label ?? '', [activity])

  const sendCode = async () => {
    setError('')
    setInfo('')
    if (name.trim().length < 2) return setError('Please add your name first.')
    if (!photoRef.current) return setError('Please add your photo first.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (!consent) return setError('Please tick the box to continue.')
    setBusy(true)
    const { error: fnError } = await supabase.functions.invoke('poster', { body: { action: 'send-code', email: email.trim() } })
    setBusy(false)
    if (fnError) return setError(await functionError(fnError, 'We could not send the code. Please try again.'))
    setStage('code')
    setInfo(`We sent a 6-digit code to ${email.trim()}. It works for 10 minutes.`)
  }

  const verify = async () => {
    setError('')
    if (!canvasRef.current) return
    setBusy(true)
    const image = canvasRef.current.toDataURL('image/jpeg', 0.9)
    const { data, error: fnError } = await supabase.functions.invoke('poster', {
      body: { action: 'verify', email: email.trim(), code: code.trim(), name: name.trim(), activity: label, template, tagline, image },
    })
    setBusy(false)
    if (fnError) return setError(await functionError(fnError, 'That did not work. Please check the code and try again.'))
    setEmailed(Boolean((data as { emailed?: boolean })?.emailed))
    setStage('done')
  }

  const download = async () => {
    if (!canvasRef.current) return
    const blob = await posterBlob(canvasRef.current, 'image/png')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Harambe-Run-2026-${(name.trim() || 'poster').replace(/[^a-z0-9]+/gi, '-')}.png`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const locked = stage !== 'edit'
  const share = `I'll be there at the Startups Harambe Run on Sunday 29 November! Join me: https://haramberun.com #StartupsHarambeRun`

  return (
    <>
      <PageHero
        eyebrow="I'll be there"
        title="Make your Harambe Run poster"
        copy="Pick a look, add your photo and tell everyone how you'll show up. Then share it and bring a friend."
      />
      <section className="bg-background pb-14 pt-8 sm:py-14">
        <div className="container-site">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <div className="grid gap-6">
              <Block title="1. Pick a look">
                <div className="flex flex-wrap gap-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      disabled={locked}
                      onClick={() => setTemplate(t.key)}
                      className={`flex items-center gap-3 border px-4 py-3 font-ui text-xs font-black uppercase tracking-[0.14em] ${template === t.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white'}`}
                      aria-pressed={template === t.key}
                    >
                      <span className="h-5 w-5 rounded-full border border-black/20" style={{ background: t.swatch }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </Block>

              <Block title="2. Your details">
                <Field label="Your name" id="p-name">
                  <input className="field" id="p-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} disabled={locked} autoComplete="name" />
                </Field>
                <Field label="How will you be there?" id="p-act">
                  <select className="field" id="p-act" value={activity} onChange={(e) => setActivity(e.target.value)} disabled={locked}>
                    {ACTIVITIES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Your message" id="p-tag">
                  <select className="field" id="p-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} disabled={locked}>
                    {TAGLINES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </Block>

              <Block title="3. Your photo">
                <Field label="Upload a photo (a smiling face works best)" id="p-photo">
                  <input className="field" id="p-photo" type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={locked} />
                  <p className="mt-2 text-sm text-muted-foreground">Your photo stays on your device while you design. Max 10 MB.</p>
                  {photoError ? <p className="mt-2 text-sm font-bold text-accent">{photoError}</p> : null}
                </Field>
              </Block>

              <Block title="4. Get your poster">
                {stage === 'edit' ? (
                  <>
                    <Field label="Your email address" id="p-email">
                      <input className="field" id="p-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <p className="mt-2 text-sm text-muted-foreground">We email a short code to confirm it is you, then send your finished poster.</p>
                    </Field>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />
                      <span className="text-base leading-6">
                        I am happy for Harambe Run to keep my name and email and email me this poster. We do not keep your photo.
                      </span>
                    </label>
                    <div>
                      <button type="button" className="btn-primary w-full sm:w-auto" onClick={sendCode} disabled={busy}>
                        {busy ? 'Sending…' : 'Email me a code'}
                      </button>
                    </div>
                  </>
                ) : null}

                {stage === 'code' ? (
                  <>
                    <Field label="Enter the 6-digit code" id="p-code">
                      <input className="field sm:max-w-xs" id="p-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                    </Field>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" className="btn-primary" onClick={verify} disabled={busy || code.length !== 6}>
                        {busy ? 'Checking…' : 'Get my poster'}
                      </button>
                      <button type="button" className="font-ui text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4" onClick={() => { setStage('edit'); setCode(''); setInfo('') }}>
                        Use a different email
                      </button>
                    </div>
                  </>
                ) : null}

                {stage === 'done' ? (
                  <div className="grid gap-4">
                    <p className="text-lg leading-8">
                      You are in!{' '}
                      {emailed ? `We have emailed your poster to ${email.trim()}.` : 'Download your poster below.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="btn-gold" onClick={download}>
                        <Download className="mr-2 h-4 w-4" />
                        Download poster
                      </button>
                      <a className="btn-primary" href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer">
                        Share on WhatsApp
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">Post it with #StartupsHarambeRun and tag a friend to run with you. Ready to run? <a className="font-bold underline underline-offset-4" href="/register?for=run">Get your kit</a>.</p>
                  </div>
                ) : null}

                {info ? <p className="text-base leading-7 text-foreground/80">{info}</p> : null}
                {error ? (
                  <p className="bg-foreground p-4 text-base leading-7 text-white" role="alert">
                    {error}
                  </p>
                ) : null}
              </Block>
            </div>

            <div className="lg:sticky lg:top-28">
              <p className="label mb-3">Your poster</p>
              <canvas ref={canvasRef} className="block w-full border border-border bg-white shadow-[0_1px_24px_-12px_hsl(var(--foreground)/0.35)]" style={{ aspectRatio: '1 / 1' }} aria-label="Poster preview" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
