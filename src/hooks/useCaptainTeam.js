// src/hooks/useCaptainTeam.js
// Captain auth + their team data. Privacy-safe: only loads this team's data.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCaptainTeam() {
  const [session, setSession] = useState(null)
  const [team,    setTeam]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Track auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Load team when session is ready
  useEffect(() => {
    if (!session) { setTeam(null); setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)

      // 1. Find which team this user is captain of
      const { data: ct, error: ctErr } = await supabase
        .from('captain_teams')
        .select('team_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (ctErr || !ct) {
        setError(ctErr?.message ?? 'No team linked to this account. Contact the admin.')
        setLoading(false)
        return
      }

      // 2. Fetch that team's data
      const { data: t, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .eq('id', ct.team_id)
        .maybeSingle()

      if (tErr || !t) {
        setError(tErr?.message ?? 'Team not found.')
        setLoading(false)
        return
      }

      setTeam({ id: t.id, name: t.name, short: t.short, color: t.color, accent: t.accent, points: t.points ?? 100000 })
      setLoading(false)
    }

    load()
  }, [session])

  // Realtime: keep team points updated
  useEffect(() => {
    if (!team) return
    const ch = supabase
      .channel(`cap-team-${team.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `id=eq.${team.id}` }, (payload) => {
        setTeam(prev => prev ? { ...prev, points: payload.new.points } : prev)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [team?.id])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return { session, team, loading, error, signIn, signOut }
}
