// Starts a card payment on Blink's hosted payment page (BlinkPay VISA API, /web/payment/start/).
// The customer types their card on Blink's page, never on ours. This function saves the payment,
// signs the request with the merchant password (which never leaves the server) and returns the
// fields the browser posts to Blink.
// Secrets: BLINKPAY_CARD_MERCHANT_ID, BLINKPAY_CARD_MERCHANT_PASSWORD,
// optional BLINKPAY_CARD_URL (otherwise derived from BLINKPAY_API_URL) and SITE_URL.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Keep in sync with runnerCategories in src/sections/Registration.tsx and blinkpay-deposit.
const RUNNER_PRICES: Record<string, number> = {
  'Student runner, UGX 15,000': 15000,
  'General public runner, UGX 30,000': 30000,
  // Old labels from the site before the price change, charged at the new prices.
  'Student runner, UGX 30,000': 15000,
  'General public runner, UGX 50,000': 30000,
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

function cardStartUrl() {
  const explicit = Deno.env.get('BLINKPAY_CARD_URL')
  if (explicit) return explicit
  const api = Deno.env.get('BLINKPAY_API_URL') ?? 'https://payments-dev.blink.co.ug/api/'
  return new URL('/web/payment/start/', api).toString()
}

// Ugandan numbers become 256XXXXXXXXX; other international numbers are kept as digits.
function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}

async function sha1Hex(text: string) {
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Blink's form fields are plain text; keep them free of the '|' used in the signature.
const clean = (value: string, max: number) => value.replace(/[|\r\n]/g, ' ').trim().slice(0, max)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const merchantId = Deno.env.get('BLINKPAY_CARD_MERCHANT_ID')?.trim()
    const merchantPassword = Deno.env.get('BLINKPAY_CARD_MERCHANT_PASSWORD')?.trim()
    if (!merchantId || !merchantPassword) {
      console.error('card payments not configured: missing BLINKPAY_CARD_MERCHANT_ID or BLINKPAY_CARD_MERCHANT_PASSWORD')
      return json({ error: 'Card payments are not available right now. Please pay with mobile money.' }, 503)
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return json({ error: 'Invalid request' }, 400)

    const fullName = clean(String(body.fullName ?? ''), 160)
    const purpose = String(body.purpose ?? '').trim()
    const phone = normalisePhone(String(body.phone ?? ''))
    const email = body.email ? clean(String(body.email), 200) : ''
    const isAnonymous = Boolean(body.isAnonymous)
    const details = (body.details && typeof body.details === 'object' ? body.details : {}) as Record<string, unknown>

    if (!fullName) return json({ error: 'Please enter your name.' }, 400)
    if (purpose !== 'Runner registration' && purpose !== 'Donation') return json({ error: 'Missing payment purpose.' }, 400)
    if (phone && (phone.length < 10 || phone.length > 15)) return json({ error: 'Enter a valid phone number, or leave it empty.' }, 400)

    let amount: number
    if (purpose === 'Runner registration') {
      const price = RUNNER_PRICES[String(details.category ?? '')]
      if (!price) return json({ error: 'Please choose a runner category.' }, 400)
      amount = price
    } else {
      amount = Math.round(Number(body.amount))
      if (!Number.isFinite(amount) || amount < 500 || amount > 50_000_000) return json({ error: 'Enter an amount between UGX 500 and UGX 50,000,000.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const reference = `HR26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    // One-time secret that Blink's callback must carry back, so nobody else can mark this paid.
    const cardToken = crypto.randomUUID().replace(/-/g, '')
    const site = (Deno.env.get('SITE_URL') ?? 'https://haramberun.com').replace(/\/+$/, '')

    const { error: insertError } = await supabase.from('payments').insert({
      reference,
      purpose,
      full_name: fullName,
      email: email || null,
      msisdn: phone,
      amount,
      is_anonymous: isAnonymous,
      details: { ...details, method: 'card', card_token: cardToken },
    })
    if (insertError) {
      console.error('card payment insert failed', insertError)
      return json({ error: 'Could not start the payment. Please try again.' }, 500)
    }

    const fields: Record<string, string> = {
      amount: String(amount),
      currency_code: 'UGX',
      narration: clean(`Harambe Run 2026 ${purpose} ${reference}`, 100),
      names: fullName,
      phone_number: phone,
      email_address: email,
      cancel_redirect_url: `${site}/receipt/${reference}?card=cancelled`,
      success_redirect_url: `${site}/receipt/${reference}?card=returned`,
      status_notification_url: `${supabaseUrl}/functions/v1/blinkpay-card-callback?ref=${reference}&token=${cardToken}`,
      merchant_id: merchantId,
    }

    // Signature order from the BlinkPay VISA API document.
    fields.request_id = await sha1Hex(
      [
        fields.merchant_id,
        fields.amount,
        fields.currency_code,
        fields.narration,
        fields.names,
        fields.phone_number,
        fields.email_address,
        fields.cancel_redirect_url,
        fields.success_redirect_url,
        fields.status_notification_url,
        merchantPassword,
      ].join('|'),
    )

    return json({ reference, amount, url: cardStartUrl(), fields })
  } catch (error) {
    console.error('blinkpay-card-start error', error)
    return json({ error: 'Something went wrong starting the card payment.' }, 500)
  }
})
