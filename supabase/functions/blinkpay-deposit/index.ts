import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const BLINKPAY_URL = (Deno.env.get('BLINKPAY_API_URL') ?? 'https://payments-dev.blink.co.ug/api/').replace(/\/?$/, '/')

// Kit prices are set here on the server, so the amount cannot be changed from the browser.
// Keep in sync with runnerCategories in src/sections/Registration.tsx.
const RUNNER_PRICES: Record<string, number> = {
  'Student runner, UGX 15,000': 15000,
  'General public runner, UGX 30,000': 30000,
  // Old labels from the site before the price change, charged at the new prices.
  'Student runner, UGX 30,000': 15000,
  'General public runner, UGX 50,000': 30000,
}

async function blinkpay(payload: Record<string, unknown>) {
  const res = await fetch(BLINKPAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: Deno.env.get('BLINKPAY_MM_USERNAME'),
      password: Deno.env.get('BLINKPAY_MM_PASSWORD'),
      ...payload,
    }),
  })
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: true, message: `Unexpected response from payment provider (${res.status})` }
  }
}

function normaliseMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0')) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return json({ error: 'Invalid request' }, 400)

    const fullName = String(body.fullName ?? '').trim()
    const purpose = String(body.purpose ?? '').trim()
    const phone = normaliseMsisdn(String(body.phone ?? ''))
    const email = body.email ? String(body.email).trim().slice(0, 200) : null
    const isAnonymous = Boolean(body.isAnonymous)
    const details = (body.details && typeof body.details === 'object' ? body.details : {}) as Record<string, unknown>

    if (!fullName || fullName.length > 160) return json({ error: 'Please enter your name.' }, 400)
    if (purpose !== 'Runner registration' && purpose !== 'Donation') return json({ error: 'Missing payment purpose.' }, 400)
    if (!/^256\d{9}$/.test(phone)) return json({ error: 'Enter a valid Ugandan mobile money number, for example 0781405551.' }, 400)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)

    let amount: number
    if (purpose === 'Runner registration') {
      const price = RUNNER_PRICES[String(details.category ?? '')]
      if (!price) return json({ error: 'Please choose a runner category.' }, 400)
      amount = price
    } else {
      amount = Math.round(Number(body.amount))
      if (!Number.isFinite(amount) || amount < 500 || amount > 50_000_000) return json({ error: 'Enter an amount between UGX 500 and UGX 50,000,000.' }, 400)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const reference = `HR26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        reference,
        purpose,
        full_name: fullName,
        email,
        msisdn: phone,
        amount,
        is_anonymous: isAnonymous,
        details,
      })
      .select()
      .single()

    if (insertError) {
      console.error('payment insert failed', insertError)
      return json({ error: 'Could not start the payment. Please try again.' }, 500)
    }

    const result = await blinkpay({
      api: 'depositmobilemoney',
      msisdn: phone,
      amount,
      narration: `Harambe Run 2026 ${purpose}`.slice(0, 60),
      reference,
      status_notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/blinkpay-callback`,
    })

    if (result.error) {
      await supabase.from('payments').update({ status: 'FAILED', updated_at: new Date().toISOString(), details: { ...details, provider: result } }).eq('id', payment.id)
      return json({ error: String(result.message ?? 'The payment request was declined. Please try again.') }, 400)
    }

    await supabase
      .from('payments')
      .update({ reference_code: String(result.reference_code ?? ''), status: String(result.status ?? 'PENDING'), updated_at: new Date().toISOString() })
      .eq('id', payment.id)

    return json({ reference, referenceCode: result.reference_code, status: result.status ?? 'PENDING', amount })
  } catch (error) {
    console.error('blinkpay-deposit error', error)
    return json({ error: 'Something went wrong starting the payment.' }, 500)
  }
})
