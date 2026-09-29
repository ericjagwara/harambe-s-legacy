import { useMemo, useState } from 'react'
import { PageHero, PageSection, CtaBand } from '../components/PageLayout'
import { useContributions } from '../hooks/useContributions'
import { FUNDRAISING_TARGET, formatUGX, timeAgo } from '../data/contributors'

export default function ContributorsPage() {
  const { rows, latestId, raised, count } = useContributions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  // Only offer filters for the kinds of contribution that actually exist.
  const filters = useMemo(() => ['All', ...Array.from(new Set(rows.map((row) => row.type))).sort()], [rows])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter(
      (row) =>
        (filter === 'All' || row.type === filter) &&
        (needle === '' || row.name.toLowerCase().includes(needle)),
    )
  }, [rows, query, filter])

  return (
    <>
      <PageHero
        eyebrow="Public record"
        title="Full contributor list."
        copy={`${count.toLocaleString('en-UG')} contributions totalling ${formatUGX(raised)} towards the ${formatUGX(
          FUNDRAISING_TARGET,
        )} target. The list updates as each new contribution is confirmed.`}
      />

      <PageSection className="bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm">
            <label className="label" htmlFor="contributor-search">
              Search contributors
            </label>
            <input
              id="contributor-search"
              className="field"
              placeholder="Search by name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className={`flex flex-wrap gap-2 ${filters.length > 2 ? '' : 'hidden'}`}>
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`font-ui text-[10px] font-bold uppercase tracking-[0.16em] px-3.5 py-2 transition-colors ${
                  filter === item
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 divide-y divide-border/50">
          {visible.map((row) => (
            <div
              key={row.id}
              className={`grid gap-2 py-4 transition-colors duration-700 sm:grid-cols-[1.6fr_1fr_auto] sm:items-center ${
                row.id === latestId ? 'bg-secondary/15' : ''
              }`}
            >
              <p className="font-display text-2xl uppercase leading-none">{row.name}</p>
              <p className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {row.type} <span className="text-accent">- {timeAgo(row.at)}</span>
              </p>
              <p className="tabular font-display text-2xl uppercase leading-none text-primary sm:text-right">
                {formatUGX(row.amount)}
              </p>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="py-10 text-sm text-muted-foreground">
              {rows.length === 0 ? 'No contributions yet. Be the first on the list.' : 'No contributions match that search.'}
            </p>
          )}
        </div>
      </PageSection>

      <CtaBand
        title="Join the list."
        copy="Every pledge, ticket and booth payment is recorded on this public page."
        primaryLabel="Donate now"
        primaryPage="donate"
        secondaryLabel="Back to statistics"
        secondaryPage="results"
      />
    </>
  )
}
