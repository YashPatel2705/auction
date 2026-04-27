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

  useEffect(() => {
    const channel = supabase
      .channel('players-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => [...prev, mapRow(payload.new)].sort((a, b) => a.id - b.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => prev.map(p => p.id === payload.new.id ? mapRow(payload.new) : p))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const sellPlayer = useCallback(async ({ playerId, teamId }) => {
    // 1. Sell the player
    const { error } = await supabase
      .from('players')
      .update({ status: 'sold', sold_to: teamId })
      .eq('id', playerId)
    if (error) throw new Error(error.message)

    // 2. Remove this player from any available/active bundles they're in
    const { data: bundles } = await supabase
      .from('bundles')
      .select('id, player_ids')
      .in('status', ['available', 'active'])

    if (bundles?.length) {
      for (const bundle of bundles) {
        if (!bundle.player_ids.includes(playerId)) continue
        const newIds = bundle.player_ids.filter(id => id !== playerId)
        if (newIds.length === 0) {
          // Bundle is now empty — delete it
          await supabase.from('bundles').delete().eq('id', bundle.id)
        } else {
          // Remove player from bundle
          await supabase.from('bundles').update({ player_ids: newIds }).eq('id', bundle.id)
        }
      }
    }
  }, [])

  const releasePlayer = useCallback(async (playerId) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
    // Auto-clear C/VC
    await supabase.from('teams').update({ captain_id: null }).eq('captain_id', playerId)
    await supabase.from('teams').update({ vice_captain_id: null }).eq('vice_captain_id', playerId)
  }, [])

  const resetAuction = useCallback(async () => {
    // Reset all players
    const { error: playersErr } = await supabase
      .from('players')
      .update({ status: 'available', sold_to: null })
      .neq('id', 0)
    if (playersErr) throw new Error(playersErr.message)

    // Clear all C/VC
    const { error: cvcErr } = await supabase
      .from('teams')
      .update({ captain_id: null, vice_captain_id: null })
      .neq('id', '')
    if (cvcErr) throw new Error(cvcErr.message)

    // Reset all team points to 100,000
    const { error: pointsErr } = await supabase
      .from('teams')
      .update({ points: 100000 })
      .neq('id', '')
    if (pointsErr) throw new Error(pointsErr.message)

    // Reset all bundles
    const { error: bundlesErr } = await supabase
      .from('bundles')
      .update({ status: 'available', sold_to: null, sold_points: null, bid_round: 1, tiebreaker_teams: null })
      .neq('id', 0)
    if (bundlesErr) throw new Error(bundlesErr.message)

    // Delete all bundle bids
    const { error: bidsErr } = await supabase
      .from('bundle_bids')
      .delete()
      .neq('id', 0)
    if (bidsErr) throw new Error(bidsErr.message)
  }, [])

  const updatePlayer = useCallback(async (id, fields) => {
    const { error } = await supabase
      .from('players')
      .update({ name: fields.name?.trim(), rating: fields.rating, role: fields.role })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const deletePlayer = useCallback(async (id) => {
    // Clear C/VC if this player had a role
    await supabase.from('teams').update({ captain_id: null }).eq('captain_id', id)
    await supabase.from('teams').update({ vice_captain_id: null }).eq('vice_captain_id', id)

    // Remove from any bundles
    const { data: bundles } = await supabase
      .from('bundles')
      .select('id, player_ids')
      .in('status', ['available', 'active'])

    if (bundles?.length) {
      for (const bundle of bundles) {
        if (!bundle.player_ids.includes(id)) continue
        const newIds = bundle.player_ids.filter(pid => pid !== id)
        if (newIds.length === 0) {
          await supabase.from('bundles').delete().eq('id', bundle.id)
        } else {
          await supabase.from('bundles').update({ player_ids: newIds }).eq('id', bundle.id)
        }
      }
    }

    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const addPlayer = useCallback(async ({ name, role, rating }) => {
    // Fetch max ID from DB to avoid race condition when two admins add simultaneously
    const { data: top } = await supabase
      .from('players').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
    const nextId = (top?.id ?? 0) + 1
    const { error } = await supabase
      .from('players')
      .insert({ id: nextId, name: name.trim(), role, rating: Number(rating), status: 'available' })
    if (error) throw new Error(error.message)
  }, [])

  return {
    players, loading, error,
    sellPlayer, releasePlayer, resetAuction,
    updatePlayer, deletePlayer, addPlayer,
  }
}