// Receipt lookup. A receipt is shown only with its link key (from the SMS, email or success page)
// or with the phone number used to pay, so receipts cannot be opened by guessing references.
// Wrong details and unknown references get the same answer, so nothing reveals which references exist.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const NOT_FOUND = 'We could not find a receipt with those details. Check the reference and the phone number you paid with.'

// Keep in sync with receiptKey in blinkpay-callback/notify.ts.
async function receiptKey(reference: string) {
  const secret = Deno.env.get('RECEIPT_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`receipt:${reference}`)))
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(sig.slice(0, 8), (b) => alphabet[b % alphabet.length]).join('')
}

function same(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Ugandan numbers compared as 256XXXXXXXXX; other numbers by their digits.
function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}

const maskPhone = (msisdn: string) => {
  if (!msisdn) return ''
  if (/^256\d{9}$/.test(msisdn)) return `0${msisdn.slice(3, 5)}X XXX ${msisdn.slice(-3)}`
  return `+${msisdn.slice(0, 3)} XXX ${msisdn.slice(-3)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as { reference?: string; key?: string; phone?: string } | null
    const reference = String(body?.reference ?? '').trim().toUpperCase()
    const key = String(body?.key ?? '').trim().toLowerCase()
    const phone = normalisePhone(String(body?.phone ?? ''))
    if (!/^HR26-[0-9A-F]{8}$/.test(reference)) return json({ error: 'That does not look like a Harambe Run reference. It starts with HR26-.' }, 400)
    if (!key && phone.length < 10) return json({ error: 'Enter the phone number you paid with.', needPhone: true }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: p } = await supabase
      .from('payments')
      .select('reference, status, purpose, full_name, amount, msisdn, details, created_at, updated_at, collected_at')
      .eq('reference', reference)
      .maybeSingle()

    const allowed = Boolean(p) && (key ? same(key, await receiptKey(reference)) : same(phone, String(p!.msisdn ?? '')))
    if (!p || !allowed) {
      // Slow down anyone trying many combinations.
      await new Promise((r) => setTimeout(r, 700))
      return json({ error: NOT_FOUND, needPhone: !key }, 404)
    }

    const details = (p.details ?? {}) as Record<string, any>
    const callback = (details.callback ?? {}) as Record<string, any>
    return json({
      reference: p.reference,
      key: await receiptKey(p.reference),
      status: p.status,
      purpose: p.purpose,
      name: p.full_name,
      amount: p.amount,
      category: details.category ?? null,
      start: details.start ?? null,
      distance: details.distance ?? null,
      startup: details.startup_name ?? null,
      phone: maskPhone(p.msisdn),
      paidAt: p.status === 'SUCCESSFUL' ? (callback.completion_date ?? p.updated_at) : null,
      createdAt: p.created_at,
      method: details.method === 'card' ? 'card' : 'mobile',
      receiptNumber: callback.receipt_number ?? callback.transaction_id ?? null,
      collected: Boolean(p.collected_at),
      collectedAt: p.collected_at,
    })
  } catch (error) {
    console.error('payment-receipt error', error)
    return json({ error: 'Could not load the receipt. Please try again.' }, 500)
  }
})
