// src/hooks/useBundles.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapRow = (row) => ({
  id:         row.id,
  name:       row.name,
  playerIds:  row.player_ids,
  status:     row.status,
  soldTo:     row.sold_to,
  soldPoints: row.sold_points,
  createdAt:  row.created_at,
})

export function useBundles() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Initial fetch
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .order('id', { ascending: true })
      if (error) setError(error.message)
      else setBundles(data.map(mapRow))
      setLoading(false)
    }
    fetch()
  }, [])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('bundles-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bundles' }, (payload) => {
        setBundles(prev => [...prev, mapRow(payload.new)])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bundles' }, (payload) => {
        setBundles(prev => prev.map(b => b.id === payload.new.id ? mapRow(payload.new) : b))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bundles' }, (payload) => {
        setBundles(prev => prev.filter(b => b.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // Create a new bundle
  const createBundle = useCallback(async ({ name, playerIds }) => {
    if (!name?.trim())          throw new Error('Bundle name cannot be empty')
    if (!playerIds?.length)     throw new Error('Select at least one player')
    const { error } = await supabase
      .from('bundles')
      .insert({ name: name.trim(), player_ids: playerIds, status: 'available' })
    if (error) throw new Error(error.message)
  }, [])

  // Delete a bundle (only if not sold)
  const deleteBundle = useCallback(async (id) => {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  // Set a bundle as active (on auction block)
  const activateBundle = useCallback(async (id) => {
    // Only one bundle active at a time — deactivate others first
    await supabase
      .from('bundles')
      .update({ status: 'available' })
      .eq('status', 'active')

    const { error } = await supabase
      .from('bundles')
      .update({ status: 'active' })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  // Cancel active bundle back to available
  const deactivateBundle = useCallback(async (id) => {
    const { error } = await supabase
      .from('bundles')
      .update({ status: 'available' })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  // Sell bundle to a team — deduct points, move all players, mark sold
  const sellBundle = useCallback(async ({ bundleId, teamId, points, playerIds }) => {
    // 1. Check team has enough points
    const { data: teamData, error: teamErr } = await supabase
      .from('teams')
      .select('points, name')
      .eq('id', teamId)
      .single()
    if (teamErr) throw new Error(teamErr.message)
    if (teamData.points < points) {
      throw new Error(`${teamData.name} only has ${teamData.points.toLocaleString()} points — not enough!`)
    }

    // 2. Deduct points from team
    const { error: pointsErr } = await supabase
      .from('teams')
      .update({ points: teamData.points - points })
      .eq('id', teamId)
    if (pointsErr) throw new Error(pointsErr.message)

    // 3. Mark all players as sold to this team
    const { error: playersErr } = await supabase
      .from('players')
      .update({ status: 'sold', sold_to: teamId })
      .in('id', playerIds)
    if (playersErr) throw new Error(playersErr.message)

    // 4. Mark bundle as sold
    const { error: bundleErr } = await supabase
      .from('bundles')
      .update({ status: 'sold', sold_to: teamId, sold_points: points })
      .eq('id', bundleId)
    if (bundleErr) throw new Error(bundleErr.message)
  }, [])

  // Reset all bundles back to available (called on auction reset)
  const resetBundles = useCallback(async () => {
    const { error } = await supabase
      .from('bundles')
      .update({ status: 'available', sold_to: null, sold_points: null })
      .neq('id', 0)
    if (error) throw new Error(error.message)
  }, [])

  const activeBundle = bundles.find(b => b.status === 'active') || null

  return {
    bundles, loading, error, activeBundle,
    createBundle, deleteBundle, activateBundle, deactivateBundle, sellBundle, resetBundles,
  }
}