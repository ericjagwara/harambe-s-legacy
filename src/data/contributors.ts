export type Contribution = {
  id: string
  name: string
  type: string
  amount: number
  isInKind: boolean
  inKindNote: string | null
  isAnonymous: boolean
  at: number
}

export const FUNDRAISING_TARGET = 3_750_000_000

export const contributionTypes = [
  'Corporate pledge',
  'Investor network',
  'Student team',
  'Runner ticket',
  'Booth payment',
  'Online donation',
  'Diaspora pledge',
  'In-kind support',
]

export const formatUGX = (value: number) => `UGX ${value.toLocaleString('en-UG')}`

export function timeAgo(at: number) {
  const diff = Math.max(0, Date.now() - at)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}
