// src/pages/AdminPage.jsx
// ─── Full auction control panel (password-protected) ─────────────────────────

import { useState } from 'react'
import { ADMIN_PASSWORD } from '../lib/constants'
import { usePlayers }     from '../hooks/usePlayers'
import { useToast }       from '../hooks/useToast'
import AuctionStage       from '../components/AuctionStage'
import PlayerPool         from '../components/PlayerPool'
import TeamsView          from '../components/TeamsView'
import Toast              from '../components/Toast'

// ── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [input, setInput]   = useState('')
  const [error, setError]   = useState(false)

  const attempt = () => {
    if (input === ADMIN_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 52 }}>🔒</div>
      <div className="teko" style={{ fontSize: 28, letterSpacing: 2, color: '#fff' }}>ADMIN ACCESS</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          placeholder="Enter admin password…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && attempt()}
          style={{
            background: error ? '#3a0d0d' : '#0a1e35',
            border: `1px solid ${error ? '#ef4444' : '#1e3a5f'}`,
            borderRadius: 10, padding: '12px 18px', color: '#fff',
            fontSize: 15, width: 280,
            transition: 'border-color .2s, background .2s',
          }}
        />
        <button
          onClick={attempt}
          style={{
            background: 'linear-gradient(135deg,#00c864,#007a3d)',
            border: 'none', borderRadius: 10, padding: '12px 22px',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Enter
        </button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>Incorrect password</div>}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ players, onReset }) {
  const available = players.filter((p) => p.status === 'available').length
  const sold      = players.filter((p) => p.status === 'sold').length

  return (
    <div style={{ background: 'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom: '1px solid #1e3a5f' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#00c864,#007a3d)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏏</div>
          <div>
            <div className="teko" style={{ fontSize: 21, letterSpacing: 2, color: '#fff', lineHeight: 1 }}>CRICKET AUCTION</div>
            <div style={{ fontSize: 10, color: '#3a6a8f', letterSpacing: 2, textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {[{ l: 'Available', v: available, c: '#00c864' }, { l: 'Sold', v: sold, c: '#ffb060' }].map((s) => (
            <div key={s.l} style={{ background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '5px 14px', textAlign: 'center' }}>
              <div className="teko" style={{ fontSize: 20, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#3a6a8f', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
            </div>
          ))}

          <button
            onClick={onReset}
            style={{ background: '#3a0d0d', border: '1px solid #7f1d1d', borderRadius: 8, padding: '7px 14px', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={(e) => (e.target.style.background = '#5a1515')}
            onMouseLeave={(e) => (e.target.style.background = '#3a0d0d')}
          >
            ↺ Reset All
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [view,     setView]     = useState('auction')

  const { players, loading, error, sellPlayer, releasePlayer, resetAuction } = usePlayers()
  const { toast, showToast } = useToast()

  const handleReset = async () => {
    if (!window.confirm('Reset entire auction? All sold players return to pool.')) return
    try {
      await resetAuction()
      showToast('Auction reset — all players back in pool')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // navigate to auction tab pre-selecting a player (from pool tab)
  const [poolJump, setPoolJump] = useState(null)
  const handlePoolSelect = (player) => {
    setPoolJump(player)
    setView('auction')
  }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 52 }}>🏏</div>
      <div className="teko" style={{ fontSize: 24, letterSpacing: 3, color: '#00c864' }}>LOADING…</div>
      <div style={{ width: 200, height: 3, background: '#1e3a5f', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '55%', background: '#00c864', borderRadius: 2, animation: 'loadBar 1s ease-in-out infinite' }} />
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 16 }}>
      ❌ Supabase error: {error}
    </div>
  )

  const available = players.filter((p) => p.status === 'available').length

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header players={players} onReset={handleReset} />

      {/* Nav */}
      <div style={{ background: '#0a1628', borderBottom: '1px solid #1e3a5f', padding: '0 20px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex' }}>
          {[
            { id: 'auction', icon: '🔨', label: 'Auction Stage' },
            { id: 'pool',    icon: '👥', label: 'Player Pool', badge: available },
            { id: 'teams',   icon: '🏆', label: 'Teams' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: view === t.id ? '2px solid #00c864' : '2px solid transparent',
                padding: '13px 18px',
                color: view === t.id ? '#00c864' : '#4a7fa8',
                fontWeight: 600, fontSize: 14, letterSpacing: 0.8,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {t.icon} {t.label}
              {t.badge != null && (
                <span style={{ background: '#1e3a5f', borderRadius: 10, padding: '1px 7px', fontSize: 11, color: '#7ab4d8' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 18 }}>
        {view === 'auction' && (
          <AuctionStage
            players={players}
            onSell={sellPlayer}
            showToast={showToast}
            jumpToPlayer={poolJump}
            onJumpConsumed={() => setPoolJump(null)}
          />
        )}
        {view === 'pool' && (
          <PlayerPool
            players={players}
            onSelectForAuction={handlePoolSelect}
          />
        )}
        {view === 'teams' && (
          <TeamsView
            players={players}
            onRelease={releasePlayer}
            isAdmin={true}
            showToast={showToast}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
