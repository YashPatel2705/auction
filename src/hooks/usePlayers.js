// src/hooks/usePlayers.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapRow = (row) => ({
  id:     row.id,
  name:   row.name,
  role:   row.role,
  rating: row.rating,
  status: row.status,
  soldTo: row.sold_to,
})

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Initial fetch
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('id', { ascending: true })

      if (error) setError(error.message)
      else setPlayers(data.map(mapRow))
      setLoading(false)
    }
    fetch()
  }, [])

  // Realtime subscription — pushes every UPDATE to all connected clients
  useEffect(() => {
    const channel = supabase
      .channel('players-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'players' },
        (payload) => {
          const updated = mapRow(payload.new)
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          )
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Sell player to a team (no price)
  const sellPlayer = useCallback(async ({ playerId, teamId }) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'sold', sold_to: teamId })
      .eq('id', playerId)

    if (error) throw new Error(error.message)
  }, [])

  // Release player back to pool
  const releasePlayer = useCallback(async (playerId) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .eq('id', playerId)

    if (error) throw new Error(error.message)
  }, [])

  // Reset entire auction
  const resetAuction = useCallback(async () => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .neq('id', 0)

    if (error) throw new Error(error.message)
  }, [])

  return { players, loading, error, sellPlayer, releasePlayer, resetAuction }
}
