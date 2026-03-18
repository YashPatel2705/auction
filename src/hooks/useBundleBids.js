// src/hooks/useBundleBids.js
// ─── ADMIN-ONLY hook: fetches ALL bids for a bundle (used in admin review) ───
//
// ⚠️  REQUIRES these Supabase RLS policies on the bundle_bids table:
//   - SELECT: auth.uid() IN (SELECT user_id FROM captain_teams WHERE team_id = bundle_bids.team_id)
//             OR auth.email() = '<your-admin-email>'
//   - INSERT: auth.uid() IN (SELECT user_id FROM captain_teams WHERE team_id = bundle_bids.team_id)
//   - UPDATE / DELETE: false  (nobody can modify a submitted bid)
//
// For captain pages, use a direct targeted query (see CaptainPage.jsx) so
// captains only ever see their own bid row, not other teams' bids.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBundleBids(bundleId) {
  const [bids,    setBids]    = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!bundleId) { setBids([]); return }

    setLoading(true)
    supabase
      .from('bundle_bids')
      .select('*')
      .eq('bundle_id', bundleId)
      .then(({ data, error }) => {
        if (!error) setBids(data ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel(`bundle-bids-${bundleId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bundle_bids',
        filter: `bundle_id=eq.${bundleId}`,
      }, (payload) => {
        setBids(prev => [...prev, payload.new])
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'bundle_bids',
      }, (payload) => {
        setBids(prev => prev.filter(b => b.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [bundleId])

  const submitBid = useCallback(async ({ bundleId, teamId, points, round }) => {
    const { error } = await supabase
      .from('bundle_bids')
      .insert({ bundle_id: bundleId, team_id: teamId, points, round })
    if (error) throw new Error(error.message)
  }, [])

  return { bids, loading, submitBid }
}
