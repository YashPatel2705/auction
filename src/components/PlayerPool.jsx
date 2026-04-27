// src/components/PlayerPool.jsx

import { useMemo, useState } from 'react'
import { ROLES } from '../lib/constants'
import PlayerCard from './PlayerCard'

export default function PlayerPool({ players, onSelectForAuction }) {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const available = useMemo(() => players.filter(p => p.status === 'available'), [players])
  const filtered  = useMemo(() =>
    available.filter(p => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) && (roleFilter === 'All' || p.role === roleFilter)
    }), [available, search, roleFilter])

  return (
    <div className="fade-up">
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <input placeholder="🔍 Search player…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:180, background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:14, fontWeight:600 }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:10, padding:'10px 14px', color:'#7ab4d8', fontSize:13, fontWeight:600 }}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <div style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#5a8fba', fontWeight:700 }}>
          <span style={{ color:'#00c864' }}>{filtered.length}</span> of <span style={{ color:'#fff' }}>{available.length}</span> available
        </div>
      </div>

      <div className="mob-cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
        {filtered.map(player => (
          <div key={player.id}>
            <PlayerCard player={player} onClick={() => onSelectForAuction(player)} />
            <div style={{ padding:'3px 4px 7px', fontSize:10, color:'#1a6a3a', textAlign:'right', fontWeight:700 }}>
              Click to send to auction →
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'#4a7fa8', fontWeight:600 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🔍</div>
            No players match your filter
          </div>
        )}
      </div>
    </div>
  )
}