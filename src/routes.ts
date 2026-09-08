export type PageKey =
  | 'home'
  | 'runners'
  | 'route'
  | 'programs'
  | 'partners'
  | 'results'
  | 'register'
  | 'donate'
  | 'contact'

export const routes: Record<PageKey, { path: string; title: string }> = {
  home: { path: '/', title: 'Home' },
  runners: { path: '/runners', title: 'Runners' },
  route: { path: '/route', title: 'Route' },
  programs: { path: '/programs', title: 'Programs' },
  partners: { path: '/partners', title: 'Partners' },
  results: { path: '/results', title: 'Results' },
  register: { path: '/register', title: 'Register' },
  donate: { path: '/donate', title: 'Donate' },
  contact: { path: '/contact', title: 'Contact' },
}

export const pageHref = (page: PageKey) => `#${routes[page].path}`

export function pageFromHash(hash: string): PageKey {
  const path = hash.replace(/^#/, '') || '/'
  const match = (Object.entries(routes) as Array<[PageKey, { path: string }]>).find(([, route]) => route.path === path)
  return match?.[0] ?? 'home'
}
