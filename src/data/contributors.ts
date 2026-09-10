export type ContributionType =
  | 'Corporate pledge'
  | 'Investor network'
  | 'Student team'
  | 'Online donation'
  | 'Runner ticket'
  | 'Booth payment'
  | 'Diaspora pledge'

export type Contribution = {
  id: string
  name: string
  type: ContributionType
  amount: number
  at: number
}

export const FUNDRAISING_TARGET = 3_750_000_000

const minutes = (n: number) => n * 60_000

const seedRows: Array<[string, ContributionType, number, number]> = [
  ['Stanbic Business Incubator', 'Corporate pledge', 45_000_000, 5_400],
  ['Kampala Angels Circle', 'Investor network', 32_500_000, 4_820],
  ['MTN Uganda Foundation', 'Corporate pledge', 30_000_000, 4_310],
  ['Ortus Africa Capital', 'Investor network', 25_000_000, 3_960],
  ['Anonymous partner', 'Corporate pledge', 25_000_000, 3_505],
  ['Imuka Access', 'Investor network', 18_000_000, 3_120],
  ['Absa Bank Uganda', 'Corporate pledge', 15_000_000, 2_840],
  ['Fie-Consult', 'Booth payment', 5_000_000, 2_610],
  ['Makerere Innovation Hub', 'Student team', 3_400_000, 2_405],
  ['Diaspora Runners Club, London', 'Diaspora pledge', 12_400_000, 2_180],
  ['Konnect Initiative', 'Investor network', 9_500_000, 1_990],
  ['MUBS Entrepreneurs Society', 'Student team', 2_850_000, 1_770],
  ['Offisar', 'Booth payment', 3_500_000, 1_540],
  ['AFBAN', 'Investor network', 8_200_000, 1_355],
  ['Kyambogo Runners Team', 'Runner ticket', 1_650_000, 1_150],
  ['Nakawa Traders Association', 'Corporate pledge', 6_700_000, 980],
  ['Individual donor', 'Online donation', 850_000, 815],
  ['UCU Startup Club', 'Student team', 1_240_000, 690],
  ['Diaspora Investment Circle, Toronto', 'Diaspora pledge', 7_300_000, 540],
  ['Victoria University Runners', 'Runner ticket', 980_000, 415],
  ['Anonymous donor', 'Online donation', 420_000, 310],
  ['Cavendish Tech Society', 'Student team', 760_000, 205],
  ['Bugolobi Running Club', 'Runner ticket', 1_120_000, 120],
  ['Individual donor', 'Online donation', 250_000, 45],
]

export const seedContributions: Contribution[] = seedRows.map(([name, type, amount, ago], index) => ({
  id: `seed-${index}`,
  name,
  type,
  amount,
  at: Date.now() - minutes(ago),
}))

/** Contributions already settled before the public list starts, kept in the running total. */
export const settledBeforeList = 178_400_000

const livePool: Array<[string, ContributionType, number, number]> = [
  ['Individual donor', 'Online donation', 50_000, 500_000],
  ['Anonymous donor', 'Online donation', 100_000, 1_200_000],
  ['Student runner group', 'Runner ticket', 150_000, 900_000],
  ['General public runners', 'Runner ticket', 250_000, 1_500_000],
  ['Alumni giving circle', 'Diaspora pledge', 800_000, 6_000_000],
  ['Corporate team entry', 'Corporate pledge', 1_500_000, 12_000_000],
  ['Angel investor pledge', 'Investor network', 2_000_000, 15_000_000],
  ['Campus startup club', 'Student team', 300_000, 2_400_000],
]

const roundTo = (value: number, step: number) => Math.round(value / step) * step

export function nextContribution(): Contribution {
  const [name, type, min, max] = livePool[Math.floor(Math.random() * livePool.length)]
  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    amount: roundTo(min + Math.random() * (max - min), 10_000),
    at: Date.now(),
  }
}

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
