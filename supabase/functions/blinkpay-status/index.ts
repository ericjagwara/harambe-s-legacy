import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { blinkpay } from '../_shared/blinkpay.ts'

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
      return json({ status: payment.status })
    }

    const result = await blinkpay({ api: 'checktransactionstatus', reference_code: referenceCode })
    if (result.error) return json({ status: payment.status })

    const status = String(result.status ?? payment.status).toUpperCase()
    if (status !== payment.status) {
      await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', payment.id)
      if (status === 'SUCCESSFUL' && !payment.contribution_id) {
        const { data: contribution } = await supabase
          .from('contributions')
          .insert({
            name: payment.is_anonymous ? 'Anonymous contributor' : payment.full_name,
            type: payment.purpose === 'Donation' ? 'Online donation' : 'Runner ticket',
            amount: payment.amount,
            is_anonymous: payment.is_anonymous,
          })
          .select()
          .single()
        if (contribution) {
          await supabase.from('payments').update({ contribution_id: contribution.id }).eq('id', payment.id)
        }
      }
    }

    return json({ status })
  } catch (error) {
    console.error('blinkpay-status error', error)
    return json({ error: 'Could not check the payment status.' }, 500)
  }
})
