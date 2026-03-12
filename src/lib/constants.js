// src/lib/constants.js

export const ROLES = ['All', 'Batter', 'Bowler', 'All-rounder', 'Wicket-keeper']

export const ROLE_COLORS = {
  'Batter':        { bg: '#0d2a4a', text: '#60b4ff' },
  'Bowler':        { bg: '#3a1a1a', text: '#ff7070' },
  'All-rounder':   { bg: '#0d3a1a', text: '#55d878' },
  'Wicket-keeper': { bg: '#3a2a0d', text: '#ffb84d' },
}

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'auction2024'