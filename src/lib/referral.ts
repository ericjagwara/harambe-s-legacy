// Affiliate tracking (GoAffPro). Volunteers share links like https://haramberun.com/register?ref=amina.
// The code is remembered for 7 days (same as GoAffPro's cookie) and sent with payments and enquiries.
const KEY = 'harambe_ref'
const DAYS = 7

const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 64)

// Call once when the app starts.
export function captureReferral() {
  try {
    const ref = clean(new URLSearchParams(window.location.search).get('ref') ?? '')
    if (ref) localStorage.setItem(KEY, JSON.stringify({ code: ref, at: Date.now() }))
  } catch {
    /* storage can be blocked; tracking just does not happen */
  }
}

// The saved code, or null if none or older than 7 days.
export function getReferral(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!saved?.code || Date.now() - saved.at > DAYS * 24 * 60 * 60 * 1000) return null
    return String(saved.code)
  } catch {
    return null
  }
}
