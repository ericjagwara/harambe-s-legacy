// Site analytics and partner-hub tracking. Three actions:
//   track      (public)   records a visit or form event from the website
//   hub-stats  (public)   total raised through one hub page, for the progress bar
//   report     (password) everything the private dashboard shows (secret: ANALYTICS_PASSWORD)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const EVENTS = new Set(['pageview', 'form_start', 'kit_click', 'pay_attempt'])
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|node-fetch/i

const text = (value: unknown, max: number) => {
  const s = String(value ?? '').trim().slice(0, max)
  return s === '' ? null : s
}
const slug = (value: unknown) => {
  const s = String(value ?? '').trim().toLowerCase()
  return /^[a-z0-9-]{1,40}$/.test(s) ? s : null
}

// Light per-visitor limit so one browser cannot flood the table. It resets whenever the function restarts.
const seen = new Map<string, { at: number; n: number }>()
function tooMany(key: string) {
  const now = Date.now()
  const entry = seen.get(key)
  if (!entry || now - entry.at > 60_000) {
    seen.set(key, { at: now, n: 1 })
    if (seen.size > 5000) seen.clear()
    return false
  }
  entry.n += 1
  return entry.n > 60
}

function deviceOf(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'Tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

async function sameSecret(a: string, b: string) {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))])
  const x = new Uint8Array(ha), y = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return json({ error: 'Invalid request' }, 400)
    const action = String(body.action ?? '')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (action === 'track') {
      const ua = req.headers.get('user-agent') ?? ''
      if (!ua || BOT.test(ua)) return json({ ok: true })
      const event = String(body.event ?? '')
      const sessionId = text(body.session, 64)
      if (!EVENTS.has(event) || !sessionId) return json({ ok: true })
      if (tooMany(sessionId)) return json({ ok: true })

      const meta = body.meta && typeof body.meta === 'object' ? body.meta as Record<string, unknown> : {}
      const cleanMeta: Record<string, string> = {}
      for (const key of ['form', 'purpose', 'method', 'category']) {
        const v = text(meta[key], 80)
        if (v) cleanMeta[key] = v
      }

      const { error } = await supabase.from('site_events').insert({
        session_id: sessionId,
        visitor_id: text(body.visitor, 64),
        event,
        path: text(body.path, 200),
        hub: slug(body.hub),
        referrer_host: text(body.referrer, 120),
        utm_source: text(body.utm_source, 80),
        utm_medium: text(body.utm_medium, 80),
        utm_campaign: text(body.utm_campaign, 120),
        ref: text(body.ref, 64),
        device: deviceOf(ua),
        country: text(req.headers.get('cf-ipcountry') ?? req.headers.get('x-country-code'), 8),
        meta: Object.keys(cleanMeta).length ? cleanMeta : null,
      })
      if (error) console.error('track insert failed', error)
      return json({ ok: true })
    }

    if (action === 'hub-stats') {
      const hub = slug(body.hub)
      if (!hub) return json({ error: 'Unknown hub.' }, 400)
      // Money that went through this hub's page, paid only. Hidden test contributions are left out.
      const { data, error } = await supabase
        .from('payments')
        .select('amount, purpose, details, contributions(hidden)')
        .eq('status', 'SUCCESSFUL')
        .eq('details->>hub', hub)
      if (error) throw error
      let raised = 0, donations = 0, kits = 0
      // deno-lint-ignore no-explicit-any
      for (const row of (data ?? []) as any[]) {
        if (row.contributions?.hidden) continue
        raised += Number(row.amount)
        if (row.purpose === 'Donation') donations += 1
        else {
          kits += 1
          if (Number(row.details?.extra_donation) > 0) donations += 1
        }
      }
      return json({ raised, donations, kits })
    }

    if (action === 'report') {
      const expected = Deno.env.get('ANALYTICS_PASSWORD')
      if (!expected) return json({ error: 'The dashboard is not set up yet. Add the ANALYTICS_PASSWORD secret in Supabase.' }, 503)
      if (!(await sameSecret(String(body.password ?? ''), expected))) {
        await new Promise((r) => setTimeout(r, 800))
        return json({ error: 'Wrong dashboard password.' }, 401)
      }
      const days = [0, 1, 7, 30, 90].includes(Number(body.days)) ? Number(body.days) : 30
      const { data, error } = await supabase.rpc('analytics_report', { days })
      if (error) throw error
      return json(data)
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (error) {
    console.error('site-insights error', error)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})
