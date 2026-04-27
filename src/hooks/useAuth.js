// src/hooks/useAuth.js

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = still loading

  useEffect(() => {
    // Get current session on mount (restores from localStorage automatically)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,                          // null = not logged in, object = logged in
    loading: session === undefined,   // true while checking localStorage
    user: session?.user ?? null,
    signIn,
    signOut,
  }
}