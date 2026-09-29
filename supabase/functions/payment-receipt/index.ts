// Public receipt lookup by payment reference (HR26-XXXXXXXX).
// Returns only what a receipt needs; the phone number is partly hidden.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const maskPhone = (msisdn: string) => {
  if (!msisdn) return ''
  if (/^256\d{9}$/.test(msisdn)) return `0${msisdn.slice(3, 5)}X XXX ${msisdn.slice(-3)}`
  return `+${msisdn.slice(0, 3)} XXX ${msisdn.slice(-3)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as { reference?: string } | null
    const reference = String(body?.reference ?? '').trim().toUpperCase()
    if (!/^HR26-[0-9A-F]{8}$/.test(reference)) return json({ error: 'That does not look like a Harambe Run reference. It starts with HR26-.' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: p } = await supabase
      .from('payments')
      .select('reference, status, purpose, full_name, amount, msisdn, details, created_at, updated_at, collected_at')
      .eq('reference', reference)
      .maybeSingle()
    if (!p) return json({ error: 'No payment found with this reference.' }, 404)

    const details = (p.details ?? {}) as Record<string, any>
    const callback = (details.callback ?? {}) as Record<string, any>
    return json({
      reference: p.reference,
      status: p.status,
      purpose: p.purpose,
      name: p.full_name,
      amount: p.amount,
      category: details.category ?? null,
      start: details.start ?? null,
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
