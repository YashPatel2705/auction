import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  role: row.role,
  basePrice: row.base_price,
  rating: row.rating,
  status: row.status,
  soldTo: row.sold_to,
  soldPrice: row.sold_price,
})

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setPlayers((data || []).map(mapRow))
      }

      setLoading(false)
    }

    fetchPlayers()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('players-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = mapRow(payload.new)
            setPlayers((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            )
          }

          if (payload.eventType === 'INSERT') {
            const inserted = mapRow(payload.new)
            setPlayers((prev) => {
              const exists = prev.some((p) => p.id === inserted.id)
              return exists ? prev : [...prev, inserted].sort((a, b) => a.id - b.id)
            })
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setPlayers((prev) => prev.filter((p) => p.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const sellPlayer = useCallback(async ({ playerId, teamId, price }) => {
    const { data, error } = await supabase
      .from('players')
      .update({
        status: 'sold',
        sold_to: teamId,
        sold_price: price,
      })
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const updated = mapRow(data)

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? updated : p))
    )

    return updated
  }, [])

  const releasePlayer = useCallback(async (playerId) => {
    const { data, error } = await supabase
      .from('players')
      .update({
        status: 'available',
        sold_to: null,
        sold_price: null,
      })
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const updated = mapRow(data)

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? updated : p))
    )

    return updated
  }, [])

  const resetAuction = useCallback(async () => {
    const { error } = await supabase
      .from('players')
      .update({
        status: 'available',
        sold_to: null,
        sold_price: null,
      })
      .neq('id', 0)

    if (error) throw new Error(error.message)

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        status: 'available',
        soldTo: null,
        soldPrice: null,
      }))
    )
  }, [])

  return {
    players,
    loading,
    error,
    sellPlayer,
    releasePlayer,
    resetAuction,
  }
}