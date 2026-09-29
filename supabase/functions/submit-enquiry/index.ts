// Saves sponsor, exhibitor, volunteer and contact forms into public.enquiries,
// emails the team (ENQUIRY_NOTIFY_EMAIL, default info@haramberun.com) and acknowledges the sender.
// Staff can also read everything in Supabase: Table Editor -> enquiries.
// Email secrets: RESEND_API_KEY, optional EMAIL_FROM. Email failures never lose the enquiry.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const TYPES = ['Sponsorship', 'Exhibition', 'Volunteer', 'Contact', 'Updates'] as const
type EnquiryType = (typeof TYPES)[number]

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const label = (key: string) => key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const ACK: Record<EnquiryType, string> = {
  Sponsorship: 'Thank you for your interest in sponsoring Startups Harambe Run 2026. Our partnerships team will contact you with the full proposal and next steps.',
  Exhibition: 'Thank you for your exhibition or discount listing request. We will confirm availability and send you an invoice.',
  Volunteer: 'Thank you for volunteering with Startups Harambe Run 2026. We will contact you with your role and a briefing before run day.',
  Contact: 'Thank you for contacting the Harambe Run team. We have received your message and will reply soon.',
  Updates: 'You are on the Harambe Run 2026 updates list. We will share route news, programme updates and fundraising milestones.',
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const key = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!key) return { status: 'not_configured' }
  const from = Deno.env.get('EMAIL_FROM')?.trim() || 'Harambe Run <info@haramberun.com>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    })
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    return res.ok ? { status: 'sent', id: body.id ?? null } : { status: 'error', http: res.status, summary: body.message ?? null }
  } catch (error) {
    return { status: 'error', response: String(error).slice(0, 200) }
  }
}

const wrap = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
<tr><td style="background:#00563a;padding:22px 28px"><p style="margin:0;color:#e1a524;font-size:11px;letter-spacing:3px;font-weight:bold;text-transform:uppercase">Startups Harambe Run 2026</p>
<p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;text-transform:uppercase">${esc(title)}</p></td></tr>
<tr><td style="padding:26px 28px;color:#0b2e22;font-size:15px;line-height:22px">${inner}</td></tr>
</table></td></tr></table></body></html>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as { type?: string; fields?: Record<string, unknown> } | null
    const type = String(body?.type ?? '') as EnquiryType
    const fields = body?.fields && typeof body.fields === 'object' ? body.fields : null
    if (!TYPES.includes(type) || !fields) return json({ error: 'Invalid request.' }, 400)

    // Hidden field that people never see; bots fill it in. Pretend it worked.
    if (text(fields.website, 200)) return json({ ok: true })

    const email = text(fields.email, 200)
    const name = text(fields.name, 160) || (type === 'Updates' ? email : '')
    const phone = text(fields.phone, 40)
    if (!name) return json({ error: 'Please enter your name.' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (type !== 'Contact' && type !== 'Updates' && phone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number.' }, 400)

    const details: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields).slice(0, 30)) {
      if (['name', 'email', 'phone', 'organisation', 'choice', 'website'].includes(key)) continue
      const v = text(value, 2000)
      if (v) details[key.slice(0, 60)] = v
    }
    const organisation = text(fields.organisation, 200) || null
    const choice = text(fields.choice, 200) || null

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: saved, error } = await supabase
      .from('enquiries')
      .insert({ type, name, organisation, email, phone: phone || null, choice, details })
      .select('id')
      .single()
    if (error) {
      console.error('enquiry insert failed', error)
      return json({ error: 'We could not save your details. Please try again, or email info@haramberun.com.' }, 500)
    }

    // Emails are best effort; the enquiry is already saved.
    const rows = [['Type', type], ['Name', name], ['Organisation', organisation], ['Email', email], ['Phone', phone], ['Choice', choice],
      ...Object.entries(details).map(([k, v]) => [label(k), v])]
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5b6b63;font-size:13px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-size:14px">${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
      .join('')
    const team = Deno.env.get('ENQUIRY_NOTIFY_EMAIL')?.trim() || 'info@haramberun.com'
    const [teamMail, ackMail] = await Promise.all([
      type === 'Updates' ? Promise.resolve({ status: 'skipped' }) : sendEmail(team, `New ${type.toLowerCase()} enquiry: ${organisation ?? name}`, wrap(`New ${type} enquiry`, `<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table><p style="margin:18px 0 0;font-size:13px;color:#5b6b63">Reply to this email to answer ${esc(name)} directly.</p>`), email),
      sendEmail(email, type === 'Updates' ? 'Welcome to Harambe Run 2026 updates' : 'We received your message: Harambe Run 2026', wrap(type === 'Updates' ? 'You are subscribed' : 'Message received', `<p style="margin:0">${type === 'Updates' ? 'Hello,' : `Hi ${esc(name.split(/\s+/)[0])},`}</p><p style="margin:14px 0 0">${esc(ACK[type])}</p><p style="margin:14px 0 0">Harambe. Run. Fund. Job Creation.</p><p style="margin:18px 0 0;font-size:13px;color:#5b6b63">Questions? Reply to this email or write to info@haramberun.com.</p>`), 'info@haramberun.com'),
    ])
    if ((teamMail.status !== 'sent' && teamMail.status !== 'skipped') || ackMail.status !== 'sent') console.warn('enquiry email not sent', saved?.id, teamMail, ackMail)
    await supabase.from('enquiries').update({ details: { ...details, _emails: { team: teamMail.status, ack: ackMail.status } } }).eq('id', saved.id)

    return json({ ok: true })
  } catch (error) {
    console.error('submit-enquiry error', error)
    return json({ error: 'Something went wrong. Please try again, or email info@haramberun.com.' }, 500)
  }
})
