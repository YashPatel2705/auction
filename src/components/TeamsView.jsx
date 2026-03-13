// src/components/TeamsView.jsx

import { useState } from 'react'
import { ROLE_COLORS } from '../lib/constants'
import ConfirmModal from './ConfirmModal'

function RoleBadge({ type }) {
  const isC = type === 'C'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:20, height:20, borderRadius:4,
      background: isC ? '#f59e0b' : '#8b5cf6',
      color:'#fff', fontSize:10, fontWeight:800, flexShrink:0,
    }}>
      {type}
    </span>
  )
}

export default function TeamsView({ players, teams=[], onRelease, setCaptain, setViceCaptain, isAdmin, showToast }) {
  const [activeTeam,  setActiveTeam]  = useState(teams[0]?.id || '')
  const [confirmDrop, setConfirmDrop] = useState(null)
  const [busy,        setBusy]        = useState(false)

  const teamRoster = (tid) => players.filter(p => p.soldTo === tid)
  const team   = teams.find(t => t.id === activeTeam) || teams[0]
  const roster = team ? teamRoster(team.id) : []

  // Sort: C first, VC second, rest after
  const sortedRoster = roster.slice().sort((a, b) => {
    const aIsC  = a.id === team?.captainId
    const bIsC  = b.id === team?.captainId
    const aIsVC = a.id === team?.viceCaptainId
    const bIsVC = b.id === team?.viceCaptainId
    if (aIsC)  return -1
    if (bIsC)  return  1
    if (aIsVC) return -1
    if (bIsVC) return  1
    return 0
  })

  const handleRelease = async (playerId) => {
    setBusy(true)
    try {
      await onRelease(playerId)
      const player = players.find(p => p.id === playerId)
      showToast(`${player?.name} returned to player pool`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
      setConfirmDrop(null)
    }
  }

  const handleSetCaptain = async (playerId) => {
    try { await setCaptain(team.id, playerId) }
    catch (err) { showToast(err.message, 'error') }
  }

  const handleSetVC = async (playerId) => {
    try { await setViceCaptain(team.id, playerId) }
    catch (err) { showToast(err.message, 'error') }
  }

  if (teams.length === 0) return (
    <div style={{ textAlign:'center', padding:60, color:'#4a7fa8', fontWeight:600 }}>
      <div style={{ fontSize:40, marginBottom:10 }}>🏏</div>
      No teams yet
    </div>
  )

  return (
    <div className="fade-up teams-grid" style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:16, alignItems:'start' }}>

      {/* Sidebar */}
      <div className="teams-sidebar" style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', overflow:'hidden' }}>
        <div style={{ padding:'13px 16px', borderBottom:'1px solid #1e3a5f', flexShrink:0 }}>
          <span className="teko" style={{ fontSize:18, letterSpacing:1.5, color:'#fff' }}>FRANCHISES</span>
        </div>
        {teams.map(t => {
          const count  = teamRoster(t.id).length
          const act    = (team?.id === t.id)
          const hasC   = t.captainId   != null
          const hasVC  = t.viceCaptainId != null
          return (
            <button key={t.id} onClick={() => setActiveTeam(t.id)}
              style={{ width:'100%', background: act ? t.color+'16' : 'transparent', borderLeft:`3px solid ${act ? t.color : 'transparent'}`, borderRight:'none', borderTop:'none', borderBottom:'1px solid #1e3a5f', padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'background .15s' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:t.color, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:t.accent, fontWeight:800 }}>
                {t.short}
              </div>
              <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color: act ? '#fff' : '#8ab4d8', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {t.name}
                </div>
                <div style={{ fontSize:11, color:'#4a7fa8', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                  {count} players
                  {hasC  && <RoleBadge type="C"  />}
                  {hasVC && <RoleBadge type="VC" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Roster panel */}
      {!team ? null : (
        <div style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', overflow:'hidden' }}>

          {/* Team header */}
          <div style={{ background:`linear-gradient(135deg,${team.color}20,transparent)`, borderBottom:'1px solid #1e3a5f', padding:'15px 20px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ width:46, height:46, borderRadius:10, background:team.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:team.accent, fontWeight:800, flexShrink:0 }}>
              {team.short}
            </div>
            <div style={{ flex:1 }}>
              <div className="teko" style={{ fontSize:24, letterSpacing:1, color:'#fff' }}>{team.name}</div>
              <div style={{ fontSize:12, color:'#6a9abf', fontWeight:600, display:'flex', gap:10, flexWrap:'wrap', marginTop:2 }}>
                <span>{roster.length} players</span>
                {team.captainId != null && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <RoleBadge type="C" />
                    <span style={{ color:'#f59e0b' }}>{players.find(p => p.id === team.captainId)?.name}</span>
                  </span>
                )}
                {team.viceCaptainId != null && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <RoleBadge type="VC" />
                    <span style={{ color:'#8b5cf6' }}>{players.find(p => p.id === team.viceCaptainId)?.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding:16 }}>
            {roster.length === 0 ? (
              <div style={{ textAlign:'center', padding:50, color:'#4a7fa8' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏏</div>
                <div style={{ fontWeight:600 }}>No players yet</div>
                {isAdmin && <div style={{ fontSize:12, marginTop:4, color:'#2a4a6f', fontWeight:600 }}>Go to Auction Stage to assign players</div>}
              </div>
            ) : (
              <div className="mob-cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                {sortedRoster.map(player => {
                  const isC  = player.id === team.captainId
                  const isVC = player.id === team.viceCaptainId
                  return (
                    <div key={player.id} style={{ background:'#08111e', border:`1px solid ${isC ? '#f59e0b55' : isVC ? '#8b5cf655' : '#1e3a5f'}`, borderRadius:12, padding:14, position:'relative' }}>

                      {/* Top-right action buttons */}
                      <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:5 }}>
                        {isAdmin && setCaptain && (
                          <button
                            onClick={() => handleSetCaptain(player.id)}
                            title={isC ? 'Remove Captain' : 'Set as Captain'}
                            style={{ background: isC ? '#f59e0b' : '#1e3a5f', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', color: isC ? '#000' : '#7ab4d8', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            C
                          </button>
                        )}
                        {isAdmin && setViceCaptain && (
                          <button
                            onClick={() => handleSetVC(player.id)}
                            title={isVC ? 'Remove Vice Captain' : 'Set as Vice Captain'}
                            style={{ background: isVC ? '#8b5cf6' : '#1e3a5f', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', color: isVC ? '#fff' : '#7ab4d8', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            VC
                          </button>
                        )}
                        {isAdmin && (
                          <button className="drop-btn" onClick={() => setConfirmDrop(player)} title="Release to pool" disabled={busy}
                            style={{ background:'#1e3a5f', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', color:'#7ab4d8', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            ↩
                          </button>
                        )}
                      </div>

                      <div style={{ paddingRight: isAdmin ? 90 : 0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          {isC  && <RoleBadge type="C"  />}
                          {isVC && <RoleBadge type="VC" />}
                          <div style={{ fontWeight:700, fontSize:14, color: isC ? '#f59e0b' : isVC ? '#a78bfa' : '#fff' }}>
                            {player.name}
                          </div>
                        </div>
                        <span className="badge" style={{ background:ROLE_COLORS[player.role]?.bg, color:ROLE_COLORS[player.role]?.text, fontSize:9 }}>
                          {player.role}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal player={confirmDrop} onConfirm={handleRelease} onCancel={() => setConfirmDrop(null)} />
    </div>
  )
}