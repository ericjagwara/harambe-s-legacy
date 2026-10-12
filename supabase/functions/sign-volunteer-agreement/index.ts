// Records a volunteer's digitally signed agreement (unlisted page /volunteer-agreement) in
// public.volunteer_agreements, then emails a copy to the volunteer and a notice to the team
// (ENQUIRY_NOTIFY_EMAIL, default info@haramberun.com). Staff can read every record in Supabase:
// Table Editor -> volunteer_agreements.
// Email secrets: RESEND_API_KEY, optional EMAIL_FROM. Email failures never lose the signature:
// it is saved first, and the outcome of each email is stored on the record.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const normalise = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

const MAX_SIGNATURE_IMAGE = 250_000 // characters of base64, roughly 185 KB
const MAX_PER_IP_PER_10_MIN = 30 // generous: a whole briefing session may sign on one campus Wi-Fi

type Attachment = { filename: string; content: string }

async function sendEmail(to: string, subject: string, html: string, plain: string, replyTo: string, attachments?: Attachment[]) {
  const key = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!key) return { status: 'not_configured' }
  const from = Deno.env.get('EMAIL_FROM')?.trim() || 'Harambe Run <info@haramberun.com>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: plain,
        reply_to: replyTo,
        ...(attachments?.length ? { attachments } : {}),
      }),
    })
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return res.ok ? { status: 'sent', id: body.id ?? null } : { status: 'error', http: res.status, summary: body.message ?? null }
  } catch (error) {
    return { status: 'error', response: String(error).slice(0, 200) }
  }
}

const wrap = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff">
<tr><td style="background:#00563a;padding:22px 28px"><p style="margin:0;color:#e1a524;font-size:11px;letter-spacing:3px;font-weight:bold;text-transform:uppercase">Startups Harambe Run 2026</p>
<p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;text-transform:uppercase">${esc(title)}</p></td></tr>
<tr><td style="padding:26px 28px;color:#0b2e22;font-size:15px;line-height:22px">${inner}</td></tr>
</table></td></tr></table></body></html>`

const row = (label: string, value: unknown) =>
  value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#5b6b63;font-size:13px;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:14px;font-weight:bold">${esc(value)}</td></tr>`
    : ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return json({ error: 'Invalid request.' }, 400)

    // Hidden field that people never see; bots fill it in. Pretend it worked.
    if (text(body.website, 200)) return json({ ok: true })

    const fullName = text(body.fullName, 160).replace(/\s+/g, ' ')
    const email = text(body.email, 200)
    const phone = text(body.phone, 40)
    const role = text(body.role, 200)
    const typedSignature = text(body.typedSignature, 160).replace(/\s+/g, ' ')
    const agreementVersion = text(body.agreementVersion, 40)
    const agreementText = String(body.agreementText ?? '').trim()
    const consents = (body.consents && typeof body.consents === 'object' ? body.consents : {}) as Record<string, unknown>

    if (fullName.length < 3) return json({ error: 'Please enter your full name.' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (phone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number.' }, 400)
    if (!role) return json({ error: 'Please choose your volunteer role.' }, 400)
    if (normalise(typedSignature) !== normalise(fullName)) {
      return json({ error: 'Your typed signature must match your full name.' }, 400)
    }
    if (!/^[\w.-]{1,40}$/.test(agreementVersion)) return json({ error: 'Invalid request.' }, 400)
    if (agreementText.length < 200 || agreementText.length > 30_000) return json({ error: 'Invalid request.' }, 400)
    if (!(consents.adult === true && consents.agreement === true && consents.confidentiality === true && consents.esign === true)) {
      return json({ error: 'Please tick every box to confirm and sign the agreement.' }, 400)
    }

    // Optional drawn signature: a PNG data URL, size-limited.
    let signatureImage: string | null = null
    if (body.signatureImage) {
      const image = String(body.signatureImage)
      if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'The drawn signature could not be read. Please clear it and draw again.' }, 400)
      if (image.length > MAX_SIGNATURE_IMAGE) return json({ error: 'The drawn signature is too large. Please clear it and draw a simpler one.' }, 400)
      signatureImage = image
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const userAgent = text(req.headers.get('user-agent'), 300) || null

    if (ip) {
      const since = new Date(Date.now() - 10 * 60_000).toISOString()
      const { count } = await supabase
        .from('volunteer_agreements')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', since)
      if ((count ?? 0) >= MAX_PER_IP_PER_10_MIN) {
        return json({ error: 'Too many signatures from this connection just now. Please try again in a few minutes.' }, 429)
      }
    }

    const reference = `VA26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const signedAt = new Date().toISOString()
    const { data: saved, error } = await supabase
      .from('volunteer_agreements')
      .insert({
        reference,
        full_name: fullName,
        email,
        phone,
        role,
        typed_signature: typedSignature,
        signature_image: signatureImage,
        agreement_version: agreementVersion,
        agreement_text: agreementText,
        consents: { adult: true, agreement: true, confidentiality: true, esign: true },
        signed_at: signedAt,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505' && String(error.message).includes('email_version')) {
        return json({ error: 'This email address has already signed the current agreement. If you need to correct your details, email info@haramberun.com.' }, 409)
      }
      console.error('volunteer agreement insert failed', error)
      return json({ error: 'We could not record your signature. Please try again, or email info@haramberun.com.' }, 500)
    }

    // Emails are best effort; the signature is already saved.
    const when = `${new Date(signedAt).toLocaleString('en-GB', {
      timeZone: 'Africa/Kampala',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} (EAT)`
    const first = fullName.split(' ')[0]
    const attachments: Attachment[] | undefined = signatureImage ? [{ filename: 'signature.png', content: signatureImage.split(',')[1] }] : undefined

    const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Name', fullName)}${row('Role', role)}${row('Signed', when)}${row('Agreement version', agreementVersion)}</table>`

    const volunteerHtml = wrap(
      'Agreement signed',
      `<p style="margin:0">Hi ${esc(first)},</p>
<p style="margin:14px 0 0">Thank you for volunteering with Startups Harambe Run 2026. This email is your copy of the volunteer agreement you signed electronically. Please keep it.</p>
${details}
<p style="margin:22px 0 8px;font-weight:bold">Agreement you signed</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:20px;border:1px solid #e3e0d6;background:#faf9f5;padding:14px">${esc(agreementText)}</div>
<p style="margin:20px 0 4px;font-size:13px;color:#5b6b63">Your signature</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic">${esc(typedSignature)}</p>
${signatureImage ? '<p style="margin:6px 0 0;font-size:13px;color:#5b6b63">Your drawn signature is attached as signature.png.</p>' : ''}
<p style="margin:22px 0 0;font-size:13px;color:#5b6b63">Questions? Reply to this email or write to info@haramberun.com.</p>`,
    )
    const volunteerText = [
      'Your signed volunteer agreement: Startups Harambe Run 2026',
      '',
      `Reference: ${reference}`,
      `Name: ${fullName}`,
      `Role: ${role}`,
      `Signed: ${when}`,
      `Agreement version: ${agreementVersion}`,
      '',
      agreementText,
      '',
      `Signature: ${typedSignature}`,
    ].join('\n')

    const teamHtml = wrap(
      'Volunteer agreement signed',
      `<p style="margin:0">${esc(fullName)} signed the volunteer agreement.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Name', fullName)}${row('Role', role)}${row('Email', email)}${row('Phone', phone)}${row('Signed', when)}${row('Agreement version', agreementVersion)}${row('IP address', ip)}</table>
<p style="margin:18px 0 0;font-size:13px;color:#5b6b63">The full signed text is stored with the record in Supabase (volunteer_agreements).${signatureImage ? ' Their drawn signature is attached.' : ''} Reply to this email to contact ${esc(first)} directly.</p>`,
    )
    const teamText = `${fullName} signed the volunteer agreement.\nReference: ${reference}\nRole: ${role}\nEmail: ${email}\nPhone: ${phone}\nSigned: ${when}\nVersion: ${agreementVersion}`

    const team = Deno.env.get('ENQUIRY_NOTIFY_EMAIL')?.trim() || 'info@haramberun.com'
    const [volunteerMail, teamMail] = await Promise.all([
      sendEmail(email, `Your signed volunteer agreement: Harambe Run 2026 (${reference})`, volunteerHtml, volunteerText, 'info@haramberun.com', attachments),
      sendEmail(team, `Volunteer agreement signed: ${fullName} (${role})`, teamHtml, teamText, email, attachments),
    ])
    if (volunteerMail.status !== 'sent' || teamMail.status !== 'sent') {
      console.warn('volunteer agreement email not sent', reference, volunteerMail, teamMail)
    }
    await supabase
      .from('volunteer_agreements')
      .update({ emails: { volunteer: volunteerMail.status, team: teamMail.status } })
      .eq('id', saved.id)

    return json({ ok: true, reference, signedAt, emailed: volunteerMail.status === 'sent' })
  } catch (error) {
    console.error('sign-volunteer-agreement error', error)
    return json({ error: 'Something went wrong. Please try again, or email info@haramberun.com.' }, 500)
  }
})
