// src/components/TeamsView.jsx
// ─── View each team's squad; admin can release players back to pool ───────────

import { useState, useMemo } from 'react'
import { TEAMS, ROLE_COLORS } from '../lib/constants'
import ConfirmModal from './ConfirmModal'

export default function TeamsView({ players, onRelease, isAdmin, showToast }) {
  const [activeTeam,   setActiveTeam]   = useState('MI')
  const [confirmDrop,  setConfirmDrop]  = useState(null)
  const [busy,         setBusy]         = useState(false)

  const teamRoster = (tid) => players.filter((p) => p.soldTo === tid)
  const teamSpent  = (tid) => players.filter((p) => p.soldTo === tid).reduce((s, p) => s + (p.soldPrice || 0), 0)

  const team   = TEAMS.find((t) => t.id === activeTeam)
  const roster = teamRoster(activeTeam)
  const spent  = teamSpent(activeTeam)

  const handleRelease = async (playerId) => {
    setBusy(true)
    try {
      await onRelease(playerId)
      const player = players.find((p) => p.id === playerId)
      showToast(`${player?.name} returned to player pool`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
      setConfirmDrop(null)
    }
  }

  return (
    <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>

      {/* Team sidebar */}
      <div style={{ background: '#0a1e35', borderRadius: 16, border: '1px solid #1e3a5f', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e3a5f' }}>
          <span className="teko" style={{ fontSize: 18, letterSpacing: 1.5, color: '#fff' }}>FRANCHISES</span>
        </div>
        {TEAMS.map((t) => {
          const count = teamRoster(t.id).length
          const s     = teamSpent(t.id)
          const act   = activeTeam === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTeam(t.id)}
              style={{
                width: '100%',
                background: act ? t.color + '16' : 'transparent',
                borderLeft: `3px solid ${act ? t.color : 'transparent'}`,
                borderRight: 'none', borderTop: 'none',
                borderBottom: '1px solid #1e3a5f',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', transition: 'background .15s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: t.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: t.accent, fontWeight: 800,
              }}>
                {t.short}
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: act ? '#fff' : '#7ab4d8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#3a6a8f' }}>{count} players · ₹{s}L</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Roster panel */}
      <div style={{ background: '#0a1e35', borderRadius: 16, border: '1px solid #1e3a5f', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg,${team.color}20,transparent)`,
          borderBottom: '1px solid #1e3a5f',
          padding: '15px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: team.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: team.accent, fontWeight: 800,
            }}>
              {team.short}
            </div>
            <div>
              <div className="teko" style={{ fontSize: 23, letterSpacing: 1, color: '#fff' }}>{team.name}</div>
              <div style={{ fontSize: 12, color: '#4a7fa8' }}>{roster.length} players in squad</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#4a7fa8', letterSpacing: 1 }}>TOTAL SPENT</div>
            <div className="teko" style={{ fontSize: 26, color: '#ffb060' }}>₹{spent}L</div>
          </div>
        </div>

        {/* Player cards */}
        <div style={{ padding: 16 }}>
          {roster.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#3a6a8f' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏏</div>
              <div>No players yet</div>
              {isAdmin && <div style={{ fontSize: 12, marginTop: 4, color: '#1e3a5f' }}>Auction Stage → bid on players to fill this squad</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
              {roster.map((player) => (
                <div
                  key={player.id}
                  style={{ background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 14, position: 'relative' }}
                >
                  {/* Release button — admin only */}
                  {isAdmin && (
                    <button
                      className="drop-btn"
                      onClick={() => setConfirmDrop(player)}
                      title="Release to pool"
                      disabled={busy}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        background: '#1e3a5f', border: 'none', borderRadius: 6,
                        width: 26, height: 26, cursor: 'pointer',
                        color: '#7ab4d8', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ↩
                    </button>
                  )}

                  <div style={{ paddingRight: isAdmin ? 34 : 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{player.name}</div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      className="badge"
                      style={{ background: ROLE_COLORS[player.role]?.bg, color: ROLE_COLORS[player.role]?.text, fontSize: 9 }}
                    >
                      {player.role}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: '#4a7fa8' }}>SOLD FOR</div>
                      <div className="teko" style={{ fontSize: 16, color: '#00c864' }}>₹{player.soldPrice}L</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        player={confirmDrop}
        onConfirm={handleRelease}
        onCancel={() => setConfirmDrop(null)}
      />
    </div>
  )
}
