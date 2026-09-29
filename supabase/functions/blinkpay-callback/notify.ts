// Confirmation SMS sent after a payment succeeds, through EgoSMS (https://comms.egosms.co).
// Secrets: EGOSMS_USERNAME, EGOSMS_PASSWORD (the API password, not the website login),
// optional EGOSMS_SENDER_ID (approved sender name, max 11 characters) and SITE_URL.
// If the EgoSMS secrets are not set, nothing is sent and the payment is unaffected.
// EgoSMS allows 160 characters per message, so runners get two short messages.

// deno-lint-ignore no-explicit-any
type Supabase = any

const EGOSMS_URL = 'https://comms.egosms.co/api/v1/json/'
const WHATSAPP_GROUP = 'chat.whatsapp.com/FKehPb60rdo9z9wW2shBr2'

function siteHost() {
  const url = Deno.env.get('SITE_URL') ?? 'https://haramberun.com'
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

const ugx = (amount: number) => `UGX ${Number(amount).toLocaleString('en-US')}`
const fit = (message: string) => (message.length <= 160 ? message : `${message.slice(0, 157)}...`)

export function buildMessages(p: {
  reference: string
  purpose: string
  full_name: string
  amount: number
  details?: Record<string, unknown> | null
}) {
  const first = String(p.full_name).trim().split(/\s+/)[0].slice(0, 12)
  const receipt = `Receipt: ${siteHost()}/receipt/${p.reference}`
  if (p.purpose === 'Runner registration') {
    const student = String(p.details?.category ?? '').toLowerCase().includes('student')
    return [
      fit(`Harambe Run: ${first}, ${ugx(p.amount)} paid. Ref ${p.reference}. Show this SMS${student ? ' + student ID' : ''} at kit pickup. ${receipt}`),
      fit(`Join the Harambe Run runners group: ${WHATSAPP_GROUP} Harambe. Run. Fund. Job Creation. Tell a friend!`),
    ]
  }
  return [fit(`Harambe Run: thank you ${first}! ${ugx(p.amount)} donation received. Ref ${p.reference}. ${receipt} Tell a friend!`)]
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

// Records the contribution (once) and sends the SMS (once) for a successful payment.
export async function completePayment(supabase: Supabase, paymentId: string) {
  const { data: shouldNotify, error } = await supabase.rpc('complete_payment', { p_payment_id: paymentId })
  if (error) {
    console.error('complete_payment failed', error)
    return
  }
  if (!shouldNotify) return

  const { data: p } = await supabase.from('payments').select('*').eq('id', paymentId).single()
  if (!p) return
  const messages = buildMessages(p)
  const result = await sendSms(p.msisdn, messages)
  if (result.status !== 'sent') console.warn('confirmation sms not sent', p.reference, result)
  await supabase
    .from('payments')
    .update({ details: { ...(p.details ?? {}), sms: { ...result, at: new Date().toISOString() } } })
    .eq('id', paymentId)
}
