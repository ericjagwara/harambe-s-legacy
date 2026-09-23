import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    const referenceCode = String(body?.reference_code ?? '').trim()
    const status = String(body?.status ?? '').toUpperCase()
    if (!referenceCode || !status) return new Response('ok', { headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: payment } = await supabase.from('payments').select('*').eq('reference_code', referenceCode).maybeSingle()
    if (!payment) return new Response('ok', { headers: corsHeaders })

    await supabase
      .from('payments')
      .update({ status, details: { ...(payment.details ?? {}), callback: body }, updated_at: new Date().toISOString() })
      .eq('id', payment.id)

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

    return new Response('ok', { headers: corsHeaders })
  } catch (error) {
    console.error('blinkpay-callback error', error)
    return new Response('ok', { headers: corsHeaders })
  }
})
