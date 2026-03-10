// src/lib/constants.js

export const TEAMS = [
  { id: 'MI',   name: 'Mumbai Indians',        short: 'MI',   color: '#004BA0', accent: '#D1AB3E' },
  { id: 'CSK',  name: 'Chennai Super Kings',   short: 'CSK',  color: '#D4AC0D', accent: '#1B1B1B' },
  { id: 'RCB',  name: 'Royal Challengers',     short: 'RCB',  color: '#C8102E', accent: '#FFD700' },
  { id: 'KKR',  name: 'Kolkata Knight Riders', short: 'KKR',  color: '#3A225D', accent: '#B3A123' },
  { id: 'DC',   name: 'Delhi Capitals',        short: 'DC',   color: '#0078BC', accent: '#EF1C25' },
  { id: 'SRH',  name: 'Sunrisers Hyderabad',   short: 'SRH',  color: '#FF822A', accent: '#1A1A2E' },
  { id: 'PBKS', name: 'Punjab Kings',          short: 'PBKS', color: '#AA4545', accent: '#DCDDDF' },
  { id: 'RR',   name: 'Rajasthan Royals',      short: 'RR',   color: '#EA1A85', accent: '#254AA5' },
]

export const ROLES = ['All', 'Batter', 'Bowler', 'All-rounder', 'Wicket-keeper']

export const ROLE_COLORS = {
  'Batter':        { bg: '#0d2a4a', text: '#60b4ff' },
  'Bowler':        { bg: '#3a1a1a', text: '#ff7070' },
  'All-rounder':   { bg: '#0d3a1a', text: '#55d878' },
  'Wicket-keeper': { bg: '#3a2a0d', text: '#ffb84d' },
}

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'auction2024'
