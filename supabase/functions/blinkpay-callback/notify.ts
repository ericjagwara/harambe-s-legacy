// Confirmations sent once after a payment succeeds: an SMS through EgoSMS and an email through Resend.
// SMS secrets: EGOSMS_USERNAME, EGOSMS_PASSWORD (the API password), optional EGOSMS_SENDER_ID.
// Email secrets: RESEND_API_KEY, optional EMAIL_FROM (default "Harambe Run <info@haramberun.com>";
// the domain must be verified in Resend). Optional SITE_URL.
// A missing or failing provider never affects the payment; the outcome is saved on the payment record.

// deno-lint-ignore no-explicit-any
type Supabase = any

type Payment = {
  reference: string
  purpose: string
  full_name: string
  amount: number
  email?: string | null
  msisdn?: string | null
  details?: Record<string, unknown> | null
}

const EGOSMS_URL = 'https://comms.egosms.co/api/v1/json/'
const WHATSAPP_GROUP = 'chat.whatsapp.com/FKehPb60rdo9z9wW2shBr2'

function siteUrl() {
  return (Deno.env.get('SITE_URL') ?? 'https://haramberun.com').replace(/\/+$/, '')
}
const siteHost = () => siteUrl().replace(/^https?:\/\//, '')

// Receipt links carry a short key made from the reference with a server-only secret, so a receipt
// cannot be opened by guessing references. Keep in sync with payment-receipt, blinkpay-deposit
// and blinkpay-card-start.
export async function receiptKey(reference: string) {
  const secret = Deno.env.get('RECEIPT_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`receipt:${reference}`)))
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(sig.slice(0, 8), (b) => alphabet[b % alphabet.length]).join('')
}

const ugx = (amount: number) => `UGX ${Number(amount).toLocaleString('en-US')}`
const fit = (message: string) => (message.length <= 160 ? message : `${message.slice(0, 157)}...`)
const firstName = (p: Payment) => String(p.full_name).trim().split(/\s+/)[0]
const isRunner = (p: Payment) => p.purpose === 'Runner registration'
const isStudent = (p: Payment) => String(p.details?.category ?? '').toLowerCase().includes('student')

// ---------- SMS ----------

export async function buildMessages(p: Payment) {
  const first = firstName(p).slice(0, 10)
  const receipt = `Receipt: ${siteHost()}/receipt/${p.reference}?k=${await receiptKey(p.reference)}`
  if (isRunner(p)) {
    return [
      fit(`Harambe Run: ${first}, ${ugx(p.amount)} paid. Ref ${p.reference}. Bring this SMS${isStudent(p) ? ' + student ID' : ''} to kit pickup. ${receipt}`),
      fit(`Join the Harambe Run runners group: ${WHATSAPP_GROUP} Harambe. Run. Fund. Job Creation. Tell a friend!`),
    ]
  }
  return [fit(`Harambe Run: thank you ${first}! ${ugx(p.amount)} donation received. Ref ${p.reference}. ${receipt}`)]
}

async function sendSms(to: string, messages: string[]) {
  if (!/^\d{10,15}$/.test(to)) return { status: 'no_phone' }
  const username = Deno.env.get('EGOSMS_USERNAME')?.trim()
  const password = Deno.env.get('EGOSMS_PASSWORD')?.trim()
  if (!username || !password) return { status: 'not_configured' }
  const senderid = (Deno.env.get('EGOSMS_SENDER_ID')?.trim() || 'Egosms').slice(0, 11)

  try {
    const res = await fetch(EGOSMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'SendSms',
        userdata: { username, password },
        msgdata: messages.map((message) => ({ number: to, message, senderid, priority: '0' })),
      }),
    })
    const text = await res.text()
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = JSON.parse(text)
    } catch {
      return { status: 'error', http: res.status, response: text.slice(0, 300) }
    }
    const ok = String(parsed?.Status ?? '').toUpperCase() === 'OK'
    return {
      status: ok ? 'sent' : 'error',
      provider: 'egosms',
      cost: parsed?.Cost ?? null,
      message_id: parsed?.MsgFollowUpUniqueCode ?? null,
      summary: ok ? null : (parsed?.Message ?? null),
      parts: messages.length,
    }
  } catch (error) {
    return { status: 'error', response: String(error).slice(0, 300) }
  }
}

// ---------- Email ----------

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function row(label: string, value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return `<tr><td style="padding:8px 0;color:#5b6b63;font-size:13px;width:42%;vertical-align:top">${esc(label)}</td><td style="padding:8px 0;color:#0b2e22;font-size:15px;font-weight:bold">${esc(value)}</td></tr>`
}

export async function buildEmail(p: Payment) {
  const receiptUrl = `${siteUrl()}/receipt/${p.reference}?k=${await receiptKey(p.reference)}`
  const d = (p.details ?? {}) as Record<string, unknown>
  const runner = isRunner(p)
  const subject = runner
    ? `Your place at Harambe Run 2026 is confirmed (${p.reference})`
    : `Thank you for your donation to Harambe Run 2026 (${p.reference})`

  const intro = runner
    ? `Hi ${esc(firstName(p))}, your payment is received and your place at Harambe Run 2026 is confirmed. See you on Sunday 29 November 2026.`
    : `Hi ${esc(firstName(p))}, thank you for your donation. Your gift funds startup programmes in universities, catalytic funds for startups and angel investor training.`

  const pickup = runner
    ? `<p style="margin:24px 0 0;padding:16px;background:#f4f2ec;color:#0b2e22;font-size:15px;line-height:22px"><strong>Kit pickup:</strong> show this email, your receipt or the confirmation SMS${isStudent(p) ? ', together with your valid student ID,' : ''} at the kit pickup desk.</p>`
    : ''

  const whatsapp = runner
    ? `<p style="margin:24px 0 0;font-size:15px;line-height:22px;color:#0b2e22">Join the runners' WhatsApp group for updates and your start-point briefing: <a href="https://${WHATSAPP_GROUP}" style="color:#00563a;font-weight:bold">${WHATSAPP_GROUP}</a></p>`
    : ''

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ec;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#00563a;padding:24px 28px">
<p style="margin:0;color:#e1a524;font-size:11px;letter-spacing:3px;font-weight:bold;text-transform:uppercase">Startups Harambe Run 2026</p>
<p style="margin:10px 0 0;color:#ffffff;font-size:24px;font-weight:bold;text-transform:uppercase">${runner ? 'Registration confirmed' : 'Donation received'}</p>
</td></tr>
<tr><td style="padding:28px">
<p style="margin:0;font-size:15px;line-height:22px;color:#0b2e22">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #e3e0d6">
${row('Reference', p.reference)}
${row('Amount paid', ugx(p.amount))}
${row('Name', p.full_name)}
${runner ? row('Category', d.category) : ''}
${runner ? row('Starting point', d.start) : ''}
${runner ? row('Kit size', d.kit_size) : ''}
</table>
${pickup}
<p style="margin:24px 0 0"><a href="${receiptUrl}" style="display:inline-block;background:#00563a;color:#ffffff;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 20px">View or print your receipt</a></p>
<p style="margin:10px 0 0;font-size:13px;color:#5b6b63">Keep this email: the button above opens your receipt any time. You can also find it at ${esc(siteHost())}/receipt with reference ${esc(p.reference)} and the phone number you paid with.</p>
${whatsapp}
<p style="margin:28px 0 0;font-size:15px;line-height:22px;color:#0b2e22"><strong>Harambe. Run. Fund. Job Creation.</strong> Tell a friend!</p>
</td></tr>
<tr><td style="padding:18px 28px;background:#0b2e22;color:#c9d3ce;font-size:12px;line-height:18px">Startups Harambe Run 2026, organised by TechBuzz Hub and Startup Funding Vehicles, Kampala. Questions: reply to this email or write to info@haramberun.com.</td></tr>
</table></td></tr></table></body></html>`

  const text = [
    runner ? 'Registration confirmed' : 'Donation received',
    '',
    intro.replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
    '',
    `Reference: ${p.reference}`,
    `Amount paid: ${ugx(p.amount)}`,
    runner && d.category ? `Category: ${d.category}` : '',
    runner && d.start ? `Starting point: ${d.start}` : '',
    runner && d.kit_size ? `Kit size: ${d.kit_size}` : '',
    '',
    runner ? `Kit pickup: show this email, your receipt or the SMS${isStudent(p) ? ' and your student ID' : ''}.` : '',
    `Receipt: ${receiptUrl}`,
    runner ? `Runners' WhatsApp group: https://${WHATSAPP_GROUP}` : '',
    '',
    'Harambe. Run. Fund. Job Creation. Tell a friend!',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')

  return { subject, html, text }
}

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { status: 'no_email' }
  const key = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!key) return { status: 'not_configured' }
  const from = Deno.env.get('EMAIL_FROM')?.trim() || 'Harambe Run <info@haramberun.com>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: 'info@haramberun.com', subject, html, text }),
    })
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    return res.ok
      ? { status: 'sent', provider: 'resend', id: body.id ?? null }
      : { status: 'error', provider: 'resend', http: res.status, summary: body.message ?? null }
  } catch (error) {
    return { status: 'error', provider: 'resend', response: String(error).slice(0, 300) }
  }
}

// ---------- After a successful payment ----------

// Records the contribution (once), then sends the SMS and email (once).
export async function completePayment(supabase: Supabase, paymentId: string) {
  const { data: shouldNotify, error } = await supabase.rpc('complete_payment', { p_payment_id: paymentId })
  if (error) {
    console.error('complete_payment failed', error)
    return
  }
  if (!shouldNotify) return

  const { data: p } = await supabase.from('payments').select('*').eq('id', paymentId).single()
  if (!p) return
  const email = await buildEmail(p)
  const [sms, mail] = await Promise.all([
    sendSms(String(p.msisdn ?? ''), await buildMessages(p)),
    sendEmail(String(p.email ?? ''), email.subject, email.html, email.text),
  ])
  if (sms.status !== 'sent') console.warn('confirmation sms not sent', p.reference, sms)
  if (mail.status !== 'sent') console.warn('confirmation email not sent', p.reference, mail)
  const at = new Date().toISOString()
  await supabase
    .from('payments')
    .update({ details: { ...(p.details ?? {}), sms: { ...sms, at }, email: { ...mail, at } } })
    .eq('id', paymentId)
}
