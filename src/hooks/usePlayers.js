// src/hooks/usePlayers.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapRow = (row) => ({
  id:     row.id,
  name:   row.name,
  role:   row.role,
  rating: row.rating,
  status: row.status,       // 'available' or 'sold' — always mapped
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

  // Realtime — INSERT / UPDATE / DELETE
  useEffect(() => {
    const channel = supabase
      .channel('players-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => [...prev, mapRow(payload.new)].sort((a, b) => a.id - b.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
        // Full row replace — status + soldTo both update correctly
        setPlayers(prev => prev.map(p => p.id === payload.new.id ? mapRow(payload.new) : p))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const sellPlayer = useCallback(async ({ playerId, teamId }) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'sold', sold_to: teamId })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
  }, [])

  const releasePlayer = useCallback(async (playerId) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
  }, [])

  const resetAuction = useCallback(async () => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .neq('id', 0)
    if (error) throw new Error(error.message)
  }, [])

  const updatePlayer = useCallback(async (id, fields) => {
    const { error } = await supabase
      .from('players')
      .update({ name: fields.name?.trim(), rating: fields.rating, role: fields.role })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const deletePlayer = useCallback(async (id) => {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const addPlayer = useCallback(async ({ name, role, rating }) => {
    const maxId = players.reduce((m, p) => Math.max(m, p.id), 0)
    const { error } = await supabase
      .from('players')
      .insert({ id: maxId + 1, name: name.trim(), role, rating: Number(rating), status: 'available' })
    if (error) throw new Error(error.message)
  }, [players])

  return {
    players, loading, error,
    sellPlayer, releasePlayer, resetAuction,
    updatePlayer, deletePlayer, addPlayer,
  }
}