// Saves sponsor, exhibitor and volunteer forms from the registration page into public.enquiries.
// Staff read them in Supabase: Table Editor -> enquiries.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const TYPES = ['Sponsorship', 'Exhibition', 'Volunteer'] as const

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as { type?: string; fields?: Record<string, unknown> } | null
    const type = String(body?.type ?? '') as (typeof TYPES)[number]
    const fields = body?.fields && typeof body.fields === 'object' ? body.fields : null
    if (!TYPES.includes(type) || !fields) return json({ error: 'Invalid request.' }, 400)

    // Hidden field that people never see; bots fill it in. Pretend it worked.
    if (text(fields.website, 200)) return json({ ok: true })

    const name = text(fields.name, 160)
    const email = text(fields.email, 200)
    const phone = text(fields.phone, 40)
    if (!name) return json({ error: 'Please enter your name.' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (phone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number.' }, 400)

    const details: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields).slice(0, 30)) {
      if (['name', 'email', 'phone', 'organisation', 'choice', 'website'].includes(key)) continue
      const v = text(value, 2000)
      if (v) details[key.slice(0, 60)] = v
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error } = await supabase.from('enquiries').insert({
      type,
      name,
      organisation: text(fields.organisation, 200) || null,
      email,
      phone,
      choice: text(fields.choice, 200) || null,
      details,
    })
    if (error) {
      console.error('enquiry insert failed', error)
      return json({ error: 'We could not save your details. Please try again, or email info@haramberun.com.' }, 500)
    }
    return json({ ok: true })
  } catch (error) {
    console.error('submit-enquiry error', error)
    return json({ error: 'Something went wrong. Please try again, or email info@haramberun.com.' }, 500)
  }
})
