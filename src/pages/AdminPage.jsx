// src/pages/AdminPage.jsx

import { useState } from 'react'
import { ADMIN_PASSWORD }  from '../lib/constants'
import { usePlayers }      from '../hooks/usePlayers'
import { useTeams }        from '../hooks/useTeams'
import { useToast }        from '../hooks/useToast'
import AuctionStage        from '../components/AuctionStage'
import PlayerPool          from '../components/PlayerPool'
import TeamsView           from '../components/TeamsView'
import SpinWheel           from '../components/SpinWheel'
import ManagePlayers       from '../components/ManagePlayers'
import ManageTeams         from '../components/ManageTeams'
import Toast               from '../components/Toast'

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const attempt = () => {
    if (input === ADMIN_PASSWORD) { onUnlock() }
    else { setError(true); setTimeout(() => setError(false), 1500) }
  }
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'0 16px' }}>
      <div style={{ fontSize:52 }}>🔒</div>
      <div className="teko" style={{ fontSize:28, letterSpacing:2, color:'#fff' }}>ADMIN ACCESS</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:400 }}>
        <input type="password" placeholder="Enter admin password…" value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ flex:1, background: error?'#3a0d0d':'#0a1e35', border:`1px solid ${error?'#ef4444':'#1e3a5f'}`, borderRadius:10, padding:'12px 16px', color:'#fff', fontSize:15, fontWeight:600, transition:'all .2s' }} />
        <button onClick={attempt}
          style={{ background:'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:10, padding:'12px 22px', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
          Enter
        </button>
      </div>
      {error && <div style={{ color:'#ef4444', fontSize:13, fontWeight:700 }}>Incorrect password</div>}
    </div>
  )
}

function Header({ players, onReset }) {
  const available = players.filter(p => p.status === 'available').length
  const sold      = players.filter(p => p.status === 'sold').length
  return (
    <div style={{ background:'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom:'1px solid #1e3a5f' }}>
      <div className="mob-header-inner" style={{ maxWidth:1440, margin:'0 auto', padding:'0 20px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#00c864,#007a3d)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🏏</div>
          <div>
            <div className="teko" style={{ fontSize:20, letterSpacing:2, color:'#fff', lineHeight:1 }}>CRICKET AUCTION</div>
            <div style={{ fontSize:10, color:'#3a6a8f', letterSpacing:2, textTransform:'uppercase', fontWeight:700 }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="mob-header-stats" style={{ display:'flex', gap:8 }}>
            {[{ l:'Available', v:available, c:'#00c864' }, { l:'Sold', v:sold, c:'#ffb060' }].map(s => (
              <div key={s.l} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'5px 14px', textAlign:'center' }}>
                <div className="teko" style={{ fontSize:20, color:s.c, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:'#5a8fba', textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <button className="mob-reset-btn" onClick={onReset}
            style={{ background:'#3a0d0d', border:'1px solid #7f1d1d', borderRadius:8, padding:'7px 14px', color:'#f87171', fontSize:12, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='#5a1515'}
            onMouseLeave={e => e.currentTarget.style.background='#3a0d0d'}>
            ↺ Reset All
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [view,     setView]     = useState('auction')
  const [poolJump, setPoolJump] = useState(null)

  const { players, loading:pLoad, error:pErr, sellPlayer, releasePlayer, resetAuction, updatePlayer, deletePlayer, addPlayer } = usePlayers()
  const { teams,   loading:tLoad, error:tErr, addTeam, updateTeam, deleteTeam } = useTeams()
  const { toast, showToast } = useToast()

  const handleReset = async () => {
    if (!window.confirm('Reset entire auction? All players return to pool.')) return
    try { await resetAuction(); showToast('Auction reset — all players back in pool') }
    catch (err) { showToast(err.message, 'error') }
  }

  const handlePoolSelect = (player) => { setPoolJump(player); setView('auction') }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontSize:16, padding:16, textAlign:'center' }}>
      ❌ Supabase error: {error}
    </div>
  )

  const available = players.filter(p => p.status === 'available').length

  const TABS = [
    { id:'spin',           icon:'🎯', label:'Spin Wheel'    },
    { id:'auction',        icon:'🔨', label:'Auction Stage' },
    { id:'pool',           icon:'👥', label:'Player Pool', badge:available },
    { id:'teams',          icon:'🏆', label:'Teams'         },
    { id:'manage-players', icon:'⚙️', label:'Edit Players'  },
    { id:'manage-teams',   icon:'🛠️', label:'Edit Teams'    },
  ]

  return (
    <div style={{ minHeight:'100vh' }}>
      <Header players={players} onReset={handleReset} />

      <div className="mob-nav" style={{ background:'#0a1628', borderBottom:'1px solid #1e3a5f', padding:'0 20px' }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{
                background:'none', border:'none',
                borderBottom: view===t.id ? '2px solid #00c864' : '2px solid transparent',
                padding:'13px 15px', color: view===t.id ? '#00c864' : '#6a9abf',
                fontWeight:700, fontSize:13, letterSpacing:0.4,
                cursor:'pointer', whiteSpace:'nowrap', transition:'color .15s',
                display:'flex', alignItems:'center', gap:5,
              }}>
              {t.icon} {t.label}
              {t.badge != null && (
                <span style={{ background:'#1e3a5f', borderRadius:10, padding:'1px 7px', fontSize:11, color:'#7ab4d8', fontWeight:700 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mob-content" style={{ maxWidth:1440, margin:'0 auto', padding:18 }}>
        {view==='spin'           && <SpinWheel teams={teams} onTeamSelected={team => showToast(`${team.name} is up next!`)} />}
        {view==='auction'        && <AuctionStage players={players} teams={teams} onSell={sellPlayer} showToast={showToast} jumpToPlayer={poolJump} onJumpConsumed={() => setPoolJump(null)} />}
        {view==='pool'           && <PlayerPool players={players} onSelectForAuction={handlePoolSelect} />}
        {view==='teams'          && <TeamsView players={players} teams={teams} onRelease={releasePlayer} isAdmin={true} showToast={showToast} />}
        {view==='manage-players' && <ManagePlayers players={players} onUpdate={updatePlayer} onDelete={deletePlayer} onAdd={addPlayer} showToast={showToast} />}
        {view==='manage-teams'   && <ManageTeams teams={teams} onAdd={addTeam} onUpdate={updateTeam} onDelete={deleteTeam} showToast={showToast} />}
      </div>

      <Toast toast={toast} />
    </div>
  )
}