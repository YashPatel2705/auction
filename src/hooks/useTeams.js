// src/hooks/useTeams.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapRow = (row) => ({
  id:            row.id,
  name:          row.name,
  short:         row.short,
  color:         row.color,
  accent:        row.accent,
  sortOrder:     row.sort_order,
  captainId:     row.captain_id      ?? null,
  viceCaptainId: row.vice_captain_id ?? null,
  points:        row.points          ?? 100000,
})

export function useTeams() {
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) setError(error.message)
      else setTeams(data.map(mapRow))
      setLoading(false)
    }
    fetch()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('teams-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teams' }, (payload) => {
        setTeams(prev => [...prev, mapRow(payload.new)].sort((a, b) => a.sortOrder - b.sortOrder))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, (payload) => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? mapRow(payload.new) : t))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'teams' }, (payload) => {
        setTeams(prev => prev.filter(t => t.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const addTeam = useCallback(async ({ id, name, short, color, accent }) => {
    const maxOrder = teams.reduce((m, t) => Math.max(m, t.sortOrder), 0)
    const { error } = await supabase.from('teams').insert({
      id: id.toUpperCase().trim(),
      name: name.trim(),
      short: short.toUpperCase().trim(),
      color,
      accent,
      sort_order: maxOrder + 1,
      points: 100000,
    })
    if (error) throw new Error(error.message)
  }, [teams])

  const updateTeam = useCallback(async (id, fields) => {
    const { error } = await supabase
      .from('teams')
      .update({
        name:   fields.name?.trim(),
        short:  fields.short?.toUpperCase().trim(),
        color:  fields.color,
        accent: fields.accent,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const deleteTeam = useCallback(async (id) => {
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const setCaptain = useCallback(async (teamId, playerId) => {
    const team = teams.find(t => t.id === teamId)
    const newVal = team?.captainId === playerId ? null : playerId
    const clearVC = team?.viceCaptainId === playerId ? { vice_captain_id: null } : {}
    const { error } = await supabase
      .from('teams')
      .update({ captain_id: newVal, ...clearVC })
      .eq('id', teamId)
    if (error) throw new Error(error.message)
  }, [teams])

  const setViceCaptain = useCallback(async (teamId, playerId) => {
    const team = teams.find(t => t.id === teamId)
    const newVal = team?.viceCaptainId === playerId ? null : playerId
    const clearC = team?.captainId === playerId ? { captain_id: null } : {}
    const { error } = await supabase
      .from('teams')
      .update({ vice_captain_id: newVal, ...clearC })
      .eq('id', teamId)
    if (error) throw new Error(error.message)
  }, [teams])

  return { teams, loading, error, addTeam, updateTeam, deleteTeam, setCaptain, setViceCaptain }
}