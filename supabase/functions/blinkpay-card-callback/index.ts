// Receives Blink's card payment notification (status_notification_url from blinkpay-card-start).
// Blink does not sign these notifications, so each payment carries a one-time token in its
// callback URL, and a SUCCESS only counts if the amount matches what we asked for.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { completePayment } from './notify.ts'

const ok = () => new Response('ok', { headers: corsHeaders })

// Blink may post JSON or a form; accept both, plus query parameters.
async function readPayload(req: Request, url: URL) {
  const payload: Record<string, unknown> = {}
  url.searchParams.forEach((value, key) => {
    if (key !== 'token') payload[key] = value
  })
  const text = await req.text().catch(() => '')
  if (!text) return payload
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') return { ...payload, ...parsed }
  } catch {
    new URLSearchParams(text).forEach((value, key) => {
      payload[key] = value
    })
  }
  return payload
}

function sameToken(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function mapStatus(raw: string) {
  const s = raw.toUpperCase()
  if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID'].includes(s)) return 'SUCCESSFUL'
  if (['FAILED', 'CANCELLED', 'CANCELED', 'DECLINED', 'EXPIRED', 'REJECTED'].includes(s)) return 'FAILED'
  return 'PENDING'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok()

  try {
    const url = new URL(req.url)
    const reference = String(url.searchParams.get('ref') ?? '').trim().toUpperCase()
    const token = String(url.searchParams.get('token') ?? '')
    const payload = await readPayload(req, url)
    console.log('card callback', reference, JSON.stringify(payload).slice(0, 500))
    if (!/^HR26-[0-9A-F]{8}$/.test(reference)) return ok()

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: payment } = await supabase.from('payments').select('*').eq('reference', reference).maybeSingle()
    if (!payment) return ok()

    const details = (payment.details ?? {}) as Record<string, unknown>
    if (details.method !== 'card' || !sameToken(token, String(details.card_token ?? ''))) {
      console.warn('card callback rejected: bad token', reference)
      return ok()
    }

    let status = mapStatus(String(payload.status ?? ''))
    const reported = Number(String(payload.amount ?? '').replace(/[^\d.]/g, ''))
    let review: string | null = null
    if (status === 'SUCCESSFUL' && payload.amount !== undefined && Math.round(reported) !== Number(payment.amount)) {
      // Do not count a payment whose amount does not match; leave it for a person to check.
      review = `Blink reported UGX ${payload.amount}, expected UGX ${payment.amount}`
      status = 'PENDING'
      console.warn('card callback amount mismatch', reference, review)
    }

    // A payment that already succeeded never moves back to another status.
    const nextStatus = payment.status === 'SUCCESSFUL' ? 'SUCCESSFUL' : status
    const transactionId = String(payload.transaction_id ?? payload.transactionId ?? '').trim()
    await supabase
      .from('payments')
      .update({
        status: nextStatus,
        reference_code: transactionId || payment.reference_code,
        details: { ...details, callback: payload, ...(review ? { review } : {}) },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (nextStatus === 'SUCCESSFUL') await completePayment(supabase, payment.id)
    return ok()
  } catch (error) {
    console.error('blinkpay-card-callback error', error)
    return ok()
  }
})
