// src/lib/supabase.js
// ─── Single shared Supabase client for the entire app ────────────────────────

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌  Missing Supabase env vars.\n' +
    'Copy .env.example → .env and fill in your project URL and anon key.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 20 },
  },
})
