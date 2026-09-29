import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { completePayment } from './notify.ts'

const BLINKPAY_URL = (Deno.env.get('BLINKPAY_API_URL') ?? 'https://payments-dev.blink.co.ug/api/').replace(/\/?$/, '/')

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as { referenceCode?: string } | null
    const referenceCode = String(body?.referenceCode ?? '').trim()
    if (!referenceCode || referenceCode.length > 120) return json({ error: 'Missing payment reference.' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: payment } = await supabase.from('payments').select('*').eq('reference_code', referenceCode).maybeSingle()
    if (!payment) return json({ error: 'Payment not found.' }, 404)

    if (payment.status === 'SUCCESSFUL' || payment.status === 'FAILED') {
      return json({ status: payment.status, reference: payment.reference })
    }

    const result = await blinkpay({ api: 'checktransactionstatus', reference_code: referenceCode })
    if (result.error) return json({ status: payment.status, reference: payment.reference })

    const status = String(result.status ?? payment.status).toUpperCase()
    if (status !== payment.status) {
      await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', payment.id)
      if (status === 'SUCCESSFUL') await completePayment(supabase, payment.id)
    }

    return json({ status, reference: payment.reference })
  } catch (error) {
    console.error('blinkpay-status error', error)
    return json({ error: 'Could not check the payment status.' }, 500)
  }
})
