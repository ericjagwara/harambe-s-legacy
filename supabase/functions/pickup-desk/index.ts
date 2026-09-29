// Kit pickup desk: staff look up a runner's payment and mark the kit as collected.
// Protected by the PICKUP_DESK_PASSWORD secret.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Current prices, plus the earlier labels so registrations made before the price change still check correctly.
const RUNNER_PRICES: Record<string, number> = {
  'Student runner, UGX 15,000': 15000,
  'General public runner, UGX 30,000': 30000,
  'Student runner, UGX 30,000': 30000,
  'General public runner, UGX 50,000': 50000,
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function sameSecret(a: string, b: string) {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))])
  const x = new Uint8Array(ha), y = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

function normaliseMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0')) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}

const COLUMNS = 'reference, status, purpose, full_name, amount, msisdn, details, created_at, updated_at, collected_at, collected_by'

// deno-lint-ignore no-explicit-any
function toRow(p: any) {
  const details = (p.details ?? {}) as Record<string, any>
  const category = details.category ?? null
  return {
    reference: p.reference,
    status: p.status,
    purpose: p.purpose,
    name: p.full_name,
    phone: /^256\d{9}$/.test(String(p.msisdn)) ? `0${String(p.msisdn).slice(3)}` : p.msisdn ? `+${p.msisdn}` : '',
    method: details.method === 'card' ? 'card' : 'mobile',
    category,
    start: details.start ?? null,
    amount: Number(p.amount),
    expectedAmount: category ? RUNNER_PRICES[category] ?? null : null,
    paidAt: p.status === 'SUCCESSFUL' ? (details.callback?.completion_date ?? p.updated_at) : null,
    collectedAt: p.collected_at,
    collectedBy: p.collected_by,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const expected = Deno.env.get('PICKUP_DESK_PASSWORD')
    if (!expected) return json({ error: 'The pickup desk is not set up yet. Add the PICKUP_DESK_PASSWORD secret in Supabase.' }, 503)

    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body || !(await sameSecret(String(body.password ?? ''), expected))) {
      await new Promise((r) => setTimeout(r, 800))
      return json({ error: 'Wrong desk password.' }, 401)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const action = String(body.action ?? '')

    if (action === 'login') return json({ ok: true })

    if (action === 'lookup') {
      const q = String(body.query ?? '').trim()
      if (q.length < 3 || q.length > 80) return json({ error: 'Type a reference, phone number or at least 3 letters of a name.' }, 400)
      let query = supabase.from('payments').select(COLUMNS).neq('status', 'FAILED')
      const ref = q.toUpperCase().replace(/^HR26-?/, '')
      const phone = normaliseMsisdn(q)
      if (/^[0-9A-F]{8}$/.test(ref)) {
        // "HR26-86802167", "hr2686802167" or just "86802167"
        query = query.eq('reference', `HR26-${ref}`)
      } else if (/^256\d{9}$/.test(phone)) {
        query = query.eq('msisdn', phone)
      } else {
        query = query.ilike('full_name', `%${q.replace(/[%_]/g, '')}%`)
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      return json({ results: (data ?? []).map(toRow) })
    }

    const reference = String(body.reference ?? '').trim().toUpperCase()
    if (!/^HR26-[0-9A-F]{8}$/.test(reference)) return json({ error: 'Invalid reference.' }, 400)

    if (action === 'collect') {
      const staff = String(body.staff ?? '').trim().slice(0, 60)
      if (!staff) return json({ error: 'Enter your name before marking a kit as collected.' }, 400)
      const { data: updated } = await supabase
        .from('payments')
        .update({ collected_at: new Date().toISOString(), collected_by: staff })
        .eq('reference', reference)
        .eq('status', 'SUCCESSFUL')
        .eq('purpose', 'Runner registration')
        .is('collected_at', null)
        .select(COLUMNS)
      if (updated && updated.length) return json({ ok: true, result: toRow(updated[0]) })

      const { data: p } = await supabase.from('payments').select(COLUMNS).eq('reference', reference).maybeSingle()
      if (!p) return json({ error: 'No payment found with this reference.' }, 404)
      if (p.purpose !== 'Runner registration') return json({ error: 'This is a donation, not a runner registration. No kit is attached to it.' }, 409)
      if (p.status !== 'SUCCESSFUL') return json({ error: `This payment is ${p.status}, not paid. Do not hand over a kit.` }, 409)
      return json({ error: `Kit already collected${p.collected_by ? ` (given out by ${p.collected_by})` : ''}.`, result: toRow(p) }, 409)
    }

    if (action === 'undo') {
      const { data: updated } = await supabase
        .from('payments')
        .update({ collected_at: null, collected_by: null })
        .eq('reference', reference)
        .not('collected_at', 'is', null)
        .select(COLUMNS)
      if (updated && updated.length) return json({ ok: true, result: toRow(updated[0]) })
      return json({ error: 'That kit was not marked as collected.' }, 409)
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (error) {
    console.error('pickup-desk error', error)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})
