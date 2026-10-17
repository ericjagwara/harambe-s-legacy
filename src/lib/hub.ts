// Partner hub tracking. A hub's own page (/hubs/<name>) tags the visitor with that hub for 7 days,
// so donations and kits they pay for are counted for the hub. This is separate from volunteer referrals.
const KEY = 'harambe_hub'
const DAYS = 7

export function captureHub(slug: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now() }))
  } catch {
    /* storage can be blocked; tracking just does not happen */
  }
}

export function getHub(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!saved?.slug || Date.now() - saved.at > DAYS * 24 * 60 * 60 * 1000) return null
    return /^[a-z0-9-]{1,40}$/.test(saved.slug) ? String(saved.slug) : null
  } catch {
    return null
  }
}
