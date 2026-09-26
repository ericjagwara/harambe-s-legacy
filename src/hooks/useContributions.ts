import { useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import type { Contribution } from '../data/contributors'

type Row = {
  id: string
  name: string
  type: string
  amount: number | string
  is_in_kind: boolean
  in_kind_note: string | null
  is_anonymous: boolean
  created_at: string
}

const toContribution = (row: Row): Contribution => ({
  id: row.id,
  name: row.is_anonymous ? 'Anonymous contributor' : row.name,
  type: row.type,
  amount: Number(row.amount),
  isInKind: row.is_in_kind,
  inKindNote: row.in_kind_note,
  isAnonymous: row.is_anonymous,
  at: new Date(row.created_at).getTime(),
})

export function useContributions() {
  const [rows, setRows] = useState<Contribution[]>([])
  const [latestId, setLatestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .order('created_at', { ascending: false })
      if (!active) return
      setRows((data ?? []).map((row) => toContribution(row as Row)))
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('contributions-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const entry = toContribution(payload.new as Row)
            setRows((current) => [entry, ...current.filter((row) => row.id !== entry.id)])
            setLatestId(entry.id)
          } else {
            load()
          }
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const raised = rows.reduce((total, row) => total + row.amount, 0)
  const inKind = rows.reduce((total, row) => (row.isInKind ? total + row.amount : total), 0)

  return { rows, latestId, raised, inKind, cash: raised - inKind, count: rows.length, loading }
}
