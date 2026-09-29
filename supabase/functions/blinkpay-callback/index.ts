import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { completePayment } from './notify.ts'

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

    // A payment that already succeeded never moves back to another status.
    const nextStatus = payment.status === 'SUCCESSFUL' ? 'SUCCESSFUL' : status
    await supabase
      .from('payments')
      .update({ status: nextStatus, details: { ...(payment.details ?? {}), callback: body }, updated_at: new Date().toISOString() })
      .eq('id', payment.id)

    if (nextStatus === 'SUCCESSFUL') await completePayment(supabase, payment.id)

    return new Response('ok', { headers: corsHeaders })
  } catch (error) {
    console.error('blinkpay-callback error', error)
    return new Response('ok', { headers: corsHeaders })
  }
})
