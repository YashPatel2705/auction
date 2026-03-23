// src/pages/ViewerPage.jsx

import { useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import { useTeams }   from '../hooks/useTeams'
import TeamsView      from '../components/TeamsView'

function StatBar({ players }) {
  const available = players.filter(p => p.status === 'available').length
  const sold      = players.filter(p => p.status === 'sold').length
  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
      {[
        { label:'Total Players', value:players.length, color:'#7ab4d8' },
        { label:'Available',     value:available,      color:'#00c864' },
        { label:'Sold',          value:sold,           color:'#ffb060' },
      ].map(s => (
        <div key={s.label} style={{ flex:1, minWidth:100, background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
          <div className="teko" style={{ fontSize:36, color:s.color, lineHeight:1 }}>{s.value}</div>
          <div style={{ fontSize:11, color:'#5a8fba', textTransform:'uppercase', letterSpacing:1, marginTop:3, fontWeight:700 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function RoleBadge({ type }) {
  const isC = type === 'C'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:18, height:18, borderRadius:4,
      background: isC ? '#f59e0b' : '#8b5cf6',
      color:'#fff', fontSize:9, fontWeight:800, flexShrink:0,
    }}>
      {type}
    </span>
  )
}

function TeamSummaryCards({ players, teams }) {
  return (
    <div>
      <div className="teko" style={{ fontSize:19, letterSpacing:2, color:'#5a8fba', marginBottom:12 }}>TEAM SQUADS</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
        {teams.map(team => {
          // Only players currently sold (status=sold) to this team
          const roster = players.filter(p => p.status === 'sold' && p.soldTo === team.id)

          // C first, VC second, rest after
          const sorted = roster.slice().sort((a, b) => {
            if (a.id === team.captainId)     return -1
            if (b.id === team.captainId)     return  1
            if (a.id === team.viceCaptainId) return -1
            if (b.id === team.viceCaptainId) return  1
            return 0
          })

          return (
            <div key={team.id} style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderLeft:`3px solid ${team.color}`, borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:team.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:team.accent, fontWeight:800, flexShrink:0 }}>
                  {team.short}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>{team.name}</div>
                  <div style={{ fontSize:12, color:'#5a8fba', fontWeight:600 }}>{roster.length} players</div>
                </div>
              </div>

              {/* Single chip list — C/VC first, badges inline, no duplicate row */}
              {roster.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {sorted.map(p => {
                    const isC  = p.id === team.captainId
                    const isVC = p.id === team.viceCaptainId
                    return (
                      <span key={p.id} style={{
                        display:'flex', alignItems:'center', gap:4,
                        background:'#08111e',
                        border:`1px solid ${isC ? '#f59e0b55' : isVC ? '#8b5cf655' : '#1e3a5f'}`,
                        borderRadius:6, padding:'3px 9px',
                        fontSize:12,
                        color: isC ? '#f59e0b' : isVC ? '#a78bfa' : '#d0e0f0',
                        fontWeight:600,
                      }}>
                        {isC  && <RoleBadge type="C"  />}
                        {isVC && <RoleBadge type="VC" />}
                        {p.name}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div style={{ fontSize:12, color:'#2a4a6f', fontWeight:600 }}>No players acquired yet</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ViewerPage() {
  const { players, loading:pLoad, error:pErr } = usePlayers()
  const { teams,   loading:tLoad, error:tErr } = useTeams()
  const [view, setView] = useState('summary')

  const loading = pLoad || tLoad
  const error   = pErr  || tErr

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:52 }}>🏏</div>
      <div className="teko" style={{ fontSize:24, letterSpacing:3, color:'#00c864' }}>LOADING…</div>
      <div style={{ width:200, height:3, background:'#1e3a5f', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:'55%', background:'#00c864', borderRadius:2, animation:'loadBar 1s ease-in-out infinite' }} />
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', padding:16, textAlign:'center' }}>
      ❌ Error: {error}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom:'1px solid #1e3a5f' }}>
        <div style={{ maxWidth:1440, margin:'0 auto', padding:'0 16px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#00c864,#007a3d)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🏏</div>
            <div>
              <div className="teko" style={{ fontSize:20, letterSpacing:2, color:'#fff', lineHeight:1 }}>HARI PRABODHAM BOX CRICKET AUCTION</div>
              <div style={{ fontSize:10, color:'#4a7fa8', letterSpacing:2, textTransform:'uppercase', fontWeight:700 }}>Live Viewer</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="live-dot" />
            <span style={{ fontSize:12, color:'#00c864', fontWeight:700, letterSpacing:1 }}>LIVE</span>
          </div>
        </div>
      </div>

      <div className="mob-nav" style={{ background:'#0a1628', borderBottom:'1px solid #1e3a5f', padding:'0 16px' }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex' }}>
          {[{ id:'summary', label:'📊 Summary' }, { id:'teams', label:'🏆 Full Squads' }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ background:'none', border:'none', borderBottom: view===t.id ? '2px solid #00c864' : '2px solid transparent', padding:'13px 18px', color: view===t.id ? '#00c864' : '#6a9abf', fontWeight:700, fontSize:14, cursor:'pointer', transition:'color .15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mob-content" style={{ maxWidth:1440, margin:'0 auto', padding:16 }}>
        {view === 'summary' && (
          <div className="fade-up">
            <StatBar players={players} />
            <TeamSummaryCards players={players} teams={teams} />
          </div>
        )}
        {view === 'teams' && (
          <TeamsView players={players} teams={teams} onRelease={() => {}} isAdmin={false} showToast={() => {}} />
        )}
      </div>
    </div>
  )
}