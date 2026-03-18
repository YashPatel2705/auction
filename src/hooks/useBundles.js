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

  const createBundle = useCallback(async ({ name, playerIds }) => {
    if (!name?.trim())      throw new Error('Bundle name cannot be empty')
    if (!playerIds?.length) throw new Error('Select at least one player')
    const { error } = await supabase
      .from('bundles')
      .insert({ name: name.trim(), player_ids: playerIds, status: 'available' })
    if (error) throw new Error(error.message)
  }, [])

  // Edit name and/or players of an available bundle
  const updateBundle = useCallback(async ({ bundleId, name, playerIds }) => {
    if (!name?.trim())      throw new Error('Bundle name cannot be empty')
    if (!playerIds?.length) throw new Error('Select at least one player')
    const { error } = await supabase
      .from('bundles')
      .update({ name: name.trim(), player_ids: playerIds })
      .eq('id', bundleId)
    if (error) throw new Error(error.message)
  }, [])

  const deleteBundle = useCallback(async (id) => {
    const { error } = await supabase.from('bundles').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const activateBundle = useCallback(async (id) => {
    await supabase.from('bundles').update({ status: 'available' }).eq('status', 'active')
    const { error } = await supabase.from('bundles').update({ status: 'active' }).eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const deactivateBundle = useCallback(async (id) => {
    const { error } = await supabase.from('bundles').update({ status: 'available' }).eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const sellBundle = useCallback(async ({ bundleId, teamId, points, playerIds }) => {
    const { data: teamData, error: teamErr } = await supabase
      .from('teams').select('points, name').eq('id', teamId).single()
    if (teamErr) throw new Error(teamErr.message)
    if (teamData.points < points) {
      throw new Error(`${teamData.name} only has ${teamData.points.toLocaleString()} points — not enough!`)
    }
    const { error: pointsErr } = await supabase
      .from('teams').update({ points: teamData.points - points }).eq('id', teamId)
    if (pointsErr) throw new Error(pointsErr.message)
    const { error: playersErr } = await supabase
      .from('players').update({ status: 'sold', sold_to: teamId }).in('id', playerIds)
    if (playersErr) throw new Error(playersErr.message)
    const { error: bundleErr } = await supabase
      .from('bundles').update({ status: 'sold', sold_to: teamId, sold_points: points }).eq('id', bundleId)
    if (bundleErr) throw new Error(bundleErr.message)
  }, [])

  const refundBundle = useCallback(async ({ bundleId, teamId, soldPoints, playerIds }) => {
    const { data: teamData, error: teamErr } = await supabase
      .from('teams').select('points, name').eq('id', teamId).single()
    if (teamErr) throw new Error(teamErr.message)
    const { error: pointsErr } = await supabase
      .from('teams').update({ points: teamData.points + soldPoints }).eq('id', teamId)
    if (pointsErr) throw new Error(pointsErr.message)
    const { error: playersErr } = await supabase
      .from('players').update({ status: 'available', sold_to: null }).in('id', playerIds)
    if (playersErr) throw new Error(playersErr.message)
    for (const pid of playerIds) {
      await supabase.from('teams').update({ captain_id: null }).eq('captain_id', pid)
      await supabase.from('teams').update({ vice_captain_id: null }).eq('vice_captain_id', pid)
    }
    const { error: bundleErr } = await supabase
      .from('bundles')
      .update({ status: 'available', sold_to: null, sold_points: null })
      .eq('id', bundleId)
    if (bundleErr) throw new Error(bundleErr.message)
  }, [])

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
    createBundle, updateBundle, deleteBundle,
    activateBundle, deactivateBundle,
    sellBundle, refundBundle, resetBundles,
  }
}