// Sends a SUCCESSFUL payment to GoAffPro as a sale for the volunteer (affiliate) who referred it.
// Needs the secret GOAFFPRO_ACCESS_TOKEN (Supabase -> Edge Functions -> Secrets). Never put it in website code.
// Only payments with a referral_code are sent. PENDING and FAILED payments are never sent.
// Safe to call many times: the payment is claimed first (affiliate_reported_at), so a sale goes out once.
// A GoAffPro failure never affects the payment; the claim is released and the next status check retries.
// Keep the copies in blinkpay-status, blinkpay-callback and blinkpay-card-callback identical.

// deno-lint-ignore no-explicit-any
type Supabase = any

export async function reportSaleToGoAffPro(supabase: Supabase, reference: string) {
  try {
    const token = Deno.env.get('GOAFFPRO_ACCESS_TOKEN')?.trim()
    if (!token) return // not configured yet: leave the payment unclaimed so it is sent once the secret is set

    const { data: payment } = await supabase
      .from('payments')
      .update({ affiliate_reported_at: new Date().toISOString() })
      .eq('reference', reference)
      .eq('status', 'SUCCESSFUL')
      .not('referral_code', 'is', null)
      .is('affiliate_reported_at', null)
      .select('*')
      .maybeSingle()
    if (!payment) return // no affiliate, not successful, or already sent

    const [firstName, ...rest] = String(payment.full_name ?? '').trim().split(/\s+/)
    const res = await fetch('https://api.goaffpro.com/v1/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GOAFFPRO-ACCESS-TOKEN': token },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        ref_code: payment.referral_code,
        order: {
          id: payment.reference,
          number: payment.reference,
          total: Number(payment.amount), // UGX
          currency: 'UGX',
          customer: {
            first_name: firstName || null,
            last_name: rest.join(' ') || null,
            email: payment.email,
            phone: payment.msisdn,
          },
        },
      }),
    })

    if (!res.ok) {
      console.error('GoAffPro error', reference, res.status, (await res.text()).slice(0, 300))
      await supabase.from('payments').update({ affiliate_reported_at: null }).eq('reference', reference)
    }
  } catch (error) {
    console.error('GoAffPro report failed', reference, error)
    try {
      await supabase.from('payments').update({ affiliate_reported_at: null }).eq('reference', reference).eq('status', 'SUCCESSFUL')
    } catch { /* ignore */ }
  }
}
