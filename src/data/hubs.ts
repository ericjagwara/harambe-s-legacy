import { asset } from '../data'

// Partner hubs with their own shareable page at /hubs/<slug>.
// Add a banner by dropping a 1708x650 image in public/assets and setting `banner`; without one the page shows a plain header.
export type Hub = { slug: string; name: string; banner: string | null }

export const hubs: Hub[] = [
  { slug: 'einstein-rising', name: 'Einstein Rising', banner: asset('hub-einstein-rising.webp') },
  { slug: 'founders-lounge-uganda', name: 'Founders Lounge Uganda', banner: asset('hub-founders-lounge-uganda.webp') },
  { slug: 'hive-colab', name: 'Hive Colab', banner: asset('hub-hive-colab.webp') },
  { slug: 'finding-xy', name: 'Finding XY', banner: asset('hub-finding-xy.webp') },
  { slug: 'live-traces', name: 'Live Traces', banner: asset('hub-live-traces.webp') },
  { slug: 'sfv', name: 'Startup Funding Vehicles', banner: asset('hub-startup-funding-vehicles.webp') },
  { slug: 'sina', name: 'SINA', banner: null },
  { slug: 'uiw', name: 'UIW', banner: null },
  { slug: 'neta', name: 'NETA', banner: null },
  { slug: 'gew', name: 'GEW', banner: null },
]

export const hubBySlug = (slug: string) => hubs.find((hub) => hub.slug === slug)
