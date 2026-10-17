// Our own simple site analytics (no cookies, nothing sent to third parties). Events go to the site-insights function.
import { getHub } from './hub'

const VID = 'harambe_vid'
const SID = 'harambe_sid'
const memory: Record<string, string> = {}

function stored(storage: 'local' | 'session', key: string) {
  try {
    const area = storage === 'local' ? localStorage : sessionStorage
    let value = area.getItem(key)
    if (!value) {
      value = crypto.randomUUID()
      area.setItem(key, value)
    }
    return value
  } catch {
    return (memory[key] ||= crypto.randomUUID())
  }
}

// Pages that are for staff, not visitors.
const SKIP = ['/dashboard', '/pickup']

function cleanPath(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path.startsWith('/receipt/') ? '/receipt' : path
}

let firstOfSession = (() => {
  try {
    return !sessionStorage.getItem(`${SID}_seen`)
  } catch {
    return true
  }
})()

export function trackEvent(event: 'pageview' | 'form_start' | 'kit_click' | 'pay_attempt', meta: Record<string, string> = {}) {
  try {
    const path = cleanPath(window.location.pathname)
    if (SKIP.includes(path)) return
    const params = new URLSearchParams(window.location.search)
    let referrer: string | null = null
    if (event === 'pageview' && firstOfSession) {
      firstOfSession = false
      try {
        sessionStorage.setItem(`${SID}_seen`, '1')
      } catch {
        /* ignore */
      }
      try {
        const host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''
        if (host && host !== window.location.hostname.replace(/^www\./, '')) referrer = host
      } catch {
        /* ignore */
      }
    }
    const hubInPath = path.match(/^\/hubs\/([a-z0-9-]+)$/)?.[1]
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({
        action: 'track',
        event,
        session: stored('session', SID),
        visitor: stored('local', VID),
        path,
        hub: hubInPath ?? getHub(),
        referrer,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        ref: params.get('ref'),
        meta,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* tracking must never break the site */
  }
}
