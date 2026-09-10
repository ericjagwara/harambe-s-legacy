import { useEffect, useState } from 'react'
import {
  nextContribution,
  seedContributions,
  settledBeforeList,
  type Contribution,
} from '../data/contributors'

const sumOf = (rows: Contribution[]) => rows.reduce((total, row) => total + row.amount, 0)

export function useContributions(intervalMs = 9000) {
  const [rows, setRows] = useState<Contribution[]>(() =>
    [...seedContributions].sort((a, b) => b.at - a.at),
  )
  const [latestId, setLatestId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      const entry = nextContribution()
      setRows((current) => [entry, ...current])
      setLatestId(entry.id)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return {
    rows,
    latestId,
    raised: settledBeforeList + sumOf(rows),
    count: rows.length,
  }
}
