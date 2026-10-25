// "I will be there" poster. One action:
//   send  records who made a poster and emails them the finished poster (a JPEG made in their browser).
// The visitor has already downloaded the poster by the time this runs. Table: posters.
// Email secrets: RESEND_API_KEY, optional EMAIL_FROM. Limits per email and per connection stop it being used to spam.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200
const MAX_IMAGE = 5_000_000

async function sendEmail(to: string, subject: string, html: string, plain: string, attachments?: Array<{ filename: string; content: string }>) {
  const key = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!key) return { status: 'not_configured' }
  const from = Deno.env.get('EMAIL_FROM')?.trim() || 'Harambe Run <info@haramberun.com>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text: plain, reply_to: 'info@haramberun.com', ...(attachments?.length ? { attachments } : {}) }),
    })
    return res.ok ? { status: 'sent' } : { status: 'error', http: res.status }
  } catch {
    return { status: 'error' }
  }
}

const wrap = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff">
<tr><td style="background:#00563a;padding:22px 28px"><p style="margin:0;color:#e1a524;font-size:11px;letter-spacing:3px;font-weight:bold;text-transform:uppercase">Startups Harambe Run 2026</p>
<p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;text-transform:uppercase">${esc(title)}</p></td></tr>
<tr><td style="padding:26px 28px;color:#0b2e22;font-size:15px;line-height:22px">${inner}</td></tr>
</table></td></tr></table></body></html>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || String(body.action ?? '') !== 'send') return json({ error: 'Invalid request.' }, 400)

    const email = text(body.email, 200).toLowerCase()
    const name = text(body.name, 40).replace(/\s+/g, ' ')
    const activity = text(body.activity, 80)
    const template = text(body.template, 20)
    const tagline = text(body.tagline, 100)
    const image = String(body.image ?? '')
    if (!emailOk(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (name.length < 2) return json({ error: 'Please add your name.' }, 400)
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image) || image.length < 5000 || image.length > MAX_IMAGE) {
      return json({ error: 'We could not read your poster. Please refresh the page and try again.' }, 400)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null

    const hourAgo = new Date(Date.now() - 3600_000).toISOString()
    const { count: byEmail } = await supabase.from('posters').select('id', { count: 'exact', head: true }).ilike('email', email).gte('created_at', hourAgo)
    if ((byEmail ?? 0) >= 3) return json({ error: 'We have already emailed this address a few times. Your poster has downloaded, so you are all set.' }, 429)
    if (ip) {
      const { count: byIp } = await supabase.from('posters').select('id', { count: 'exact', head: true }).eq('ip_address', ip).gte('created_at', hourAgo)
      if ((byIp ?? 0) >= 10) return json({ error: 'Too many emails from this connection just now. Your poster has downloaded, so you are all set.' }, 429)
    }

    const first = name.split(' ')[0]
    const reference = `PS26-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const mail = await sendEmail(
      email,
      `Your “I’ll be there” poster, ${first}`,
      wrap(
        'See you there!',
        `<p style="margin:0">Hi ${esc(first)},</p><p style="margin:14px 0 0">Your poster is attached. Share it, tag a friend and bring them along to the Startups Harambe Run on <strong>Sunday 29 November 2026</strong>.</p><p style="margin:14px 0 0">Haven’t got your kit yet? <a href="https://haramberun.com/register?for=run" style="color:#00563a;font-weight:bold">Get it here</a>.</p><p style="margin:22px 0 0;font-size:13px;color:#5b6b63">#StartupsHarambeRun · haramberun.com</p>`,
      ),
      `Hi ${first}, your poster is attached. See you at the Startups Harambe Run on Sunday 29 November 2026! https://haramberun.com`,
      [{ filename: `Harambe-Run-2026-poster-${reference}.jpg`, content: image.split(',')[1] }],
    )
    const { error } = await supabase.from('posters').insert({ reference, name, email, activity, template, tagline, emailed: mail.status === 'sent', ip_address: ip })
    if (error) console.error('poster insert failed', error)
    return json({ ok: true, reference, emailed: mail.status === 'sent' })
  } catch (error) {
    console.error('poster error', error)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})
