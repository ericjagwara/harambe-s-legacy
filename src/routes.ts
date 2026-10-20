export type PageKey =
  | 'home'
  | 'runners'
  | 'route'
  | 'volunteer'
  | 'partners'
  | 'results'
  | 'contributors'
  | 'register'
  | 'donate'
  | 'contact'
  | 'receipt'
  | 'pickup'
  | 'agreement'
  | 'mou'
  | 'mobiliser'
  | 'hub'
  | 'dashboard'

export const routes: Record<PageKey, { path: string; title: string }> = {
  home: { path: '/', title: 'Home' },
  runners: { path: '/runners', title: 'Runners' },
  route: { path: '/route', title: 'Route' },
  volunteer: { path: '/volunteer', title: 'Volunteer' },
  partners: { path: '/partners', title: 'Partners' },
  results: { path: '/results', title: 'Statistics' },
  contributors: { path: '/contributors', title: 'Contributors' },
  register: { path: '/register', title: 'Register' },
  donate: { path: '/donate', title: 'Donate' },
  contact: { path: '/contact', title: 'Contact' },
  receipt: { path: '/receipt', title: 'Payment receipt' },
  pickup: { path: '/pickup', title: 'Kit pickup desk' },
  // Unlisted: not in the menu or footer. Volunteers are sent the link directly.
  agreement: { path: '/volunteer-agreement', title: 'Volunteer agreement' },
  // Unlisted too: partner hubs are sent the link directly.
  mou: { path: '/partner-mou', title: 'Partner MOU' },
  mobiliser: { path: '/mobiliser-mou', title: 'Resource Mobiliser MOU' },
  // Hub pages live at /hubs/<name> (see hubSlugFromPath); '/hubs' alone is only a placeholder.
  hub: { path: '/hubs', title: 'Partner hub' },
  // Private: password protected, not linked anywhere.
  dashboard: { path: '/dashboard', title: 'Dashboard' },
}

export const pageHref = (page: PageKey) => routes[page].path

// Old addresses that now show another page.
const movedPaths: Record<string, PageKey> = { '/programs': 'volunteer' }

export function pageFromPath(pathname: string): PageKey {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (movedPaths[path]) return movedPaths[path]
  if (path.startsWith('/receipt/')) return 'receipt'
  if (path.startsWith('/hubs/')) return 'hub'
  const match = (Object.entries(routes) as Array<[PageKey, { path: string }]>).find(([, route]) => route.path === path)
  return match?.[0] ?? 'home'
}

// True for any path this site renders itself (used to handle link clicks without a reload).
export function isAppPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path.startsWith('/receipt/') || path.startsWith('/hubs/') || Object.values(routes).some((route) => route.path === path)
}

// Receipt reference from a path like /receipt/HR26-86802167
export function receiptRefFromPath(pathname: string): string {
  const match = pathname.match(/^\/receipt\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]).toUpperCase() : ''
}

// Old links were shared as /#/results. Turn them into /results so they keep working.
export function legacyHashPath(hash: string): string | null {
  return hash.startsWith('#/') ? hash.slice(1) : null
}

// Hub name from a path like /hubs/einstein-rising
export function hubSlugFromPath(pathname: string): string {
  const match = pathname.match(/^\/hubs\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]).toLowerCase() : ''
}
