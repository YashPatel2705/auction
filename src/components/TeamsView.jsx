// src/components/TeamsView.jsx

import { useState } from 'react'
import { TEAMS, ROLE_COLORS } from '../lib/constants'
import ConfirmModal from './ConfirmModal'

export default function TeamsView({ players, onRelease, isAdmin, showToast }) {
  const [activeTeam,  setActiveTeam]  = useState('MI')
  const [confirmDrop, setConfirmDrop] = useState(null)
  const [busy,        setBusy]        = useState(false)

  const teamRoster = (tid) => players.filter((p) => p.soldTo === tid)

  const team   = TEAMS.find((t) => t.id === activeTeam)
  const roster = teamRoster(activeTeam)

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
                <div style={{ fontSize: 13, color: act ? '#fff' : '#7ab4d8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 11, color: '#3a6a8f' }}>{count} players</div>
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
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10, background: team.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: team.accent, fontWeight: 800,
          }}>
            {team.short}
          </div>
          <div>
            <div className="teko" style={{ fontSize: 24, letterSpacing: 1, color: '#fff' }}>{team.name}</div>
            <div style={{ fontSize: 12, color: '#4a7fa8' }}>{roster.length} players in squad</div>
          </div>
        </div>

        {/* Player cards */}
        <div style={{ padding: 16 }}>
          {roster.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#3a6a8f' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏏</div>
              <div>No players yet</div>
              {isAdmin && <div style={{ fontSize: 12, marginTop: 4, color: '#1e3a5f' }}>Go to Auction Stage to assign players</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {roster.map((player) => (
                <div
                  key={player.id}
                  style={{ background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 14, position: 'relative' }}
                >
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
                    <div style={{ marginTop: 6 }}>
                      <span
                        className="badge"
                        style={{ background: ROLE_COLORS[player.role]?.bg, color: ROLE_COLORS[player.role]?.text, fontSize: 9 }}
                      >
                        {player.role}
                      </span>
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
