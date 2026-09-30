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
}

export const pageHref = (page: PageKey) => routes[page].path

// Old addresses that now show another page.
const movedPaths: Record<string, PageKey> = { '/programs': 'volunteer' }

export function pageFromPath(pathname: string): PageKey {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (movedPaths[path]) return movedPaths[path]
  if (path.startsWith('/receipt/')) return 'receipt'
  const match = (Object.entries(routes) as Array<[PageKey, { path: string }]>).find(([, route]) => route.path === path)
  return match?.[0] ?? 'home'
}

// True for any path this site renders itself (used to handle link clicks without a reload).
export function isAppPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path.startsWith('/receipt/') || Object.values(routes).some((route) => route.path === path)
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
