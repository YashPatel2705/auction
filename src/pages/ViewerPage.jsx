// src/pages/ViewerPage.jsx
// ─── Public read-only live screen — updates in real-time via Supabase Realtime ─

import { useMemo, useState } from 'react'
import { usePlayers }  from '../hooks/usePlayers'
import { TEAMS, ROLE_COLORS } from '../lib/constants'
import TeamsView from '../components/TeamsView'

// ── Live "Now on Block" banner ────────────────────────────────────────────────
// Admin would set this via a separate "on_stage" column (future enhancement).
// For now the viewer sees the full sold/available summary.

function StatBar({ players }) {
  const available = players.filter((p) => p.status === 'available').length
  const sold      = players.filter((p) => p.status === 'sold').length
  const total     = players.length

  return (
    <div style={{
      display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
    }}>
      {[
        { label: 'Total Players', value: total,     color: '#7ab4d8' },
        { label: 'Available',     value: available,  color: '#00c864' },
        { label: 'Sold',          value: sold,       color: '#ffb060' },
      ].map((s) => (
        <div key={s.label} style={{
          flex: 1, minWidth: 120,
          background: '#0a1e35', border: '1px solid #1e3a5f',
          borderRadius: 12, padding: '14px 20px', textAlign: 'center',
        }}>
          <div className="teko" style={{ fontSize: 32, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#4a7fa8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Team summary cards ────────────────────────────────────────────────────────
function TeamSummaryCards({ players }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="teko" style={{ fontSize: 18, letterSpacing: 2, color: '#4a7fa8', marginBottom: 12 }}>TEAM SQUADS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {TEAMS.map((team) => {
          const roster = players.filter((p) => p.soldTo === team.id)
          const spent  = roster.reduce((s, p) => s + (p.soldPrice || 0), 0)
          return (
            <div key={team.id} style={{
              background: '#0a1e35', border: '1px solid #1e3a5f',
              borderLeft: `3px solid ${team.color}`,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: team.color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: team.accent, fontWeight: 800,
                  }}>{team.short}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: '#4a7fa8' }}>{roster.length} players</div>
                  </div>
                </div>
                <div className="teko" style={{ fontSize: 20, color: '#ffb060' }}>₹{spent}L</div>
              </div>

              {roster.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {roster.map((p) => (
                    <span key={p.id} style={{
                      background: '#08111e', border: '1px solid #1e3a5f',
                      borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#c8d8e8',
                    }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#1e3a5f' }}>No players acquired yet</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Recent sales feed ─────────────────────────────────────────────────────────
function RecentSales({ players }) {
  const recent = useMemo(() =>
    players
      .filter((p) => p.status === 'sold')
      .sort((a, b) => b.soldPrice - a.soldPrice)
      .slice(0, 20),
    [players]
  )

  if (recent.length === 0) return null

  return (
    <div>
      <div className="teko" style={{ fontSize: 18, letterSpacing: 2, color: '#4a7fa8', marginBottom: 12 }}>TOP SALES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 8 }}>
        {recent.map((player) => {
          const team = TEAMS.find((t) => t.id === player.soldTo)
          return (
            <div key={player.id} style={{
              background: '#0a1e35', border: '1px solid #1e3a5f',
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{player.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span className="badge" style={{ background: ROLE_COLORS[player.role]?.bg, color: ROLE_COLORS[player.role]?.text, fontSize: 9 }}>
                    {player.role}
                  </span>
                  {team && (
                    <span style={{ fontSize: 11, color: team.color, fontWeight: 700 }}>{team.short}</span>
                  )}
                </div>
              </div>
              <div className="teko" style={{ fontSize: 20, color: '#00c864' }}>₹{player.soldPrice}L</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ViewerPage ───────────────────────────────────────────────────────────
export default function ViewerPage() {
  const { players, loading, error } = usePlayers()
  const [view, setView] = useState('summary')

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
      ❌ Error: {error}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#00c864,#007a3d)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏏</div>
            <div>
              <div className="teko" style={{ fontSize: 21, letterSpacing: 2, color: '#fff', lineHeight: 1 }}>CRICKET AUCTION</div>
              <div style={{ fontSize: 10, color: '#3a6a8f', letterSpacing: 2, textTransform: 'uppercase' }}>Live Viewer</div>
            </div>
          </div>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 12, color: '#00c864', fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#0a1628', borderBottom: '1px solid #1e3a5f', padding: '0 20px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex' }}>
          {[
            { id: 'summary', label: '📊 Summary' },
            { id: 'teams',   label: '🏆 Full Squads' },
            { id: 'sales',   label: '💰 Top Sales' },
          ].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: view === t.id ? '2px solid #00c864' : '2px solid transparent',
                padding: '13px 18px', color: view === t.id ? '#00c864' : '#4a7fa8',
                fontWeight: 600, fontSize: 14, letterSpacing: 0.8,
                cursor: 'pointer', transition: 'color .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 18 }}>
        {view === 'summary' && (
          <div className="fade-up">
            <StatBar players={players} />
            <TeamSummaryCards players={players} />
          </div>
        )}
        {view === 'teams' && (
          <TeamsView
            players={players}
            onRelease={() => {}}
            isAdmin={false}
            showToast={() => {}}
          />
        )}
        {view === 'sales' && (
          <div className="fade-up">
            <RecentSales players={players} />
          </div>
        )}
      </div>
    </div>
  )
}
